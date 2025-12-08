import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

interface PostCardProps {
  post: PostData;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
}

export function PostCard({ post, onLike, onComment }: PostCardProps) {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  const handleAuthorClick = () => {
    navigate(`/user/${post.author.id}`);
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
            className="gap-1 sm:gap-2 px-2 sm:px-3"
            onClick={() => onComment?.(post.id)}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
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
    </motion.div>
  );
}
