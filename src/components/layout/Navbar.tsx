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
  { path: "/discover", icon: Compass, label: "Match", badgeKey: null },
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
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Gradient background with blur */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80 backdrop-blur-xl border-b border-border/40" />
      
      <div className="container mx-auto px-3 sm:px-4 relative">
        <div className="flex items-center justify-between h-16">
          {/* Left: Profile Pic + Streak */}
          <div className="flex items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <motion.button 
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full" 
                  onClick={() => triggerHaptic('selection')}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10 ring-2 ring-primary/30 ring-offset-2 ring-offset-background cursor-pointer shadow-md">
                      <AvatarImage src={profile?.photo_url || ""} alt={profile?.name || "Profile"} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-semibold">
                        {profile?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
                  </div>
                </motion.button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 border-r border-border/50">
                <div className="flex flex-col h-full bg-gradient-to-b from-card to-background">
                  {/* Profile Section */}
                  <div 
                    className="p-6 bg-gradient-primary cursor-pointer relative overflow-hidden"
                    onClick={() => handleMenuItemClick('/profile')}
                  >
                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
                    <div className="absolute -bottom-5 -left-5 w-20 h-20 rounded-full bg-white/5" />
                    
                    <div className="relative">
                      <Avatar className="w-18 h-18 ring-4 ring-white/20 mb-4 shadow-lg">
                        <AvatarImage src={profile?.photo_url || ""} alt={profile?.name || "Profile"} />
                        <AvatarFallback className="bg-white/20 text-white text-2xl font-semibold">
                          {profile?.name?.[0]?.toUpperCase() || <User className="w-7 h-7" />}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold text-white tracking-tight">{profile?.name || "Your Name"}</h3>
                      <p className="text-sm text-white/70 mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        View Profile
                      </p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 p-5 space-y-2">
                    <ReferralDialog referralCode={profile?.referral_code} profileId={profile?.id || ""}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-3 h-13 text-base rounded-xl hover:bg-primary/10 hover:text-primary group transition-all"
                        onClick={() => triggerHaptic('selection')}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                          <Gift className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">Refer & Earn</div>
                          <div className="text-xs text-muted-foreground">Get ₹250 per referral</div>
                        </div>
                      </Button>
                    </ReferralDialog>

                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-3 h-13 text-base rounded-xl hover:bg-muted group transition-all"
                      onClick={() => handleMenuItemClick('/settings')}
                    >
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-muted-foreground/10 transition-colors">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">Account Settings</span>
                    </Button>
                  </div>

                  {/* Logout */}
                  <div className="p-5 border-t border-border/50">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-3 h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Sign Out</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Streak Badge - Enhanced */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-bold cursor-pointer transition-all",
                    (profile?.current_streak ?? 0) > 0
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg shadow-amber-500/30"
                      : "bg-secondary/80 border border-border text-muted-foreground hover:border-amber-500/50 hover:bg-secondary"
                  )}
                >
                  <motion.div
                    animate={(profile?.current_streak ?? 0) > 0 ? { 
                      rotate: [0, -12, 12, -12, 0],
                      scale: [1, 1.1, 1, 1.1, 1],
                    } : {}}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity,
                      repeatDelay: 2.5
                    }}
                  >
                    <Zap className={cn(
                      "w-4 h-4",
                      (profile?.current_streak ?? 0) > 0 ? "fill-current drop-shadow-sm" : ""
                    )} />
                  </motion.div>
                  <span className="tabular-nums">{profile?.current_streak ?? 0}</span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-center max-w-[220px] p-3">
                <p className="font-semibold text-sm">
                  {(profile?.current_streak ?? 0) > 0 
                    ? `${profile?.current_streak} day streak! ⚡` 
                    : "Start your streak!"}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Post daily to build your streak
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Center: Navigation Pills */}
          <nav className="flex items-center bg-secondary/60 rounded-2xl p-1.5 border border-border/50 shadow-sm">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const badgeCount = getBadgeCount(item.badgeKey);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-pill"
                      className="absolute inset-0 bg-primary rounded-xl shadow-md"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2">
                    <div className="relative">
                      <item.icon className="w-4 h-4" />
                      {badgeCount > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full shadow-sm">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold hidden sm:inline">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Right: Action Icons */}
          <div className="flex items-center gap-1.5">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/notifications" 
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                  location.pathname === "/notifications" 
                    ? "text-primary bg-primary/15 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onClick={handleNavClick}
              >
                <Bell className="w-5 h-5" />
                {totalNotifications > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full shadow-md"
                  >
                    {totalNotifications > 99 ? "99+" : totalNotifications}
                  </motion.span>
                )}
              </Link>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/messages" 
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                  location.pathname === "/messages" 
                    ? "text-primary bg-primary/15 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onClick={handleNavClick}
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
}
