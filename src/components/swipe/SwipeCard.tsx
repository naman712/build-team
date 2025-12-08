import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Briefcase, Lightbulb, Heart, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ProfileData {
  id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  photo: string;
  lookingFor: string;
  aboutMe: string;
  myIdea: string;
  interests: string[];
  experience?: string;
  education?: string;
}

interface SwipeCardProps {
  profile: ProfileData;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

export function SwipeCard({ profile, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Swipe indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: isTop ? 1.02 : 1 }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-card bg-card">
        {/* Profile Image */}
        <div className="absolute inset-0">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
        </div>

        {/* Swipe Indicators */}
        <motion.div
          className="absolute top-4 sm:top-8 right-4 sm:right-8 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-success text-success-foreground font-bold text-lg sm:text-2xl rotate-12 border-2 sm:border-4 border-success-foreground"
          style={{ opacity: likeOpacity }}
        >
          CONNECT
        </motion.div>
        <motion.div
          className="absolute top-4 sm:top-8 left-4 sm:left-8 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-destructive text-destructive-foreground font-bold text-lg sm:text-2xl -rotate-12 border-2 sm:border-4 border-destructive-foreground"
          style={{ opacity: nopeOpacity }}
        >
          SKIP
        </motion.div>

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-primary-foreground">
          <div className="flex items-end justify-between mb-2 sm:mb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">
                {profile.name}, {profile.age}
              </h2>
              <div className="flex items-center gap-2 text-primary-foreground/80 text-sm sm:text-base">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{profile.city}, {profile.country}</span>
              </div>
            </div>
          </div>

          {/* Looking For Badge */}
          <div className="mb-2 sm:mb-4">
            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground border-0 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
              <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
              Looking for: {profile.lookingFor}
            </Badge>
          </div>

          {/* Quick Info */}
          <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4">
            {profile.experience && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-primary-foreground/90">
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{profile.experience}</span>
              </div>
            )}
            {profile.education && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-primary-foreground/90">
                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{profile.education}</span>
              </div>
            )}
          </div>

          {/* Idea Preview */}
          <div className="bg-background/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 mb-2 sm:mb-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">
              <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
              <span>My Idea</span>
            </div>
            <p className="text-xs sm:text-sm text-primary-foreground/90 line-clamp-2">
              {profile.myIdea}
            </p>
          </div>

          {/* Interests */}
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {profile.interests.slice(0, 3).map((interest) => (
              <Badge
                key={interest}
                variant="outline"
                className="bg-background/20 border-primary-foreground/30 text-primary-foreground text-[10px] sm:text-xs px-1.5 sm:px-2"
              >
                {interest}
              </Badge>
            ))}
            {profile.interests.length > 3 && (
              <Badge
                variant="outline"
                className="bg-background/20 border-primary-foreground/30 text-primary-foreground text-[10px] sm:text-xs px-1.5 sm:px-2"
              >
                +{profile.interests.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
