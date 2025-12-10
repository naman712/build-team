import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, User, MapPin, Lightbulb, Heart, Sparkles,
  ArrowRight, ArrowLeft, Check, Upload
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const INTEREST_OPTIONS = [
  'AI/ML', 'SaaS', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce',
  'Web3/Crypto', 'Climate Tech', 'B2B', 'B2C', 'Mobile Apps', 'Gaming',
  'Social Media', 'Productivity', 'Developer Tools', 'Marketplace',
  'Hardware', 'IoT', 'Robotics', 'Biotech'
];

const steps = [
  { id: 1, title: 'Profile Photo', icon: Camera },
  { id: 2, title: 'Basic Info', icon: User },
  { id: 3, title: 'Location', icon: MapPin },
  { id: 4, title: 'About You', icon: Heart },
  { id: 5, title: 'Your Idea', icon: Lightbulb },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const { user } = useAuth();
  const { profile, loading: profileLoading, isProfileComplete } = useProfile();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    city: '',
    country: '',
    looking_for: '',
    about_me: '',
    my_idea: '',
    interests: [] as string[],
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        phone: profile.phone || '',
        city: profile.city || '',
        country: profile.country || '',
        looking_for: profile.looking_for || '',
        about_me: profile.about_me || '',
        my_idea: profile.my_idea || '',
        interests: profile.interests || [],
      });
      if (profile.photo_url) {
        setPhotoPreview(profile.photo_url);
      }
    }
  }, [profile]);

  // Only redirect if profile is complete AND not in edit mode
  useEffect(() => {
    if (isProfileComplete && !isEditMode) {
      navigate('/discover');
    }
  }, [isProfileComplete, isEditMode, navigate]);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!photoPreview) {
          toast.error('Please upload a profile photo');
          return false;
        }
        return true;
      case 2:
        if (!formData.name.trim()) {
          toast.error('Please enter your name');
          return false;
        }
        if (!formData.age || parseInt(formData.age) < 18) {
          toast.error('Please enter a valid age (18+)');
          return false;
        }
        if (!formData.phone.trim()) {
          toast.error('Please enter your phone number');
          return false;
        }
        return true;
      case 3:
        if (!formData.city.trim() || !formData.country.trim()) {
          toast.error('Please enter your city and country');
          return false;
        }
        return true;
      case 4:
        if (!formData.looking_for.trim()) {
          toast.error('Please tell us what you are looking for');
          return false;
        }
        if (!formData.about_me.trim()) {
          toast.error('Please tell us about yourself');
          return false;
        }
        if (formData.interests.length === 0) {
          toast.error('Please select at least one interest');
          return false;
        }
        return true;
      case 5:
        if (!formData.my_idea.trim()) {
          toast.error('Please describe your startup idea');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    if (!profile || !user) return;

    setIsSubmitting(true);

    try {
      let photo_url = profile.photo_url;

      // Upload photo if changed
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        // Create bucket if needed (will fail silently if exists)
        await supabase.storage.createBucket('avatars', { public: true });

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, photoFile, { upsert: true });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload photo. Please try again.');
          setIsSubmitting(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        photo_url = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          photo_url,
          name: formData.name,
          age: parseInt(formData.age),
          phone: formData.phone,
          city: formData.city,
          country: formData.country,
          looking_for: formData.looking_for,
          about_me: formData.about_me,
          my_idea: formData.my_idea,
          interests: formData.interests,
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to save profile. Please try again.');
      } else {
        if (isEditMode) {
          toast.success('Profile updated successfully!');
          navigate('/profile');
        } else {
          toast.success('Profile completed! Welcome to FounderNow!');
          navigate('/discover');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">FounderNow</span>
            </div>
            <span className="text-sm text-muted-foreground">Step {currentStep} of 5</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="pt-28 pb-6 px-4">
        <div className="container mx-auto max-w-md">
          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step.id < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id === currentStep
                      ? 'bg-gradient-primary text-primary-foreground shadow-glow'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 pb-32">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-card border-border/50">
                <CardContent className="p-6">
                  {/* Step 1: Photo */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Add your photo</h2>
                        <p className="text-muted-foreground">
                          A great photo helps others recognize you
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-40 h-40 rounded-full overflow-hidden bg-muted border-4 border-primary/20">
                            {photoPreview ? (
                              <img
                                src={photoPreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Camera className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <label className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg hover:opacity-90 transition-opacity">
                            <Upload className="w-5 h-5" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Basic Info */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Basic Info</h2>
                        <p className="text-muted-foreground">
                          Tell us a bit about yourself
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                            id="age"
                            type="number"
                            placeholder="25"
                            min="18"
                            max="100"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Location */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Your Location</h2>
                        <p className="text-muted-foreground">
                          Where are you based?
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            placeholder="San Francisco"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            placeholder="United States"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: About You */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">About You</h2>
                        <p className="text-muted-foreground">
                          What makes you a great co-founder?
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="looking_for">What are you looking for?</Label>
                          <Input
                            id="looking_for"
                            placeholder="e.g., Technical Co-founder, Business Partner"
                            value={formData.looking_for}
                            onChange={(e) => setFormData({ ...formData, looking_for: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="about_me">About Me</Label>
                          <Textarea
                            id="about_me"
                            placeholder="Tell others about your background, skills, and what you bring to a startup..."
                            rows={4}
                            value={formData.about_me}
                            onChange={(e) => setFormData({ ...formData, about_me: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Your Interests</Label>
                          <div className="flex flex-wrap gap-2">
                            {INTEREST_OPTIONS.map((interest) => (
                              <Badge
                                key={interest}
                                variant={formData.interests.includes(interest) ? 'default' : 'outline'}
                                className={`cursor-pointer transition-all ${
                                  formData.interests.includes(interest)
                                    ? 'bg-primary hover:bg-primary/90'
                                    : 'hover:bg-primary/10'
                                }`}
                                onClick={() => handleInterestToggle(interest)}
                              >
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Your Idea */}
                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Your Idea</h2>
                        <p className="text-muted-foreground">
                          Share your startup vision
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="my_idea">Describe Your Startup Idea</Label>
                          <Textarea
                            id="my_idea"
                            placeholder="What problem are you solving? What's your vision for the product? What stage are you at?"
                            rows={6}
                            value={formData.my_idea}
                            onChange={(e) => setFormData({ ...formData, my_idea: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-4">
        <div className="container mx-auto max-w-md flex gap-3">
          {currentStep > 1 && (
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {currentStep < 5 ? (
            <Button className="flex-1 bg-gradient-primary hover:opacity-90" onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              className="flex-1 bg-gradient-primary hover:opacity-90" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Complete Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
