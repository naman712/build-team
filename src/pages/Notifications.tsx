import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, UserPlus, MessageSquare, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "connection_request" | "connection_accepted" | "comment";
  message: string;
  profileName: string;
  profilePhoto: string | null;
  profileId: string;
  createdAt: string;
}

export default function Notifications() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchNotifications = async () => {
      setLoading(true);
      const notifs: Notification[] = [];

      // Fetch pending connection requests
      const { data: pendingConnections } = await supabase
        .from("connections")
        .select(`
          id,
          created_at,
          requester:profiles!connections_requester_id_fkey(id, name, photo_url)
        `)
        .eq("receiver_id", profile.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingConnections) {
        pendingConnections.forEach((conn: any) => {
          if (conn.requester) {
            notifs.push({
              id: `conn-${conn.id}`,
              type: "connection_request",
              message: "sent you a connection request",
              profileName: conn.requester.name || "Someone",
              profilePhoto: conn.requester.photo_url,
              profileId: conn.requester.id,
              createdAt: conn.created_at,
            });
          }
        });
      }

      // Fetch recently accepted connections (where you were the requester)
      const { data: acceptedConnections } = await supabase
        .from("connections")
        .select(`
          id,
          updated_at,
          receiver:profiles!connections_receiver_id_fkey(id, name, photo_url)
        `)
        .eq("requester_id", profile.id)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false })
        .limit(10);

      if (acceptedConnections) {
        acceptedConnections.forEach((conn: any) => {
          if (conn.receiver) {
            notifs.push({
              id: `accepted-${conn.id}`,
              type: "connection_accepted",
              message: "accepted your connection request",
              profileName: conn.receiver.name || "Someone",
              profilePhoto: conn.receiver.photo_url,
              profileId: conn.receiver.id,
              createdAt: conn.updated_at,
            });
          }
        });
      }

      // Fetch comments on your posts
      const { data: userPosts } = await supabase
        .from("posts")
        .select("id")
        .eq("profile_id", profile.id);

      if (userPosts && userPosts.length > 0) {
        const postIds = userPosts.map((p) => p.id);
        
        const { data: comments } = await supabase
          .from("post_comments")
          .select(`
            id,
            created_at,
            profile:profiles!post_comments_profile_id_fkey(id, name, photo_url)
          `)
          .in("post_id", postIds)
          .neq("profile_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (comments) {
          comments.forEach((comment: any) => {
            if (comment.profile) {
              notifs.push({
                id: `comment-${comment.id}`,
                type: "comment",
                message: "commented on your post",
                profileName: comment.profile.name || "Someone",
                profilePhoto: comment.profile.photo_url,
                profileId: comment.profile.id,
                createdAt: comment.created_at,
              });
            }
          });
        }
      }

      // Sort by date
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setNotifications(notifs);
      setLoading(false);
    };

    fetchNotifications();
  }, [profile]);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "connection_request":
        return <UserPlus className="w-4 h-4 text-primary" />;
      case "connection_accepted":
        return <Check className="w-4 h-4 text-success" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-accent" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === "connection_request") {
      navigate("/connections");
    } else {
      navigate(`/user/${notification.profileId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={notification.profilePhoto || ""} />
                            <AvatarFallback>{notification.profileName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-card flex items-center justify-center">
                            {getIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-semibold">{notification.profileName}</span>{" "}
                            <span className="text-muted-foreground">{notification.message}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}