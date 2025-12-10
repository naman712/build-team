import { useState, useRef, useEffect } from "react";
import { Camera, Plus, X, Loader2, Briefcase, GraduationCap, Trash2, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Experience = Tables<"experiences">;
type Education = Tables<"education">;

interface ProfileEditDialogProps {
  profile: Profile;
  onSuccess: () => void;
  children: React.ReactNode;
}

const INTEREST_OPTIONS = [
  "AI/ML",
  "Web3",
  "FinTech",
  "HealthTech",
  "EdTech",
  "E-commerce",
  "SaaS",
  "Mobile Apps",
  "Gaming",
  "IoT",
  "Sustainability",
  "Social Impact",
  "Marketing",
  "Sales",
  "Product",
  "Design",
  "Engineering",
];

export function ProfileEditDialog({
  profile,
  onSuccess,
  children,
}: ProfileEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [photoUrl, setPhotoUrl] = useState(profile.photo_url || "");
  const [name, setName] = useState(profile.name || "");
  const [age, setAge] = useState(profile.age?.toString() || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [email, setEmail] = useState(profile.email || "");
  const [city, setCity] = useState(profile.city || "");
  const [country, setCountry] = useState(profile.country || "");
  const [lookingFor, setLookingFor] = useState(profile.looking_for || "");
  const [aboutMe, setAboutMe] = useState(profile.about_me || "");
  const [myIdea, setMyIdea] = useState(profile.my_idea || "");
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [startupName, setStartupName] = useState(profile.startup_name || "");
  const [links, setLinks] = useState<string[]>(profile.links || []);
  const [newLink, setNewLink] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState(profile.intro_video_url || "");

  // Experience & Education state
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [newExp, setNewExp] = useState({ role: "", company: "", duration: "" });
  const [newEdu, setNewEdu] = useState({ degree: "", school: "", year: "" });

  useEffect(() => {
    if (open) {
      fetchExperienceAndEducation();
    }
  }, [open]);

  const fetchExperienceAndEducation = async () => {
    const [expRes, eduRes] = await Promise.all([
      supabase.from("experiences").select("*").eq("profile_id", profile.id),
      supabase.from("education").select("*").eq("profile_id", profile.id),
    ]);
    setExperiences(expRes.data || []);
    setEducation(eduRes.data || []);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.user_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setPhotoUrl(urlData.publicUrl);
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video must be less than 50MB");
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.user_id}/intro-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setIntroVideoUrl(urlData.publicUrl);
      toast.success("Video uploaded successfully");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const addLink = () => {
    if (newLink.trim() && !links.includes(newLink.trim())) {
      setLinks([...links, newLink.trim()]);
      setNewLink("");
    }
  };

  const removeLink = (link: string) => {
    setLinks(links.filter((l) => l !== link));
  };

  // Experience handlers
  const addExperience = async () => {
    if (!newExp.role.trim() || !newExp.company.trim()) {
      toast.error("Role and company are required");
      return;
    }
    const { error } = await supabase.from("experiences").insert({
      profile_id: profile.id,
      role: newExp.role,
      company: newExp.company,
      duration: newExp.duration || null,
    });
    if (error) {
      toast.error("Failed to add experience");
    } else {
      setNewExp({ role: "", company: "", duration: "" });
      fetchExperienceAndEducation();
    }
  };

  const deleteExperience = async (id: string) => {
    const { error } = await supabase.from("experiences").delete().eq("id", id);
    if (!error) fetchExperienceAndEducation();
  };

  // Education handlers
  const addEducation = async () => {
    if (!newEdu.degree.trim() || !newEdu.school.trim()) {
      toast.error("Degree and school are required");
      return;
    }
    const { error } = await supabase.from("education").insert({
      profile_id: profile.id,
      degree: newEdu.degree,
      school: newEdu.school,
      year: newEdu.year || null,
    });
    if (error) {
      toast.error("Failed to add education");
    } else {
      setNewEdu({ degree: "", school: "", year: "" });
      fetchExperienceAndEducation();
    }
  };

  const deleteEducation = async (id: string) => {
    const { error } = await supabase.from("education").delete().eq("id", id);
    if (!error) fetchExperienceAndEducation();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          photo_url: photoUrl || null,
          name: name || null,
          age: age ? parseInt(age) : null,
          phone: phone || null,
          email: email || null,
          city: city || null,
          country: country || null,
          looking_for: lookingFor || null,
          about_me: aboutMe || null,
          my_idea: myIdea || null,
          interests: interests,
          startup_name: startupName || null,
          links: links,
          intro_video_url: introVideoUrl || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={photoUrl} alt={name} />
                  <AvatarFallback>{name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Your city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Your country"
                />
              </div>
            </div>

            {/* Startup Name */}
            <div className="space-y-2">
              <Label htmlFor="startupName">Startup Name</Label>
              <Input
                id="startupName"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="Your startup name (optional)"
              />
            </div>

            {/* Looking For - Now Textarea */}
            <div className="space-y-2">
              <Label htmlFor="lookingFor">Looking For *</Label>
              <Textarea
                id="lookingFor"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                placeholder="Describe what kind of co-founder, team member, or collaborator you're looking for..."
                rows={3}
              />
            </div>

            {/* About Me */}
            <div className="space-y-2">
              <Label htmlFor="aboutMe">About Me *</Label>
              <Textarea
                id="aboutMe"
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            {/* My Idea */}
            <div className="space-y-2">
              <Label htmlFor="myIdea">My Idea *</Label>
              <Textarea
                id="myIdea"
                value={myIdea}
                onChange={(e) => setMyIdea(e.target.value)}
                placeholder="Describe your startup idea..."
                rows={3}
              />
            </div>

            {/* Intro Video */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Intro Video (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Upload a short video about your startup idea (max 50MB)
              </p>
              {introVideoUrl && (
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <video
                    src={introVideoUrl}
                    controls
                    className="w-full max-h-48 object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-6 h-6"
                    onClick={() => setIntroVideoUrl("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingVideo}
                className="w-full"
              >
                {uploadingVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    {introVideoUrl ? "Replace Video" : "Upload Video"}
                  </>
                )}
              </Button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <Label>Interests *</Label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <Badge
                    key={interest}
                    variant={interests.includes(interest) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="space-y-2">
              <Label>Links</Label>
              <div className="flex gap-2">
                <Input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="Add a link (LinkedIn, GitHub, etc.)"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
                />
                <Button type="button" variant="outline" onClick={addLink}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {links.map((link) => (
                    <Badge
                      key={link}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {link}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeLink(link)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Experience Section */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Briefcase className="w-5 h-5" />
                Experience
              </Label>
              
              {experiences.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{exp.role}</p>
                    <p className="text-sm text-muted-foreground">
                      {exp.company} {exp.duration && `• ${exp.duration}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteExperience(exp.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}

              <div className="space-y-3 p-3 border border-dashed rounded-lg">
                <p className="text-sm font-medium">Add New Experience</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Role *"
                    value={newExp.role}
                    onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                  />
                  <Input
                    placeholder="Company *"
                    value={newExp.company}
                    onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Duration (e.g. 2020 - Present)"
                    value={newExp.duration}
                    onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                  />
                  <Button type="button" onClick={addExperience}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Education Section */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <GraduationCap className="w-5 h-5" />
                Education
              </Label>
              
              {education.map((edu) => (
                <div key={edu.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{edu.degree}</p>
                    <p className="text-sm text-muted-foreground">
                      {edu.school} {edu.year && `• ${edu.year}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteEducation(edu.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}

              <div className="space-y-3 p-3 border border-dashed rounded-lg">
                <p className="text-sm font-medium">Add New Education</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Degree *"
                    value={newEdu.degree}
                    onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                  />
                  <Input
                    placeholder="School *"
                    value={newEdu.school}
                    onChange={(e) => setNewEdu({ ...newEdu, school: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Year (e.g. 2020)"
                    value={newEdu.year}
                    onChange={(e) => setNewEdu({ ...newEdu, year: e.target.value })}
                  />
                  <Button type="button" onClick={addEducation}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
