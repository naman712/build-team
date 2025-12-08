import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

interface UnreadCounts {
  connections: number;
  messages: number;
}

export function useUnreadCounts() {
  const { profile } = useProfile();
  const [counts, setCounts] = useState<UnreadCounts>({ connections: 0, messages: 0 });

  useEffect(() => {
    if (!profile?.id) return;

    const fetchCounts = async () => {
      // Fetch pending connection requests where user is receiver
      const { count: pendingConnections } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', profile.id)
        .eq('status', 'pending');

      // Fetch unread messages
      const { data: userConnections } = await supabase
        .from('connections')
        .select('id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

      let unreadMessages = 0;
      if (userConnections && userConnections.length > 0) {
        const connectionIds = userConnections.map(c => c.id);
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('connection_id', connectionIds)
          .neq('sender_id', profile.id)
          .is('read_at', null);
        
        unreadMessages = count || 0;
      }

      setCounts({
        connections: pendingConnections || 0,
        messages: unreadMessages,
      });
    };

    fetchCounts();

    // Subscribe to changes
    const connectionsChannel = supabase
      .channel('unread-connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
        },
        () => fetchCounts()
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(connectionsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [profile?.id]);

  return counts;
}
