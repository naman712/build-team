import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Only initialize notifications when user is logged in
  if (user) {
    return <NotificationInitializer>{children}</NotificationInitializer>;
  }
  
  return <>{children}</>;
}

function NotificationInitializer({ children }: { children: React.ReactNode }) {
  useNotifications();
  return <>{children}</>;
}

export function NotificationButton() {
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");
  const { requestPermission } = useNotifications();

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermissionState("unsupported");
    } else {
      setPermissionState(Notification.permission);
    }
  }, []);

  const handleClick = async () => {
    if (permissionState === "unsupported") return;
    
    const granted = await requestPermission();
    if (granted) {
      setPermissionState("granted");
    } else {
      setPermissionState("denied");
    }
  };

  if (permissionState === "granted") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="w-4 h-4 text-success" />
            <span className="hidden sm:inline">Notifications on</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Push notifications are enabled</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (permissionState === "denied" || permissionState === "unsupported") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BellOff className="w-4 h-4" />
            <span className="hidden sm:inline">
              {permissionState === "unsupported" ? "Not supported" : "Blocked"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {permissionState === "unsupported" 
              ? "Your browser doesn't support notifications" 
              : "Notifications are blocked. Enable them in browser settings."}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="gap-2">
      <Bell className="w-4 h-4" />
      <span className="hidden sm:inline">Enable notifications</span>
    </Button>
  );
}
