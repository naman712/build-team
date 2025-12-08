import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Settings as SettingsIcon, Bell, Shield, HelpCircle, 
  LogOut, ChevronRight, User, ArrowLeft
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { NotificationButton } from "@/components/NotificationProvider";

export default function Settings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const menuItems = [
    {
      icon: User,
      label: "Edit Profile",
      onClick: () => navigate("/onboarding?edit=true"),
    },
    {
      icon: Bell,
      label: "Notifications",
      action: <NotificationButton />,
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      onClick: () => toast.info("Coming soon"),
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      onClick: () => toast.info("Coming soon"),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <SettingsIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-2">
                {menuItems.map((item, index) => (
                  <div key={item.label}>
                    <button
                      onClick={item.onClick}
                      className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 rounded-lg transition-colors"
                      disabled={!item.onClick}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.action ? (
                        item.action
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    {index < menuItems.length - 1 && <Separator className="mx-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardContent className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-4 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Log Out</span>
                </button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}