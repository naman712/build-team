import { useState, useEffect } from "react";
import { Copy, Mail, MessageCircle, Check, Share2, Users, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface Connection {
  id: string;
  name: string;
  photo_url: string | null;
  connectionId: string;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postContent?: string;
}

export function ShareDialog({ open, onOpenChange, postId, postContent }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const { profile } = useProfile();
  
  // Always use the production domain for sharing
  const PRODUCTION_URL = "https://foundernow.in";
  
  const shareUrl = `${PRODUCTION_URL}/feed?post=${postId}`;
  const shareText = postContent 
    ? `${postContent.slice(0, 100)}${postContent.length > 100 ? '...' : ''}`
    : "Check out this post on FounderNow!";

  useEffect(() => {
    if (showConnections && profile) {
      fetchConnections();
    }
  }, [showConnections, profile]);

  const fetchConnections = async () => {
    if (!profile) return;
    
    setLoadingConnections(true);
    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          requester_id,
          receiver_id,
          requester:profiles!connections_requester_id_fkey(id, name, photo_url),
          receiver:profiles!connections_receiver_id_fkey(id, name, photo_url)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

      if (error) throw error;

      const formattedConnections: Connection[] = (data || []).map((conn: any) => {
        const isRequester = conn.requester_id === profile.id;
        const otherUser = isRequester ? conn.receiver : conn.requester;
        return {
          id: otherUser.id,
          name: otherUser.name || 'Unknown',
          photo_url: otherUser.photo_url,
          connectionId: conn.id,
        };
      });

      setConnections(formattedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error("Failed to load connections");
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleShareWithConnection = async (connection: Connection) => {
    if (!profile) return;
    
    setSendingTo(connection.id);
    try {
      const messageContent = `📌 Shared a post with you:\n\n"${shareText}"\n\n${shareUrl}`;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          connection_id: connection.connectionId,
          sender_id: profile.id,
          content: messageContent,
        });

      if (error) throw error;

      toast.success(`Post shared with ${connection.name}!`);
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error("Failed to share post");
    } finally {
      setSendingTo(null);
    }
  };

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
    const subject = encodeURIComponent("Check out this post on FounderNow");
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    onOpenChange(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FounderNow Post",
          text: shareText,
          url: shareUrl,
        });
        onOpenChange(false);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) setShowConnections(false);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {showConnections ? "Share with Connection" : "Share Post"}
          </DialogTitle>
        </DialogHeader>
        
        {showConnections ? (
          <div className="py-4">
            <Button
              variant="ghost"
              size="sm"
              className="mb-3"
              onClick={() => setShowConnections(false)}
            >
              ← Back
            </Button>
            
            {loadingConnections ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : connections.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No connections yet
              </p>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={connection.photo_url || ""} />
                          <AvatarFallback>{connection.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{connection.name}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleShareWithConnection(connection)}
                        disabled={sendingTo === connection.id}
                      >
                        {sendingTo === connection.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Send"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Share buttons */}
            <div className="flex justify-center gap-3 flex-wrap">
              {profile && (
                <Button
                  variant="outline"
                  size="lg"
                  className="flex flex-col items-center gap-2 h-auto py-4 px-5 hover:bg-primary/10 hover:border-primary/50"
                  onClick={() => setShowConnections(true)}
                >
                  <Users className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium">Message</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                size="lg"
                className="flex flex-col items-center gap-2 h-auto py-4 px-5 hover:bg-green-500/10 hover:border-green-500/50"
                onClick={handleWhatsAppShare}
              >
                <MessageCircle className="w-6 h-6 text-green-500" />
                <span className="text-xs font-medium">WhatsApp</span>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="flex flex-col items-center gap-2 h-auto py-4 px-5 hover:bg-blue-500/10 hover:border-blue-500/50"
                onClick={handleEmailShare}
              >
                <Mail className="w-6 h-6 text-blue-500" />
                <span className="text-xs font-medium">Email</span>
              </Button>
              
              {navigator.share && (
                <Button
                  variant="outline"
                  size="lg"
                  className="flex flex-col items-center gap-2 h-auto py-4 px-5 hover:bg-primary/10 hover:border-primary/50"
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
        )}
      </DialogContent>
    </Dialog>
  );
}
