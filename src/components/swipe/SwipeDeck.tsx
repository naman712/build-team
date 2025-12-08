import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Heart, RotateCcw, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwipeCard, ProfileData } from "./SwipeCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function SwipeDeck() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [lastSwiped, setLastSwiped] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get current user's profile ID
      const { data: myProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, city, country")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!myProfile) {
        setLoading(false);
        return;
      }

      setMyProfileId(myProfile.id);

      // Get all connections involving the current user (sent or received)
      const { data: sentConnections, error: sentError } = await supabase
        .from("connections")
        .select("receiver_id")
        .eq("requester_id", myProfile.id);

      if (sentError) throw sentError;

      const { data: receivedConnections, error: receivedError } = await supabase
        .from("connections")
        .select("requester_id")
        .eq("receiver_id", myProfile.id);

      if (receivedError) throw receivedError;

      // Exclude profiles I've swiped on OR who have swiped on me (accepted connections)
      const excludeIds = new Set<string>();
      excludeIds.add(myProfile.id); // Exclude self
      sentConnections?.forEach(c => excludeIds.add(c.receiver_id));
      receivedConnections?.forEach(c => excludeIds.add(c.requester_id));
      
      const swipedIds = Array.from(excludeIds);

      // Fetch completed profiles excluding already swiped ones
      const { data: profilesData, error: fetchError } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          age,
          city,
          country,
          photo_url,
          looking_for,
          about_me,
          my_idea,
          interests
        `)
        .eq("profile_completed", true)
        .not("id", "in", `(${swipedIds.join(",")})`)
        .limit(20);

      if (fetchError) throw fetchError;

      // Get experience and education for each profile
      const profileIds = profilesData?.map(p => p.id) || [];
      
      const [experiencesResult, educationResult] = await Promise.all([
        supabase.from("experiences").select("profile_id, role, company").in("profile_id", profileIds),
        supabase.from("education").select("profile_id, degree, school").in("profile_id", profileIds)
      ]);

      const experienceMap = new Map<string, string>();
      const educationMap = new Map<string, string>();

      experiencesResult.data?.forEach(exp => {
        if (!experienceMap.has(exp.profile_id)) {
          experienceMap.set(exp.profile_id, `${exp.role} at ${exp.company}`);
        }
      });

      educationResult.data?.forEach(edu => {
        if (!educationMap.has(edu.profile_id)) {
          educationMap.set(edu.profile_id, `${edu.degree} from ${edu.school}`);
        }
      });

      // Transform to ProfileData format
      const transformedProfiles: ProfileData[] = (profilesData || []).map(p => ({
        id: p.id,
        name: p.name || "Unknown",
        age: p.age || 0,
        city: p.city || "",
        country: p.country || "",
        photo: p.photo_url || "/placeholder.svg",
        lookingFor: p.looking_for || "",
        aboutMe: p.about_me || "",
        myIdea: p.my_idea || "",
        interests: p.interests || [],
        experience: experienceMap.get(p.id),
        education: educationMap.get(p.id),
      }));

      setProfiles(transformedProfiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (profiles.length === 0 || !myProfileId) return;

    const swipedProfile = profiles[profiles.length - 1];
    setLastSwiped(swipedProfile);
    setProfiles((prev) => prev.slice(0, -1));

    if (direction === "right") {
      // Send connection request
      try {
        const { error } = await supabase.from("connections").insert({
          requester_id: myProfileId,
          receiver_id: swipedProfile.id,
          status: "pending",
        });

        if (error) throw error;

        toast.success(`Connection request sent to ${swipedProfile.name}!`, {
          description: "They'll be notified about your interest.",
        });
      } catch (error: any) {
        console.error("Error sending connection request:", error);
        toast.error("Failed to send connection request");
        // Restore the profile on error
        setProfiles((prev) => [...prev, swipedProfile]);
        setLastSwiped(null);
      }
    }
  };

  const handleUndo = async () => {
    if (!lastSwiped || !myProfileId) return;

    // Remove the connection request if it was a right swipe
    try {
      await supabase
        .from("connections")
        .delete()
        .eq("requester_id", myProfileId)
        .eq("receiver_id", lastSwiped.id)
        .eq("status", "pending");

      setProfiles((prev) => [...prev, lastSwiped]);
      setLastSwiped(null);
      toast.info("Profile restored!");
    } catch (error) {
      console.error("Error undoing swipe:", error);
    }
  };

  const handleButtonSwipe = (direction: "left" | "right") => {
    handleSwipe(direction);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2">Loading profiles...</p>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold mb-2">No more profiles</h2>
        <p className="text-muted-foreground mb-6">
          Check back later for new founders to connect with.
        </p>
        <Button variant="outline" onClick={fetchProfiles}>
          Refresh
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
