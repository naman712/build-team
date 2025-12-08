import { useState } from "react";
import { motion } from "framer-motion";
import { X, Heart, RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwipeCard, ProfileData } from "./SwipeCard";
import { toast } from "sonner";

interface SwipeDeckProps {
  profiles?: ProfileData[];
}

export function SwipeDeck({ profiles: initialProfiles = [] }: SwipeDeckProps) {
  const [profiles, setProfiles] = useState<ProfileData[]>(initialProfiles);
  const [lastSwiped, setLastSwiped] = useState<ProfileData | null>(null);

  const handleSwipe = (direction: "left" | "right") => {
    if (profiles.length === 0) return;

    const swipedProfile = profiles[profiles.length - 1];
    setLastSwiped(swipedProfile);
    setProfiles((prev) => prev.slice(0, -1));

    if (direction === "right") {
      toast.success(`Connection request sent to ${swipedProfile.name}!`, {
        description: "They'll be notified about your interest.",
      });
    }
  };

  const handleUndo = () => {
    if (lastSwiped) {
      setProfiles((prev) => [...prev, lastSwiped]);
      setLastSwiped(null);
      toast.info("Profile restored!");
    }
  };

  const handleButtonSwipe = (direction: "left" | "right") => {
    handleSwipe(direction);
  };

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mb-6"
        >
          <Users className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">No profiles yet</h2>
        <p className="text-muted-foreground mb-6">
          Complete your profile to start discovering founders in your area.
        </p>
        <Button variant="outline" asChild>
          <a href="/profile">Complete Profile</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Card Stack */}
      <div className="relative flex-1 overflow-hidden">
        {profiles.map((profile, index) => (
          <SwipeCard
            key={profile.id}
            profile={profile}
            onSwipe={handleSwipe}
            isTop={index === profiles.length - 1}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6 py-6">
        <Button
          variant="swipe"
          size="icon-xl"
          className="bg-card text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => handleButtonSwipe("left")}
        >
          <X className="w-8 h-8" />
        </Button>
        
        {lastSwiped && (
          <Button
            variant="swipe"
            size="icon-lg"
            className="bg-card text-muted-foreground hover:bg-muted"
            onClick={handleUndo}
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
        )}
        
        <Button
          variant="swipe"
          size="icon-xl"
          className="bg-success text-success-foreground hover:bg-success/90"
          onClick={() => handleButtonSwipe("right")}
        >
          <Heart className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
}
