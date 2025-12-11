import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Check, X, MapPin, Briefcase, UserMinus, Undo2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ConnectionData {
  id: string;
  profileId: string;
  name: string;
  avatar: string;
  role: string;
  city: string;
  lookingFor: string;
  status: "pending_received" | "pending_sent" | "connected";
}

interface ConnectionCardProps {
  connection: ConnectionData;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onMessage?: (id: string) => void;
  onRemove?: (id: string) => void;
  onWithdraw?: (id: string) => void;
}

export function ConnectionCard({
  connection,
  onAccept,
  onReject,
  onMessage,
  onRemove,
  onWithdraw,
}: ConnectionCardProps) {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate(`/user/${connection.profileId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-2xl shadow-card border border-border/50 p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        <Avatar 
          className="w-16 h-16 ring-2 ring-primary/20 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleProfileClick}
        >
          <AvatarImage src={connection.avatar} alt={connection.name} />
          <AvatarFallback>{connection.name[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProfileClick}
            >
              <h3 className="font-semibold text-foreground truncate">
                {connection.name}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {connection.role}
              </p>
              {connection.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {connection.city}
                </p>
              )}
            </div>
            
            <Badge
              variant={connection.status === "connected" ? "default" : "secondary"}
              className={
                connection.status === "connected"
                  ? "bg-success text-success-foreground"
                  : connection.status === "pending_received"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }
            >
              {connection.status === "connected"
                ? "Connected"
                : connection.status === "pending_received"
                ? "Pending"
                : "Sent"}
            </Badge>
          </div>
          
          {connection.lookingFor && (
            <p className="text-sm text-muted-foreground mt-2">
              Looking for: <span className="text-foreground">{connection.lookingFor}</span>
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        {connection.status === "pending_received" && (
          <>
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onAccept?.(connection.id)}
            >
              <Check className="w-4 h-4" />
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onReject?.(connection.id)}
            >
              <X className="w-4 h-4" />
              Decline
            </Button>
          </>
        )}
        
        {connection.status === "connected" && (
          <div className="flex gap-2 w-full">
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onMessage?.(connection.id)}
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onRemove?.(connection.id)}
            >
              <UserMinus className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {connection.status === "pending_sent" && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onWithdraw?.(connection.id)}
          >
            <Undo2 className="w-4 h-4" />
            Withdraw Request
          </Button>
        )}
      </div>
    </motion.div>
  );
}
