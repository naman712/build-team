import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Smile, Send, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CreatePostProps {
  onPost?: (content: string, imageUrl?: string) => void;
}

export function CreatePost({ onPost }: CreatePostProps) {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;

    const fileExt = selectedImage.name.split(".").pop();
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("post-images")
      .upload(fileName, selectedImage);

    if (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }

    const { data } = supabase.storage
      .from("post-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handlePost = async () => {
    if (!content.trim()) {
      toast.error("Please write something to post!");
      return;
    }

    setIsUploading(true);
    let imageUrl: string | undefined;

    if (selectedImage) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    onPost?.(content, imageUrl);
    setContent("");
    setSelectedImage(null);
    setImagePreview(null);
    setIsExpanded(false);
    setIsUploading(false);
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
                      removeImage();
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

            {/* Image Preview */}
            {imagePreview && isExpanded && (
              <div className="relative mt-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-xl"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8 bg-background/80 hover:bg-background"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
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
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground px-2 sm:px-3 text-xs sm:text-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
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
                disabled={!content.trim() || isUploading}
                className="gap-1 sm:gap-2 text-sm"
                size="sm"
              >
                {isUploading ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                Post
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
