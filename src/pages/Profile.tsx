import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Camera, MapPin, Briefcase, GraduationCap, Link as LinkIcon, 
  Edit2, Settings, LogOut, Lightbulb, Heart, Plus
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const userProfile = {
  name: "John Doe",
  age: 29,
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
  city: "San Francisco",
  country: "USA",
  email: "john@example.com",
  phone: "+1 (555) 123-4567",
  lookingFor: "Technical Co-founder",
  aboutMe: "Passionate entrepreneur with 5+ years in product management. Previously led product at a Series B startup. Looking to build the next big thing in AI/ML space.",
  myIdea: "Building an AI-powered platform that helps remote teams collaborate more effectively by understanding work patterns and suggesting optimal meeting times and focus blocks.",
  interests: ["AI/ML", "Remote Work", "SaaS", "Productivity", "B2B"],
  experience: [
    { role: "Product Manager", company: "TechCorp", duration: "2021-Present" },
    { role: "Associate PM", company: "StartupXYZ", duration: "2019-2021" },
  ],
  education: [
    { degree: "MBA", school: "Stanford GSB", year: "2019" },
    { degree: "BS Computer Science", school: "UC Berkeley", year: "2017" },
  ],
  links: ["linkedin.com/in/johndoe", "johndoe.com"],
  profileCompletion: 85,
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

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
            <div className="h-32 bg-gradient-primary relative">
              <Button
                variant="glass"
                size="icon"
                className="absolute top-4 right-4"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Avatar & Basic Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
                <div className="relative">
                  <Avatar className="w-32 h-32 ring-4 ring-card">
                    <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                    <AvatarFallback>{userProfile.name[0]}</AvatarFallback>
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
                  <h1 className="text-2xl font-bold">{userProfile.name}, {userProfile.age}</h1>
                  <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                    <MapPin className="w-4 h-4" />
                    {userProfile.city}, {userProfile.country}
                  </p>
                </div>
                
                <Button variant="outline" className="gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
              </div>

              {/* Profile Completion */}
              <div className="mt-6 p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profile Completion</span>
                  <span className="text-sm text-primary font-semibold">{userProfile.profileCompletion}%</span>
                </div>
                <Progress value={userProfile.profileCompletion} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Complete your profile to unlock all features
                </p>
              </div>
            </div>
          </motion.div>

          {/* Looking For */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Looking For
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="bg-primary/10 text-primary px-4 py-2">
                {userProfile.lookingFor}
              </Badge>
            </CardContent>
          </Card>

          {/* About Me */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">About Me</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{userProfile.aboutMe}</p>
            </CardContent>
          </Card>

          {/* My Idea */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-accent" />
                My Idea
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{userProfile.myIdea}</p>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userProfile.interests.map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {interest}
                  </Badge>
                ))}
                <Button variant="outline" size="sm" className="h-6 px-2">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProfile.experience.map((exp, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium">{exp.role}</h4>
                    <p className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
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
              {userProfile.education.map((edu, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium">{edu.degree}</h4>
                    <p className="text-sm text-muted-foreground">{edu.school} • {edu.year}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userProfile.links.map((link, index) => (
                  <a
                    key={index}
                    href={`https://${link}`}
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

          {/* Settings */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start gap-3">
                <Settings className="w-5 h-5" />
                Settings
              </Button>
              <Separator />
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive">
                <LogOut className="w-5 h-5" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
