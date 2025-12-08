import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { toast } from "sonner";

export function useNotifications() {
  const { profile } = useProfile();
  const permissionGranted = useRef(false);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        permissionGranted.current = permission === "granted";
        if (permission === "granted") {
          console.log("Notification permission granted");
        }
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      permissionGranted.current = true;
    }
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    console.log("Setting up notification subscriptions for profile:", profile.id);

    // Subscribe to new connection requests (where current user is the receiver)
    const connectionsChannel = supabase
      .channel('connection-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connections',
          filter: `receiver_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.log("New connection request received:", payload);
          const newConnection = payload.new as any;
          
          // Fetch requester's profile
          const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('name, photo_url')
            .eq('id', newConnection.requester_id)
            .maybeSingle();

          const requesterName = requesterProfile?.name || "Someone";
          
          // Show toast notification
          toast.info(`${requesterName} sent you a connection request!`, {
            action: {
              label: "View",
              onClick: () => window.location.href = "/connections",
            },
          });

          // Show browser notification
          showBrowserNotification(
            "New Connection Request",
            `${requesterName} wants to connect with you!`,
            requesterProfile?.photo_url
          );
        }
      )
      .subscribe();

    // Subscribe to comments on user's posts
    const commentsChannel = supabase
      .channel('comment-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
        },
        async (payload) => {
          console.log("New comment received:", payload);
          const newComment = payload.new as any;
          
          // Check if this comment is on one of the user's posts
          const { data: post } = await supabase
            .from('posts')
            .select('id, profile_id, content')
            .eq('id', newComment.post_id)
            .maybeSingle();

          // Only notify if the comment is on the user's own post
          // and the comment is not from the user themselves
          if (post?.profile_id === profile.id && newComment.profile_id !== profile.id) {
            // Fetch commenter's profile
            const { data: commenterProfile } = await supabase
              .from('profiles')
              .select('name, photo_url')
              .eq('id', newComment.profile_id)
              .maybeSingle();

            const commenterName = commenterProfile?.name || "Someone";
            const postPreview = post.content?.substring(0, 30) + (post.content?.length > 30 ? "..." : "");

            // Show toast notification
            toast.info(`${commenterName} commented on your post`, {
              description: `"${newComment.content.substring(0, 50)}${newComment.content.length > 50 ? "..." : ""}"`,
              action: {
                label: "View",
                onClick: () => window.location.href = "/feed",
              },
            });

            // Show browser notification
            showBrowserNotification(
              "New Comment",
              `${commenterName} commented: "${newComment.content.substring(0, 50)}${newComment.content.length > 50 ? "..." : ""}"`,
              commenterProfile?.photo_url
            );
          }
        }
      )
      .subscribe();

    // Subscribe to connection accepted notifications
    const acceptedChannel = supabase
      .channel('connection-accepted-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'connections',
          filter: `requester_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.log("Connection update received:", payload);
          const updatedConnection = payload.new as any;
          const oldConnection = payload.old as any;

          // Only notify if status changed to accepted
          if (updatedConnection.status === 'accepted' && oldConnection.status !== 'accepted') {
            // Fetch receiver's profile
            const { data: receiverProfile } = await supabase
              .from('profiles')
              .select('name, photo_url')
              .eq('id', updatedConnection.receiver_id)
              .maybeSingle();

            const receiverName = receiverProfile?.name || "Someone";

            // Show toast notification
            toast.success(`${receiverName} accepted your connection request!`, {
              action: {
                label: "Message",
                onClick: () => window.location.href = "/messages",
              },
            });

            // Show browser notification
            showBrowserNotification(
              "Connection Accepted!",
              `${receiverName} accepted your connection request. You can now message them!`,
              receiverProfile?.photo_url
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(connectionsChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(acceptedChannel);
    };
  }, [profile?.id]);

  const showBrowserNotification = (title: string, body: string, icon?: string | null) => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    if (Notification.permission === "granted") {
      try {
        const notification = new Notification(title, {
          body,
          icon: icon || "/favicon.ico",
          badge: "/favicon.ico",
          tag: `${title}-${Date.now()}`,
          requireInteraction: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Your browser doesn't support notifications");
      return false;
    }

    const permission = await Notification.requestPermission();
    permissionGranted.current = permission === "granted";
    
    if (permission === "granted") {
      toast.success("Notifications enabled!");
      return true;
    } else {
      toast.error("Notification permission denied");
      return false;
    }
  };

  return { requestPermission };
}
