import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Users, MessageCircle, Compass, Bell, User, Gift, Settings, LogOut, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { triggerHaptic } from "@/hooks/useHapticFeedback";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ReferralDialog } from "@/components/profile/ReferralDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import logoImage from "@/assets/logo.png";

const navItems = [
  { path: "/feed", icon: Home, label: "Feed", badgeKey: null },
  { path: "/discover", icon: Compass, label: "Discover", badgeKey: null },
  { path: "/connections", icon: Users, label: "Connections", badgeKey: "connections" as const },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const unreadCounts = useUnreadCounts();
  const { profile } = useProfile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const getBadgeCount = (badgeKey: "connections" | null) => {
    if (!badgeKey) return 0;
    return unreadCounts[badgeKey] || 0;
  };

  const totalNotifications = unreadCounts.connections;

  const handleNavClick = () => {
    triggerHaptic('selection');
  };

  const handleLogout = async () => {
    setSheetOpen(false);
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleMenuItemClick = (path: string) => {
    triggerHaptic('selection');
    setSheetOpen(false);
    navigate(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Profile Pic + Streak */}
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <motion.button 
                  className="focus:outline-none" 
                  onClick={() => triggerHaptic('selection')}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Avatar className="w-9 h-9 ring-2 ring-primary/20 cursor-pointer">
                    <AvatarImage src={profile?.photo_url || ""} alt={profile?.name || "Profile"} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {profile?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                </motion.button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  {/* Profile Section */}
                  <div 
                    className="p-6 bg-gradient-primary cursor-pointer"
                    onClick={() => handleMenuItemClick('/profile')}
                  >
                    <Avatar className="w-16 h-16 ring-2 ring-white/30 mb-3">
                      <AvatarImage src={profile?.photo_url || ""} alt={profile?.name || "Profile"} />
                      <AvatarFallback className="bg-white/20 text-white text-xl font-semibold">
                        {profile?.name?.[0]?.toUpperCase() || <User className="w-6 h-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-semibold text-white">{profile?.name || "Your Name"}</h3>
                    <p className="text-sm text-white/70">My Profile</p>
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 p-4 space-y-1">
                    <ReferralDialog referralCode={profile?.referral_code} profileId={profile?.id || ""}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-3 h-12 text-base"
                        onClick={() => triggerHaptic('selection')}
                      >
                        <Gift className="w-5 h-5 text-primary" />
                        Refer & Get ₹250
                      </Button>
                    </ReferralDialog>

                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-3 h-12 text-base"
                      onClick={() => handleMenuItemClick('/settings')}
                    >
                      <Settings className="w-5 h-5 text-muted-foreground" />
                      Account Settings
                    </Button>
                  </div>

                  {/* Logout */}
                  <div className="p-4 border-t">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-3 h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Streak Badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold cursor-pointer transition-all",
                    (profile?.current_streak ?? 0) > 0
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/40"
                      : "bg-secondary border border-border text-muted-foreground hover:border-amber-500/50"
                  )}
                >
                  <motion.div
                    animate={(profile?.current_streak ?? 0) > 0 ? { 
                      rotate: [0, -10, 10, -10, 0],
                    } : {}}
                    transition={{ 
                      duration: 0.5, 
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  >
                    <Zap className={cn(
                      "w-4 h-4",
                      (profile?.current_streak ?? 0) > 0 ? "fill-current" : ""
                    )} />
                  </motion.div>
                  <span>{profile?.current_streak ?? 0}</span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-center max-w-[200px]">
                <p className="font-semibold">
                  {(profile?.current_streak ?? 0) > 0 
                    ? `${profile?.current_streak} day streak! ⚡` 
                    : "Start your streak!"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Post daily to build your streak
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Center: Navigation Items */}
          <nav className="flex items-center gap-3 sm:gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const badgeCount = getBadgeCount(item.badgeKey);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-3 sm:px-4 py-1.5 rounded-xl transition-colors",
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
          </nav>

          {/* Right: Notifications & Messages */}
          <div className="flex items-center gap-1">
            <Link 
              to="/notifications" 
              className={cn(
                "relative p-2 rounded-full hover:bg-muted transition-colors",
                location.pathname === "/notifications" && "text-primary bg-primary/10"
              )}
              onClick={handleNavClick}
            >
              <Bell className="w-5 h-5" />
              {totalNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full">
                  {totalNotifications > 99 ? "99+" : totalNotifications}
                </span>
              )}
            </Link>
            
            <Link 
              to="/messages" 
              className={cn(
                "relative p-2 rounded-full hover:bg-muted transition-colors",
                location.pathname === "/messages" && "text-primary bg-primary/10"
              )}
              onClick={handleNavClick}
            >
              <MessageCircle className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
