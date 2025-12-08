import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Loader2, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ConnectionCard } from "@/components/connections/ConnectionCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface ConnectionWithProfile {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  requester_id: string;
  receiver_id: string;
  requester_profile: {
    id: string;
    name: string | null;
    photo_url: string | null;
    looking_for: string | null;
    city: string | null;
    interests: string[] | null;
  };
  receiver_profile: {
    id: string;
    name: string | null;
    photo_url: string | null;
    looking_for: string | null;
    city: string | null;
    interests: string[] | null;
  };
}

export default function Connections() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

  const fetchConnections = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('connections')
      .select(`
        id,
        status,
        requester_id,
        receiver_id,
        requester:profiles!connections_requester_id_fkey (
          id,
          name,
          photo_url,
          looking_for,
          city,
          interests
        ),
        receiver:profiles!connections_receiver_id_fkey (
          id,
          name,
          photo_url,
          looking_for,
          city,
          interests
        )
      `)
      .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .neq('status', 'rejected');

    if (error) {
      console.error('Error fetching connections:', error);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((conn: any) => ({
      id: conn.id,
      status: conn.status,
      requester_id: conn.requester_id,
      receiver_id: conn.receiver_id,
      requester_profile: conn.requester,
      receiver_profile: conn.receiver,
    }));

    setConnections(mapped);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      fetchConnections();
    }
  }, [profile]);

  // Get all unique interests from connections for filter chips
  const allInterests = useMemo(() => {
    const interests = new Set<string>();
    connections.forEach((conn) => {
      const otherProfile = getOtherProfile(conn);
      otherProfile.interests?.forEach((interest) => interests.add(interest));
    });
    return Array.from(interests).slice(0, 10); // Limit to 10 interests
  }, [connections, profile?.id]);

  // Filter function for connections
  const filterConnections = (conns: ConnectionWithProfile[]) => {
    return conns.filter((conn) => {
      const otherProfile = getOtherProfile(conn);
      const searchLower = searchQuery.toLowerCase();
      
      // Search by name, city, or looking_for
      const matchesSearch = !searchQuery || 
        (otherProfile.name?.toLowerCase().includes(searchLower)) ||
        (otherProfile.city?.toLowerCase().includes(searchLower)) ||
        (otherProfile.looking_for?.toLowerCase().includes(searchLower));
      
      // Filter by interest
      const matchesInterest = !selectedInterest ||
        otherProfile.interests?.includes(selectedInterest);
      
      return matchesSearch && matchesInterest;
    });
  };

  const pendingReceived = filterConnections(
    connections.filter((c) => c.status === 'pending' && c.receiver_id === profile?.id)
  );
  const pendingSent = filterConnections(
    connections.filter((c) => c.status === 'pending' && c.requester_id === profile?.id)
  );
  const connected = filterConnections(
    connections.filter((c) => c.status === 'accepted')
  );

  const getOtherProfile = (conn: ConnectionWithProfile) => {
    return conn.requester_id === profile?.id ? conn.receiver_profile : conn.requester_profile;
  };

  const handleAccept = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);

    if (error) {
      console.error('Error accepting connection:', error);
      toast.error("Failed to accept connection");
      return;
    }

    const connection = connections.find((c) => c.id === connectionId);
    const otherProfile = connection ? getOtherProfile(connection) : null;
    toast.success(`You're now connected with ${otherProfile?.name}!`);
    fetchConnections();
  };

  const handleReject = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'rejected' })
      .eq('id', connectionId);

    if (error) {
      console.error('Error rejecting connection:', error);
      toast.error("Failed to decline connection");
      return;
    }

    toast.info("Connection request declined");
    fetchConnections();
  };

  const handleRemove = async (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId);
    const otherProfile = connection ? getOtherProfile(connection) : null;

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      console.error('Error removing connection:', error);
      toast.error("Failed to remove connection");
      return;
    }

    toast.success(`Removed connection with ${otherProfile?.name}`);
    fetchConnections();
  };

  const handleMessage = (connectionId: string) => {
    navigate(`/messages?connection=${connectionId}`);
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Connections</h1>
            <p className="text-muted-foreground">
              Manage your network and connect with fellow founders
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, city, or what they're looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {allInterests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground py-1">Interests:</span>
                {allInterests.map((interest) => (
                  <Badge
                    key={interest}
                    variant={selectedInterest === interest ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setSelectedInterest(
                      selectedInterest === interest ? null : interest
                    )}
                  >
                    {interest}
                    {selectedInterest === interest && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="received" className="relative text-xs sm:text-sm px-2 sm:px-3">
                <span className="hidden sm:inline">Requests</span>
                <span className="sm:hidden">Reqs</span>
                {pendingReceived.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-primary text-primary-foreground text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                    {pendingReceived.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="text-xs sm:text-sm px-2 sm:px-3">Sent</TabsTrigger>
              <TabsTrigger value="connected" className="text-xs sm:text-sm px-2 sm:px-3">
                <span className="hidden sm:inline">Connected</span>
                <span className="sm:hidden">Conn</span>
                <span className="ml-1">({connected.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4">
              {pendingReceived.length === 0 ? (
                <EmptyState message="No pending requests" />
              ) : (
                pendingReceived.map((connection) => {
                  const otherProfile = getOtherProfile(connection);
                  return (
                    <ConnectionCard
                      key={connection.id}
                      connection={{
                        id: connection.id,
                        profileId: otherProfile.id,
                        name: otherProfile.name || "Anonymous",
                        avatar: otherProfile.photo_url || "",
                        role: otherProfile.looking_for || "Founder",
                        city: otherProfile.city || "",
                        lookingFor: otherProfile.looking_for || "",
                        status: "pending_received",
                      }}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {pendingSent.length === 0 ? (
                <EmptyState message="No pending requests sent" />
              ) : (
                pendingSent.map((connection) => {
                  const otherProfile = getOtherProfile(connection);
                  return (
                    <ConnectionCard
                      key={connection.id}
                      connection={{
                        id: connection.id,
                        profileId: otherProfile.id,
                        name: otherProfile.name || "Anonymous",
                        avatar: otherProfile.photo_url || "",
                        role: otherProfile.looking_for || "Founder",
                        city: otherProfile.city || "",
                        lookingFor: otherProfile.looking_for || "",
                        status: "pending_sent",
                      }}
                    />
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="connected" className="space-y-4">
              {connected.length === 0 ? (
                <EmptyState message="No connections yet" />
              ) : (
                connected.map((connection) => {
                  const otherProfile = getOtherProfile(connection);
                  return (
                    <ConnectionCard
                      key={connection.id}
                      connection={{
                        id: connection.id,
                        profileId: otherProfile.id,
                        name: otherProfile.name || "Anonymous",
                        avatar: otherProfile.photo_url || "",
                        role: otherProfile.looking_for || "Founder",
                        city: otherProfile.city || "",
                        lookingFor: otherProfile.looking_for || "",
                        status: "connected",
                      }}
                      onMessage={handleMessage}
                      onRemove={handleRemove}
                    />
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
      <p className="text-sm text-muted-foreground mt-2">
        Start swiping to find your co-founder!
      </p>
    </div>
  );
}
