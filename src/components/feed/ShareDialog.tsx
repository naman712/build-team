import { useState } from "react";
import { Copy, Mail, MessageCircle, Check, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postContent?: string;
}

export function ShareDialog({ open, onOpenChange, postId, postContent }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/feed?post=${postId}`;
  const shareText = postContent 
    ? `${postContent.slice(0, 100)}${postContent.length > 100 ? '...' : ''}`
    : "Check out this post on FounderHive!";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.open(whatsappUrl, "_blank");
    onOpenChange(false);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent("Check out this post on FounderHive");
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    onOpenChange(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FounderHive Post",
          text: shareText,
          url: shareUrl,
        });
        onOpenChange(false);
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Share Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Share buttons */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex flex-col items-center gap-2 h-auto py-4 px-6 hover:bg-green-500/10 hover:border-green-500/50"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="w-6 h-6 text-green-500" />
              <span className="text-xs font-medium">WhatsApp</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="flex flex-col items-center gap-2 h-auto py-4 px-6 hover:bg-blue-500/10 hover:border-blue-500/50"
              onClick={handleEmailShare}
            >
              <Mail className="w-6 h-6 text-blue-500" />
              <span className="text-xs font-medium">Email</span>
            </Button>
            
            {navigator.share && (
              <Button
                variant="outline"
                size="lg"
                className="flex flex-col items-center gap-2 h-auto py-4 px-6 hover:bg-primary/10 hover:border-primary/50"
                onClick={handleNativeShare}
              >
                <Share2 className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium">More</span>
              </Button>
            )}
          </div>

          {/* Copy link section */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">Or copy link</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="flex-1 text-sm bg-secondary/50"
              />
              <Button
                variant="secondary"
                size="icon"
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
