import { useState, useRef } from "react";
import { Camera, Plus, X, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface ProfileEditDialogProps {
  profile: Profile;
  onSuccess: () => void;
  children: React.ReactNode;
}

const LOOKING_FOR_OPTIONS = [
  "Technical Co-founder",
  "Business Co-founder",
  "Marketing Co-founder",
  "Design Co-founder",
  "Operations Co-founder",
  "Any Co-founder",
  "Team Members",
  "Mentors",
  "Investors",
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

            {/* Looking For */}
            <div className="space-y-2">
              <Label>Looking For *</Label>
              <Select value={lookingFor} onValueChange={setLookingFor}>
                <SelectTrigger>
                  <SelectValue placeholder="What are you looking for?" />
                </SelectTrigger>
                <SelectContent>
                  {LOOKING_FOR_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
