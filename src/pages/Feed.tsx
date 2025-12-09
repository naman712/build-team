import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { triggerHaptic } from "@/hooks/useHapticFeedback";

interface PostWithAuthor {
  id: string;
  content: string;
  image_url: string | null;
  tags: string[];
  created_at: string;
  profile_id: string;
  profile: {
    id: string;
    name: string | null;
    photo_url: string | null;
    looking_for: string | null;
  };
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

export default function Feed() {
  const { profile, isProfileComplete } = useProfile();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const { data: postsData, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        image_url,
        tags,
        created_at,
        profile_id,
        profiles!posts_profile_id_fkey (
          id,
          name,
          photo_url,
          looking_for
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
      return;
    }

    const postsWithCounts = await Promise.all(
      (postsData || []).map(async (post) => {
        const [likesResult, commentsResult, userLikeResult] = await Promise.all([
          supabase.from('post_likes').select('id', { count: 'exact' }).eq('post_id', post.id),
          supabase.from('post_comments').select('id', { count: 'exact' }).eq('post_id', post.id),
          profile 
            ? supabase.from('post_likes').select('id').eq('post_id', post.id).eq('profile_id', profile.id).maybeSingle()
            : Promise.resolve({ data: null })
        ]);

        return {
          id: post.id,
          content: post.content,
          image_url: post.image_url,
          tags: post.tags || [],
          created_at: post.created_at,
          profile_id: post.profile_id,
          profile: post.profiles as any,
          likes_count: likesResult.count || 0,
          comments_count: commentsResult.count || 0,
          user_liked: !!userLikeResult.data,
        };
      })
    );

    setPosts(postsWithCounts);
    setLoading(false);
  }, [profile]);

  const handleRefresh = useCallback(async () => {
    triggerHaptic('medium');
    await fetchPosts();
  }, [fetchPosts]);

  const { containerRef, pullDistance, isRefreshing, threshold } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('feed-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          const newPost = payload.new as any;
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, name, photo_url, looking_for')
            .eq('id', newPost.profile_id)
            .single();

          if (profileData) {
            const formattedPost: PostWithAuthor = {
              id: newPost.id,
              content: newPost.content,
              image_url: newPost.image_url,
              tags: newPost.tags || [],
              created_at: newPost.created_at,
              profile_id: newPost.profile_id,
              profile: profileData,
              likes_count: 0,
              comments_count: 0,
              user_liked: false,
            };
            setPosts(prev => [formattedPost, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_likes' },
        (payload) => {
          const like = payload.new as any;
          setPosts(prev => prev.map(p => 
            p.id === like.post_id 
              ? { 
                  ...p, 
                  likes_count: p.likes_count + 1,
                  user_liked: profile?.id === like.profile_id ? true : p.user_liked
                }
              : p
          ));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_likes' },
        (payload) => {
          const like = payload.old as any;
          setPosts(prev => prev.map(p => 
            p.id === like.post_id 
              ? { 
                  ...p, 
                  likes_count: Math.max(0, p.likes_count - 1),
                  user_liked: profile?.id === like.profile_id ? false : p.user_liked
                }
              : p
          ));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments' },
        (payload) => {
          const comment = payload.new as any;
          setPosts(prev => prev.map(p => 
            p.id === comment.post_id 
              ? { ...p, comments_count: p.comments_count + 1 }
              : p
          ));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_comments' },
        (payload) => {
          const comment = payload.old as any;
          setPosts(prev => prev.map(p => 
            p.id === comment.post_id 
              ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
              : p
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const handleNewPost = async (content: string, imageUrl?: string) => {
    if (!profile) {
      toast.error("Please log in to create a post");
      return;
    }

    if (!isProfileComplete) {
      toast.error("Complete your profile to create posts");
      return;
    }

    triggerHaptic('medium');

    const { error } = await supabase
      .from('posts')
      .insert({
        profile_id: profile.id,
        content,
        tags: [],
        image_url: imageUrl || null,
      });

    if (error) {
      console.error('Error creating post:', error);
      toast.error("Failed to create post");
      return;
    }

    toast.success("Post published!");
    fetchPosts();
  };

  const handleLike = async (postId: string) => {
    if (!profile) {
      toast.error("Please log in to like posts");
      return;
    }

    triggerHaptic('light');

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.user_liked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('profile_id', profile.id);
    } else {
      await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          profile_id: profile.id,
        });
    }

    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { 
            ...p, 
            user_liked: !p.user_liked, 
            likes_count: p.user_liked ? p.likes_count - 1 : p.likes_count + 1 
          }
        : p
    ));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0 pt-16 md:pt-20">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background pb-24 md:pb-0 pt-16 md:pt-20"
    >
      <Navbar />
      
      {/* Pull to refresh indicator */}
      <div 
        className="fixed left-0 right-0 flex justify-center z-40 pointer-events-none md:hidden"
        style={{ 
          top: 64,
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          opacity: pullDistance > 0 ? 1 : 0,
          transition: pullDistance === 0 ? 'all 0.3s ease' : 'none',
        }}
      >
        <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
          <RefreshCw 
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${(pullDistance / threshold) * 180}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.1s',
            }}
          />
        </div>
      </div>
      
      <main 
        className="container mx-auto px-4 py-4 sm:py-6"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
        }}
      >
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {isProfileComplete && <CreatePost onPost={handleNewPost} />}
          
          {posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your startup journey!
              </p>
            </motion.div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  id: post.id,
                  author: {
                    id: post.profile.id,
                    name: post.profile.name || "Anonymous",
                    avatar: post.profile.photo_url || "",
                    role: post.profile.looking_for || "Founder",
                  },
                  content: post.content,
                  image: post.image_url || undefined,
                  tags: post.tags,
                  likes: post.likes_count,
                  comments: post.comments_count,
                  timestamp: formatTimestamp(post.created_at),
                  isLiked: post.user_liked,
                }}
                onLike={handleLike}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
