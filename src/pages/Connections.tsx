import { useState } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ConnectionCard, ConnectionData } from "@/components/connections/ConnectionCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Connections() {
  const [connections, setConnections] = useState<ConnectionData[]>([]);

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
