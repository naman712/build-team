import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { ConnectionCard, ConnectionData } from "@/components/connections/ConnectionCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const initialConnections: ConnectionData[] = [
  {
    id: "1",
    name: "Emma Wilson",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    role: "UX Designer @ Meta",
    city: "New York",
    lookingFor: "Technical Co-founder",
    status: "pending_received",
  },
  {
    id: "2",
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
    role: "Software Engineer @ Google",
    city: "Seattle",
    lookingFor: "Business Co-founder",
    status: "pending_received",
  },
  {
    id: "3",
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    role: "Product Manager @ Stripe",
    city: "San Francisco",
    lookingFor: "Technical Partner",
    status: "connected",
  },
  {
    id: "4",
    name: "Marcus Johnson",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    role: "CTO @ Startup",
    city: "Austin",
    lookingFor: "Business Co-founder",
    status: "connected",
  },
  {
    id: "5",
    name: "Lisa Park",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    role: "Founder @ TechStart",
    city: "Boston",
    lookingFor: "Marketing Co-founder",
    status: "pending_sent",
  },
];

export default function Connections() {
  const [connections, setConnections] = useState<ConnectionData[]>(initialConnections);

  const pendingReceived = connections.filter((c) => c.status === "pending_received");
  const pendingSent = connections.filter((c) => c.status === "pending_sent");
  const connected = connections.filter((c) => c.status === "connected");

  const handleAccept = (id: string) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "connected" as const } : c))
    );
    const connection = connections.find((c) => c.id === id);
    toast.success(`You're now connected with ${connection?.name}!`);
  };

  const handleReject = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    toast.info("Connection request declined");
  };

  const handleMessage = (id: string) => {
    const connection = connections.find((c) => c.id === id);
    toast.info(`Opening chat with ${connection?.name}...`);
  };

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

          <Tabs defaultValue="received" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="received" className="relative">
                Requests
                {pendingReceived.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {pendingReceived.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="connected">
                Connected ({connected.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4">
              {pendingReceived.length === 0 ? (
                <EmptyState message="No pending requests" />
              ) : (
                pendingReceived.map((connection) => (
                  <ConnectionCard
                    key={connection.id}
                    connection={connection}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {pendingSent.length === 0 ? (
                <EmptyState message="No pending requests sent" />
              ) : (
                pendingSent.map((connection) => (
                  <ConnectionCard key={connection.id} connection={connection} />
                ))
              )}
            </TabsContent>

            <TabsContent value="connected" className="space-y-4">
              {connected.length === 0 ? (
                <EmptyState message="No connections yet" />
              ) : (
                connected.map((connection) => (
                  <ConnectionCard
                    key={connection.id}
                    connection={connection}
                    onMessage={handleMessage}
                  />
                ))
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
    <div className="text-center py-12 text-muted-foreground">
      <p>{message}</p>
    </div>
  );
}
