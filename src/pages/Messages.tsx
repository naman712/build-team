import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Send, MessageSquare, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

interface ChatPreview {
  connectionId: string;
  otherProfileId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const { profile } = useProfile();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    if (!profile) return;

    // Get all accepted connections
    const { data: connections, error } = await supabase
      .from('connections')
      .select(`
        id,
        requester_id,
        receiver_id,
        requester:profiles!connections_requester_id_fkey (
          id,
          name,
          photo_url
        ),
        receiver:profiles!connections_receiver_id_fkey (
          id,
          name,
          photo_url
        )
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

    if (error) {
      console.error('Error fetching connections:', error);
      setLoading(false);
      return;
    }

    // Get last message for each connection
    const chatPreviews: ChatPreview[] = await Promise.all(
      (connections || []).map(async (conn: any) => {
        const otherProfile = conn.requester_id === profile.id ? conn.receiver : conn.requester;
        
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('connection_id', conn.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('connection_id', conn.id)
          .neq('sender_id', profile.id)
          .is('read_at', null);

        return {
          connectionId: conn.id,
          otherProfileId: otherProfile.id,
          name: otherProfile.name || 'Anonymous',
          avatar: otherProfile.photo_url || '',
          lastMessage: lastMsg?.content || 'Start a conversation',
          timestamp: lastMsg?.created_at ? formatTime(lastMsg.created_at) : '',
          unread: unreadCount || 0,
        };
      })
    );

    setChats(chatPreviews);
    setLoading(false);

    // Auto-select chat from URL param
    const connectionParam = searchParams.get('connection');
    if (connectionParam) {
      const chat = chatPreviews.find(c => c.connectionId === connectionParam);
      if (chat) {
        setSelectedChat(chat);
      }
    }
  };

  const fetchMessages = async (connectionId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);

    // Mark messages as read
    if (profile) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('connection_id', connectionId)
        .neq('sender_id', profile.id)
        .is('read_at', null);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchChats();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.connectionId);

      // Subscribe to new messages
      const channel = supabase
        .channel(`messages-${selectedChat.connectionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `connection_id=eq.${selectedChat.connectionId}`,
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat || !profile) return;

    setSendingMessage(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        connection_id: selectedChat.connectionId,
        sender_id: profile.id,
        content: newMessage.trim(),
      });

    setSendingMessage(false);

    if (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
      return;
    }

    setNewMessage("");
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-20">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-20">
        <Navbar />
        
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No messages yet</h2>
              <p className="text-muted-foreground mb-6">
                Connect with founders to start chatting!
              </p>
              <Button asChild>
                <a href="/discover">Find Co-founders</a>
              </Button>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-border bg-card shadow-card">
          {/* Chat List */}
          <div className={cn(
            "w-full md:w-80 border-r border-border flex flex-col",
            selectedChat && "hidden md:flex"
          )}>
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => (
                <motion.button
                  key={chat.connectionId}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left",
                    selectedChat?.connectionId === chat.connectionId && "bg-secondary"
                  )}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{chat.name}</h3>
                      <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {chat.unread}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          {selectedChat ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setSelectedChat(null)}
                >
                  ←
                </Button>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedChat.avatar} />
                  <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedChat.name}</h3>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex",
                      message.sender_id === profile?.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2",
                        message.sender_id === profile?.id
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary rounded-bl-md"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        message.sender_id === profile?.id
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}>
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={sendingMessage}
                  />
                  <Button onClick={handleSend} size="icon" disabled={sendingMessage}>
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
