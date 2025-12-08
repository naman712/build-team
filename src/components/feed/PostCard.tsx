import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { playSoundEffect } from "@/hooks/useSoundEffects";

export interface PostData {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  image?: string;
  tags: string[];
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profile: {
    id: string;
    name: string | null;
    photo_url: string | null;
  };
}

interface PostCardProps {
  post: PostData;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
}

export function PostCard({ post, onLike }: PostCardProps) {
  const navigate = useNavigate();
  const { profile, isProfileComplete } = useProfile();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        id,
        content,
        created_at,
        profiles!post_comments_profile_id_fkey (
          id,
          name,
          photo_url
        )
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments((data || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        profile: c.profiles,
      })));
    }
    setLoadingComments(false);
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, post.id]);

  const handleLike = () => {
    if (!isLiked) {
      playSoundEffect('like');
    }
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  const handleAuthorClick = () => {
    navigate(`/user/${post.author.id}`);
  };

  const handleCommentClick = () => {
    setShowComments(!showComments);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    if (!profile) {
      toast.error("Please log in to comment");
      return;
    }

    if (!isProfileComplete) {
      toast.error("Complete your profile to comment");
      return;
    }

    setSubmittingComment(true);
    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: post.id,
        profile_id: profile.id,
        content: newComment.trim(),
      });

    if (error) {
      console.error('Error posting comment:', error);
      toast.error("Failed to post comment");
    } else {
      setNewComment("");
      // Add the new comment to local state immediately
      setComments(prev => [...prev, {
        id: crypto.randomUUID(),
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        profile: {
          id: profile.id,
          name: profile.name,
          photo_url: profile.photo_url,
        },
      }]);
      toast.success("Comment posted!");
    }
    setSubmittingComment(false);
  };

  const formatCommentTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-card overflow-hidden border border-border/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0 flex-1"
          onClick={handleAuthorClick}
        >
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-primary/20 flex-shrink-0">
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{post.author.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{post.author.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <span className="text-[10px] sm:text-xs text-muted-foreground">{post.timestamp}</span>
          <Button variant="ghost" size="icon" className="text-muted-foreground w-8 h-8 sm:w-10 sm:h-10">
            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 pb-3">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
          {post.content}
        </p>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="px-3 sm:px-4 pb-3 flex flex-wrap gap-1.5 sm:gap-2">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer text-xs"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Image */}
      {post.image && (
        <div className="px-3 sm:px-4 pb-3">
          <img
            src={post.image}
            alt="Post attachment"
            className="w-full rounded-xl object-cover max-h-64 sm:max-h-96"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-t border-border/50">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1 sm:gap-2 hover:text-destructive px-2 sm:px-3",
              isLiked && "text-destructive"
            )}
            onClick={handleLike}
          >
            <motion.div
              whileTap={{ scale: 1.3 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5", isLiked && "fill-current")} />
            </motion.div>
            <span className="font-medium text-xs sm:text-sm">{likeCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1 sm:gap-2 px-2 sm:px-3", showComments && "text-primary")}
            onClick={handleCommentClick}
          >
            <MessageCircle className={cn("w-4 h-4 sm:w-5 sm:h-5", showComments && "fill-primary/20")} />
            <span className="font-medium text-xs sm:text-sm">{post.comments}</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn("w-8 h-8 sm:w-10 sm:h-10", isBookmarked && "text-primary")}
          onClick={() => setIsBookmarked(!isBookmarked)}
        >
          <Bookmark className={cn("w-4 h-4 sm:w-5 sm:h-5", isBookmarked && "fill-current")} />
        </Button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/50 overflow-hidden"
          >
            <div className="p-3 sm:p-4 space-y-3">
              {/* Comment Input */}
              {profile && (
                <div className="flex gap-2 sm:gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={profile.photo_url || ""} />
                    <AvatarFallback>{profile.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder={isProfileComplete ? "Write a comment..." : "Complete profile to comment"}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmitComment()}
                      disabled={!isProfileComplete || submittingComment}
                      className="flex-1 h-8 sm:h-9 text-sm"
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || !isProfileComplete || submittingComment}
                    >
                      {submittingComment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-2">
                  No comments yet. Be the first!
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2 sm:gap-3">
                      <Avatar 
                        className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/user/${comment.profile.id}`)}
                      >
                        <AvatarImage src={comment.profile.photo_url || ""} />
                        <AvatarFallback>{comment.profile.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-secondary/50 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span 
                              className="font-medium text-xs sm:text-sm cursor-pointer hover:underline"
                              onClick={() => navigate(`/user/${comment.profile.id}`)}
                            >
                              {comment.profile.name || "Anonymous"}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {formatCommentTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-foreground">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
