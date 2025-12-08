import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Smile, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CreatePostProps {
  onPost?: (content: string) => void;
}

export function CreatePost({ onPost }: CreatePostProps) {
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
    toast.success("Post published successfully!");
  };

  return (
    <motion.div
      layout
      className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar className="w-12 h-12 ring-2 ring-primary/20">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
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
                    placeholder="Share your startup journey, ideas, or ask for advice..."
                    className="min-h-[120px] border-0 bg-transparent resize-none focus-visible:ring-0 text-base"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setIsExpanded(false);
                      setContent("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="p-3 text-muted-foreground">
                  Share your startup journey, ideas, or ask for advice...
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
            className="px-4 pb-4"
          >
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Image className="w-5 h-5 mr-2" />
                  Photo
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Smile className="w-5 h-5 mr-2" />
                  Emoji
                </Button>
              </div>
              
              <Button
                onClick={handlePost}
                disabled={!content.trim()}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Post
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
