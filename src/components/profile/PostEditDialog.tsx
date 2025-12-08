import { useState, useRef } from "react";
import { Pencil, Trash2, Loader2, Image, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Post {
  id: string;
  content: string;
  tags: string[] | null;
  image_url?: string | null;
  created_at: string | null;
}

interface PostEditDialogProps {
  post: Post;
  onSuccess: () => void;
}

export function PostEditDialog({ post, onSuccess }: PostEditDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(post.content);
  const [tags, setTags] = useState(post.tags?.join(", ") || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(post.image_url || null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedImage(file);
    setRemoveCurrentImage(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveCurrentImage(true);
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

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let imageUrl = post.image_url;

    // Handle image changes
    if (selectedImage) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    } else if (removeCurrentImage) {
      imageUrl = null;
    }

    const { error } = await supabase
      .from("posts")
      .update({
        content: content.trim(),
        tags: tagsArray.length > 0 ? tagsArray : null,
        image_url: imageUrl,
      })
      .eq("id", post.id);

    if (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    } else {
      toast.success("Post updated successfully");
      setOpen(false);
      onSuccess();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await supabase.from("posts").delete().eq("id", post.id);

    if (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } else {
      toast.success("Post deleted successfully");
      setOpen(false);
      onSuccess();
    }
    setIsDeleting(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset to original values when opening
      setContent(post.content);
      setTags(post.tags?.join(", ") || "");
      setSelectedImage(null);
      setImagePreview(post.image_url || null);
      setRemoveCurrentImage(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="What's on your mind?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="startup, tech, AI"
            />
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-48 object-cover rounded-xl"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8 bg-background/80 hover:bg-background"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-4 h-4" />
                Add Image
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your post.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSave} disabled={isSubmitting} className="gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
