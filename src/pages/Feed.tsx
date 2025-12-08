import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

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

  const fetchPosts = async () => {
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

    // Get likes and comments counts
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
  };

  useEffect(() => {
    fetchPosts();
  }, [profile]);

  const handleNewPost = async (content: string) => {
    if (!profile) {
      toast.error("Please log in to create a post");
      return;
    }

    if (!isProfileComplete) {
      toast.error("Complete your profile to create posts");
      return;
    }

    const { error } = await supabase
      .from('posts')
      .insert({
        profile_id: profile.id,
        content,
        tags: [],
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

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.user_liked) {
      // Unlike
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('profile_id', profile.id);
    } else {
      // Like
      await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          profile_id: profile.id,
        });
    }

    // Update local state
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
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-20">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-xl mx-auto space-y-6">
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
