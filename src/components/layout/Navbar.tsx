import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Users, MessageCircle, Compass, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { triggerHaptic } from "@/hooks/useHapticFeedback";
import logoImage from "@/assets/logo.png";

const navItems = [
  { path: "/feed", icon: Home, label: "Feed", badgeKey: null },
  { path: "/discover", icon: Compass, label: "Discover", badgeKey: null },
  { path: "/connections", icon: Users, label: "Connections", badgeKey: "connections" as const },
  { path: "/messages", icon: MessageCircle, label: "Messages", badgeKey: null },
];

export function Navbar() {
  const location = useLocation();
  const unreadCounts = useUnreadCounts();
  const { profile } = useProfile();

  const getBadgeCount = (badgeKey: "connections" | null) => {
    if (!badgeKey) return 0;
    return unreadCounts[badgeKey] || 0;
  };

  // Only show connections count in notification bell (not messages)
  const totalNotifications = unreadCounts.connections;

  const handleNavClick = () => {
    triggerHaptic('selection');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/profile" className="hover:opacity-90 transition-opacity" onClick={handleNavClick}>
              <Avatar className="w-9 h-9 ring-2 ring-primary/30">
                <AvatarImage src={profile?.photo_url || ""} alt={profile?.name || "Profile"} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-semibold">
                  {profile?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
            </Link>

            <Link to="/" className="flex items-center gap-2" onClick={handleNavClick}>
              <img src={logoImage} alt="FounderNow" className="w-9 h-9 rounded-xl object-cover" />
              <span className="font-bold text-lg text-foreground">FounderNow</span>
            </Link>

            <Link 
              to="/notifications" 
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
              onClick={handleNavClick}
            >
              <Bell className="w-5 h-5 text-foreground" />
              {totalNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full">
                  {totalNotifications > 99 ? "99+" : totalNotifications}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const badgeCount = getBadgeCount(item.badgeKey);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative">
                    <item.icon className="w-5 h-5 relative z-10" />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full z-20">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium relative z-10">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
