import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Smile, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

interface CreatePostProps {
  onPost?: (content: string) => void;
}

export function CreatePost({ onPost }: CreatePostProps) {
  const { profile } = useProfile();
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePost = () => {
    if (!content.trim()) {
      toast.error("Please write something to post!");
      return;
    }
    onPost?.(content);
    setContent("");
    setIsExpanded(false);
  };

  return (
    <motion.div
      layout
      className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
    >
      <div className="p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-primary/20 flex-shrink-0">
            <AvatarImage src={profile?.photo_url || ""} />
            <AvatarFallback>{profile?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div
              onClick={() => setIsExpanded(true)}
              className={`bg-secondary/50 rounded-xl transition-all ${
                isExpanded ? "" : "cursor-pointer hover:bg-secondary"
              }`}
            >
              {isExpanded ? (
                <div className="relative">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your startup journey..."
                    className="min-h-[100px] sm:min-h-[120px] border-0 bg-transparent resize-none focus-visible:ring-0 text-sm sm:text-base"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 text-muted-foreground hover:text-foreground w-8 h-8"
                    onClick={() => {
                      setIsExpanded(false);
                      setContent("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="p-2 sm:p-3 text-muted-foreground text-sm sm:text-base">
                  Share your startup journey...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 sm:px-4 pb-3 sm:pb-4"
          >
            <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border/50">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Button variant="ghost" size="sm" className="text-muted-foreground px-2 sm:px-3 text-xs sm:text-sm">
                  <Image className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground px-2 sm:px-3 text-xs sm:text-sm">
                  <Smile className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">Emoji</span>
                </Button>
              </div>
              
              <Button
                onClick={handlePost}
                disabled={!content.trim()}
                className="gap-1 sm:gap-2 text-sm"
                size="sm"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                Post
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
