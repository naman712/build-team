import { useState } from "react";
import { Briefcase, Trash2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Experience {
  id: string;
  role: string;
  company: string;
  duration: string | null;
}

interface ExperienceDialogProps {
  profileId: string;
  experience?: Experience;
  onSuccess: () => void;
  children: React.ReactNode;
}

export function ExperienceDialog({ profileId, experience, onSuccess, children }: ExperienceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(experience?.role || "");
  const [company, setCompany] = useState(experience?.company || "");
  const [duration, setDuration] = useState(experience?.duration || "");

  const isEdit = !!experience;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role.trim() || !company.trim()) {
      toast.error("Role and company are required");
      return;
    }

    setLoading(true);

    if (isEdit) {
      const { error } = await supabase
        .from("experiences")
        .update({ role, company, duration: duration || null })
        .eq("id", experience.id);

      if (error) {
        toast.error("Failed to update experience");
      } else {
        toast.success("Experience updated");
        onSuccess();
        setOpen(false);
      }
    } else {
      const { error } = await supabase
        .from("experiences")
        .insert({ profile_id: profileId, role, company, duration: duration || null });

      if (error) {
        toast.error("Failed to add experience");
      } else {
        toast.success("Experience added");
        onSuccess();
        setOpen(false);
        setRole("");
        setCompany("");
        setDuration("");
      }
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!experience) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("experiences")
      .delete()
      .eq("id", experience.id);

    if (error) {
      toast.error("Failed to delete experience");
    } else {
      toast.success("Experience deleted");
      onSuccess();
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            {isEdit ? "Edit Experience" : "Add Experience"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 2020 - Present"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : isEdit ? "Update" : "Add"}
            </Button>
            {isEdit && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
