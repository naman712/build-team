import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Send, MessageSquare, Loader2, Paperclip, Video, X, FileText, Image as ImageIcon } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { playSoundEffect } from "@/hooks/useSoundEffects";
import { triggerHaptic } from "@/hooks/useHapticFeedback";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  attachment_url?: string | null;
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const { profile } = useProfile();
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    if (!profile) return;

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

    const chatPreviews: ChatPreview[] = await Promise.all(
      (connections || []).map(async (conn: any) => {
        const otherProfile = conn.requester_id === profile.id ? conn.receiver : conn.requester;
        
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, attachment_url')
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

        const lastMessageText = lastMsg?.attachment_url 
          ? '📎 Attachment' 
          : (lastMsg?.content || 'Start a conversation');

        return {
          connectionId: conn.id,
          otherProfileId: otherProfile.id,
          name: otherProfile.name || 'Anonymous',
          avatar: otherProfile.photo_url || '',
          lastMessage: lastMessageText,
          timestamp: lastMsg?.created_at ? formatTime(lastMsg.created_at) : '',
          unread: unreadCount || 0,
        };
      })
    );

    setChats(chatPreviews);
    setLoading(false);

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
    if (selectedChat && profile) {
      fetchMessages(selectedChat.connectionId);

      const messagesChannel = supabase
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
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
            if (newMessage.sender_id !== profile.id) {
              playSoundEffect('receiveMessage');
            }
          }
        )
        .subscribe();

      const typingChannel = supabase
        .channel(`typing-${selectedChat.connectionId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = typingChannel.presenceState();
          const otherTyping = Object.values(state).some((presences: any) =>
            presences.some((p: any) => p.isTyping && p.profileId !== profile.id)
          );
          setIsOtherTyping(otherTyping);
        })
        .subscribe();

      typingChannelRef.current = typingChannel;

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(typingChannel);
        typingChannelRef.current = null;
      };
    }
  }, [selectedChat, profile]);

  const handleTyping = () => {
    if (!selectedChat || !profile || !typingChannelRef.current) return;

    typingChannelRef.current.track({
      profileId: profile.id,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (typingChannelRef.current) {
        typingChannelRef.current.track({
          profileId: profile.id,
          isTyping: false,
        });
      }
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadAttachment = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setUploadingFile(true);
    const fileExt = selectedFile.name.split(".").pop();
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("chat-attachments")
      .upload(fileName, selectedFile);

    if (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      setUploadingFile(false);
      return null;
    }

    const { data } = supabase.storage
      .from("chat-attachments")
      .getPublicUrl(fileName);

    setUploadingFile(false);
    return data.publicUrl;
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedChat || !profile) return;

    triggerHaptic('medium');
    setSendingMessage(true);
    
    let attachmentUrl: string | null = null;
    if (selectedFile) {
      attachmentUrl = await uploadAttachment();
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        connection_id: selectedChat.connectionId,
        sender_id: profile.id,
        content: newMessage.trim() || (attachmentUrl ? '' : ''),
        attachment_url: attachmentUrl,
      });

    setSendingMessage(false);

    if (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
      return;
    }

    playSoundEffect('sendMessage');
    setNewMessage("");
    removeFile();
  };

  const handleGoogleMeet = () => {
    triggerHaptic('selection');
    window.open('https://calendar.google.com/calendar/u/0/r/eventedit', '_blank');
  };

  const handleChatSelect = (chat: ChatPreview) => {
    triggerHaptic('selection');
    setSelectedChat(chat);
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

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'attachment';
  };

  const renderMessageContent = (content: string, isOwnMessage: boolean) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline break-all",
              isOwnMessage ? "text-primary-foreground hover:text-primary-foreground/80" : "text-primary hover:text-primary/80"
            )}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0 md:pt-20">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0 md:pt-20">
        <Navbar />
        
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="fixed top-14 bottom-16 md:bottom-0 left-0 right-0 px-2 sm:px-4 py-2 overflow-hidden">
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto h-full flex rounded-2xl overflow-hidden border border-border bg-card shadow-card">
          {/* Chat List */}
          <div className={cn(
            "w-full md:w-80 lg:w-96 border-r border-border flex flex-col",
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
                  onClick={() => handleChatSelect(chat)}
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
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedChat(null);
                    }}
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
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleGoogleMeet}
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Schedule a Google Meet</TooltipContent>
                </Tooltip>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender_id === profile?.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-2 space-y-1",
                        message.sender_id === profile?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      )}
                    >
                      {message.attachment_url && (
                        <div className="mb-2">
                          {isImageUrl(message.attachment_url) ? (
                            <img
                              src={message.attachment_url}
                              alt="attachment"
                              className="rounded-lg max-w-full max-h-60 object-cover"
                            />
                          ) : (
                            <a
                              href={message.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-background/20 rounded-lg hover:bg-background/30 transition-colors"
                            >
                              <FileText className="w-5 h-5" />
                              <span className="text-sm truncate">{getFileName(message.attachment_url)}</span>
                            </a>
                          )}
                        </div>
                      )}
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap">
                          {renderMessageContent(message.content, message.sender_id === profile?.id)}
                        </p>
                      )}
                      <p className={cn(
                        "text-[10px]",
                        message.sender_id === profile?.id
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}>
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isOtherTyping && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* File Preview */}
              {selectedFile && (
                <div className="px-4 py-2 border-t border-border">
                  <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                    {filePreview ? (
                      <img src={filePreview} alt="preview" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={removeFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      triggerHaptic('light');
                      fileInputRef.current?.click();
                    }}
                    disabled={uploadingFile}
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    disabled={sendingMessage || uploadingFile}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={(!newMessage.trim() && !selectedFile) || sendingMessage || uploadingFile}
                  >
                    {sendingMessage || uploadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Select a conversation</h3>
                <p className="text-muted-foreground">Choose a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
