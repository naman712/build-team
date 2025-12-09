import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, UserCircle, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RequireCompleteProfileProps {
  children: React.ReactNode;
}

export function RequireCompleteProfile({ children }: RequireCompleteProfileProps) {
  const navigate = useNavigate();
  const { profile, loading, isProfileComplete } = useProfile();
  const [dialogOpen, setDialogOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isProfileComplete) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
              <UserCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-xl">Complete Your Profile</DialogTitle>
            <DialogDescription className="text-center">
              To start discovering and connecting with co-founders, you need to complete your profile first. It only takes a few minutes!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button 
              onClick={() => navigate('/onboarding')}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              Complete Profile
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/feed')}
              className="w-full"
            >
              Go back to Feed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
}
