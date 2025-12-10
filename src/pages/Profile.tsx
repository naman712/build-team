import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Camera, MapPin, Briefcase, GraduationCap, Link as LinkIcon, 
  Edit2, Settings, LogOut, Lightbulb, Heart, Plus, Loader2, Bell,
  FileText
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ExperienceDialog } from "@/components/profile/ExperienceDialog";
import { EducationDialog } from "@/components/profile/EducationDialog";
import { PostEditDialog } from "@/components/profile/PostEditDialog";
import { PostDetailDialog } from "@/components/profile/PostDetailDialog";
import { NotificationButton } from "@/components/NotificationProvider";
import { formatDistanceToNow } from "date-fns";

interface Experience {
  id: string;
  role: string;
  company: string;
  duration: string | null;
}

interface Education {
  id: string;
  degree: string;
  school: string;
  year: string | null;
}

interface Post {
  id: string;
  content: string;
  tags: string[] | null;
  created_at: string | null;
  image_url?: string | null;
}

export default function Profile() {
  const { signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const fetchData = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    const [expResult, eduResult, postsResult] = await Promise.all([
      supabase.from('experiences').select('*').eq('profile_id', profile.id),
      supabase.from('education').select('*').eq('profile_id', profile.id),
      supabase.from('posts').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false }),
    ]);

    if (expResult.data) {
      setExperiences(expResult.data.map(e => ({
        id: e.id,
        role: e.role,
        company: e.company,
        duration: e.duration,
      })));
    }

    if (postsResult.data) {
      setPosts(postsResult.data);
    }

    if (eduResult.data) {
      setEducation(eduResult.data.map(e => ({
        id: e.id,
        degree: e.degree,
        school: e.school,
        year: e.year,
      })));
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    
    const fields = [
      profile.photo_url,
      profile.name,
      profile.age,
      profile.phone,
      profile.email,
      profile.city,
      profile.country,
      profile.looking_for,
      profile.about_me,
      profile.my_idea,
      profile.interests && profile.interests.length > 0,
    ];
    
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-20">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-20">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
          >
            {/* Cover */}
            <div className="h-20 bg-gradient-primary" />
            
            {/* Avatar & Basic Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
                <div className="relative">
                  <Avatar className="w-32 h-32 ring-4 ring-card">
                    <AvatarImage src={profile.photo_url || ""} alt={profile.name || ""} />
                    <AvatarFallback>{profile.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <Button
                    variant="default"
                    size="icon"
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold">
                    {profile.name || "Your Name"}{profile.age ? `, ${profile.age}` : ""}
                  </h1>
                  <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.city && profile.country 
                      ? `${profile.city}, ${profile.country}` 
                      : "Location not set"}
                  </p>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="mt-6 p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profile Completion</span>
                  <span className="text-sm text-primary font-semibold">{profileCompletion}%</span>
                </div>
                <Progress value={profileCompletion} className="h-2" />
                {profileCompletion < 100 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Complete your profile to unlock all features
                  </p>
                )}
              </div>

              {/* Tabs for Edit Profile and My Posts */}
              <div className="mt-6">
                <div className="flex gap-2">
                  <Button 
                    variant={activeTab === "profile" ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => navigate('/onboarding?edit=true')}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                  <Button 
                    variant={activeTab === "posts" ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => setActiveTab("posts")}
                  >
                    <FileText className="w-4 h-4" />
                    My Posts ({posts.length})
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {activeTab === "profile" ? (
            <>
              {/* Looking For */}
              {profile.looking_for && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      Looking For
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="bg-primary/10 text-primary px-4 py-2">
                      {profile.looking_for}
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* About Me */}
              {profile.about_me && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">About Me</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{profile.about_me}</p>
                  </CardContent>
                </Card>
              )}

              {/* My Idea */}
              {profile.my_idea && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-accent" />
                      My Idea
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{profile.my_idea}</p>
                  </CardContent>
                </Card>
              )}

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Interests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <Badge key={interest} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {experiences.length > 0 ? (
                    experiences.map((exp) => (
                      <ExperienceDialog key={exp.id} profileId={profile.id} experience={exp} onSuccess={fetchData}>
                        <div className="flex items-start gap-3 cursor-pointer hover:bg-secondary/50 p-2 -m-2 rounded-lg transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium">{exp.role}</h4>
                            <p className="text-sm text-muted-foreground">
                              {exp.company}{exp.duration ? ` • ${exp.duration}` : ""}
                            </p>
                          </div>
                        </div>
                      </ExperienceDialog>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No experience added yet</p>
                  )}
                  <ExperienceDialog profileId={profile.id} onSuccess={fetchData}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Experience
                    </Button>
                  </ExperienceDialog>
                </CardContent>
              </Card>

              {/* Education */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {education.length > 0 ? (
                    education.map((edu) => (
                      <EducationDialog key={edu.id} profileId={profile.id} education={edu} onSuccess={fetchData}>
                        <div className="flex items-start gap-3 cursor-pointer hover:bg-secondary/50 p-2 -m-2 rounded-lg transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium">{edu.degree}</h4>
                            <p className="text-sm text-muted-foreground">
                              {edu.school}{edu.year ? ` • ${edu.year}` : ""}
                            </p>
                          </div>
                        </div>
                      </EducationDialog>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No education added yet</p>
                  )}
                  <EducationDialog profileId={profile.id} onSuccess={fetchData}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education
                    </Button>
                  </EducationDialog>
                </CardContent>
              </Card>

              {/* Links */}
              {profile.links && profile.links.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LinkIcon className="w-5 h-5" />
                      Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profile.links.map((link, index) => (
                        <a
                          key={index}
                          href={link.startsWith('http') ? link : `https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <LinkIcon className="w-4 h-4" />
                          {link}
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            </>
          ) : (
            <>
              {/* My Posts Tab Content */}
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Card
                    key={post.id}
                    className="cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setSelectedPost(post)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {post.created_at
                              ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                              : ""}
                          </p>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <PostEditDialog post={post} onSuccess={fetchData} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No posts yet</p>
                    <Button onClick={() => navigate('/feed')}>
                      Create your first post
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Get notified about connection requests and comments
                </p>
                <NotificationButton />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate('/settings')}>
                <Settings className="w-5 h-5" />
                Settings
              </Button>
              <Separator />
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Post Detail Dialog */}
      {selectedPost && (
        <PostDetailDialog
          post={selectedPost}
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
          onPostUpdated={fetchData}
        />
      )}
    </div>
  );
}
