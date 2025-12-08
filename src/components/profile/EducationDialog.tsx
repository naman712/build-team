import { useState } from "react";
import { GraduationCap, Trash2 } from "lucide-react";
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

interface Education {
  id: string;
  degree: string;
  school: string;
  year: string | null;
}

interface EducationDialogProps {
  profileId: string;
  education?: Education;
  onSuccess: () => void;
  children: React.ReactNode;
}

export function EducationDialog({ profileId, education, onSuccess, children }: EducationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [degree, setDegree] = useState(education?.degree || "");
  const [school, setSchool] = useState(education?.school || "");
  const [year, setYear] = useState(education?.year || "");

  const isEdit = !!education;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!degree.trim() || !school.trim()) {
      toast.error("Degree and school are required");
      return;
    }

    setLoading(true);

    if (isEdit) {
      const { error } = await supabase
        .from("education")
        .update({ degree, school, year: year || null })
        .eq("id", education.id);

      if (error) {
        toast.error("Failed to update education");
      } else {
        toast.success("Education updated");
        onSuccess();
        setOpen(false);
      }
    } else {
      const { error } = await supabase
        .from("education")
        .insert({ profile_id: profileId, degree, school, year: year || null });

      if (error) {
        toast.error("Failed to add education");
      } else {
        toast.success("Education added");
        onSuccess();
        setOpen(false);
        setDegree("");
        setSchool("");
        setYear("");
      }
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!education) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("education")
      .delete()
      .eq("id", education.id);

    if (error) {
      toast.error("Failed to delete education");
    } else {
      toast.success("Education deleted");
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
            <GraduationCap className="w-5 h-5" />
            {isEdit ? "Edit Education" : "Add Education"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="degree">Degree *</Label>
            <Input
              id="degree"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. B.S. Computer Science"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school">School *</Label>
            <Input
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. Stanford University"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2020"
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
