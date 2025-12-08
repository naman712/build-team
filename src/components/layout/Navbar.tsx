import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Users, MessageCircle, Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";

const navItems = [
  { path: "/feed", icon: Home, label: "Feed", badgeKey: null },
  { path: "/discover", icon: Compass, label: "Discover", badgeKey: null },
  { path: "/connections", icon: Users, label: "Connections", badgeKey: "connections" as const },
  { path: "/messages", icon: MessageCircle, label: "Messages", badgeKey: "messages" as const },
  { path: "/profile", icon: User, label: "Profile", badgeKey: null },
];

export function Navbar() {
  const location = useLocation();
  const unreadCounts = useUnreadCounts();

  const getBadgeCount = (badgeKey: "connections" | "messages" | null) => {
    if (!badgeKey) return 0;
    return unreadCounts[badgeKey] || 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo - Desktop only */}
          <Link to="/" className="hidden md:flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">F</span>
            </div>
            <span className="font-bold text-xl text-foreground">FounderHive</span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center justify-around w-full md:w-auto md:gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const badgeCount = getBadgeCount(item.badgeKey);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex flex-col md:flex-row items-center gap-0.5 md:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-xl transition-colors",
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
                  <span className="text-[10px] sm:text-xs md:text-sm font-medium relative z-10 truncate max-w-[48px] sm:max-w-none">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Link
              to="/profile"
              className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden"
            >
              <User className="w-5 h-5 text-primary-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
