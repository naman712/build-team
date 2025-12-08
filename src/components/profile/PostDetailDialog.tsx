import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  content: string;
  tags: string[] | null;
  created_at: string | null;
  image_url?: string | null;
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

interface PostDetailDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostUpdated?: () => void;
}

export function PostDetailDialog({ post, open, onOpenChange, onPostUpdated }: PostDetailDialogProps) {
  const { profile, isProfileComplete } = useProfile();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLikes();
      fetchComments();
    }
  }, [open, post.id]);

  const fetchLikes = async () => {
    const { count } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    setLikeCount(count || 0);

    if (profile) {
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("profile_id", profile.id)
        .maybeSingle();

      setIsLiked(!!data);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from("post_comments")
      .select(`
        id,
        content,
        created_at,
        profile:profiles!post_comments_profile_id_fkey(id, name, photo_url)
      `)
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data as Comment[]);
    }
    setLoadingComments(false);
  };

  const handleLike = async () => {
    if (!profile) {
      toast.error("Please log in to like posts");
      return;
    }

    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("profile_id", profile.id);
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      await supabase.from("post_likes").insert({
        post_id: post.id,
        profile_id: profile.id,
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!profile) {
      toast.error("Please log in to comment");
      return;
    }

    if (!isProfileComplete) {
      toast.error("Please complete your profile to comment");
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);
    const { error } = await supabase.from("post_comments").insert({
      post_id: post.id,
      profile_id: profile.id,
      content: newComment.trim(),
    });

    if (error) {
      toast.error("Failed to add comment");
    } else {
      setNewComment("");
      fetchComments();
      onPostUpdated?.();
    }
    setSubmittingComment(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Post Details</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-4 space-y-4">
            {/* Post Content */}
            <div>
              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
              
              {post.image_url && (
                <div className="mt-3 rounded-xl overflow-hidden">
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full object-cover"
                  />
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-3">
                {post.created_at
                  ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                  : ""}
              </p>
            </div>

            {/* Like & Comment Stats */}
            <div className="flex items-center gap-4 py-2 border-y">
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-2", isLiked && "text-destructive")}
                onClick={handleLike}
              >
                <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                <span>{likeCount}</span>
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="w-5 h-5" />
                <span>{comments.length}</span>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Comments</h4>
              
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <AnimatePresence>
                  {comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.profile.photo_url || ""} />
                        <AvatarFallback className="text-xs">
                          {comment.profile.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-secondary/50 rounded-lg p-2">
                        <p className="text-xs font-semibold">{comment.profile.name}</p>
                        <p className="text-sm">{comment.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Comment Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              disabled={submittingComment}
            />
            <Button
              size="icon"
              onClick={handleSubmitComment}
              disabled={submittingComment || !newComment.trim()}
            >
              {submittingComment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}