import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwipeCard, ProfileData } from "./SwipeCard";
import { toast } from "sonner";

const mockProfiles: ProfileData[] = [
  {
    id: "1",
    name: "Sarah Chen",
    age: 28,
    city: "San Francisco",
    country: "USA",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1200&fit=crop",
    lookingFor: "Technical Co-founder",
    aboutMe: "Product manager turned entrepreneur. 5 years at Google, now building the future of work.",
    myIdea: "AI-powered productivity tool that learns your work patterns and automates repetitive tasks.",
    interests: ["AI/ML", "SaaS", "Remote Work", "Productivity"],
    experience: "Product Manager @ Google",
    education: "Stanford MBA",
  },
  {
    id: "2",
    name: "Marcus Johnson",
    age: 32,
    city: "Austin",
    country: "USA",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop",
    lookingFor: "Business Co-founder",
    aboutMe: "Full-stack developer with 8 years of experience. Built and sold a B2B SaaS startup.",
    myIdea: "Marketplace connecting local farmers directly with restaurants and consumers.",
    interests: ["Marketplace", "AgriTech", "Sustainability", "B2B"],
    experience: "CTO @ FarmFresh (Acquired)",
    education: "MIT Computer Science",
  },
  {
    id: "3",
    name: "Priya Sharma",
    age: 26,
    city: "Bangalore",
    country: "India",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop",
    lookingFor: "Technical Partner",
    aboutMe: "FinTech enthusiast with experience at Stripe and Razorpay. Passionate about financial inclusion.",
    myIdea: "Micro-investment platform for Gen Z to build wealth through gamified saving experiences.",
    interests: ["FinTech", "Gen Z", "Gamification", "Mobile"],
    experience: "Product Lead @ Stripe",
    education: "IIT Delhi",
  },
  {
    id: "4",
    name: "Alex Rivera",
    age: 30,
    city: "Berlin",
    country: "Germany",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=1200&fit=crop",
    lookingFor: "Design Co-founder",
    aboutMe: "Serial entrepreneur with 2 exits. Obsessed with developer tools and B2B SaaS.",
    myIdea: "No-code platform for building internal tools that actually scale with enterprise needs.",
    interests: ["Developer Tools", "No-Code", "Enterprise", "B2B SaaS"],
    experience: "Founder @ DevTools.io (Acquired)",
    education: "TU Berlin",
  },
];

export function SwipeDeck() {
  const [profiles, setProfiles] = useState(mockProfiles);
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
          <Heart className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">You've seen everyone!</h2>
        <p className="text-muted-foreground mb-6">
          Check back later for new founders in your area.
        </p>
        <Button
          variant="outline"
          onClick={() => setProfiles(mockProfiles)}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Start Over
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Card Stack */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence>
          {profiles.map((profile, index) => (
            <SwipeCard
              key={profile.id}
              profile={profile}
              onSwipe={handleSwipe}
              isTop={index === profiles.length - 1}
            />
          ))}
        </AnimatePresence>
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
