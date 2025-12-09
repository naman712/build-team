import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Check if we have a valid session from the reset password link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Invalid or expired reset link');
        navigate('/auth');
      }
    };
    checkSession();
  }, [navigate]);

  const handleResetPassword = async () => {
    const validation = passwordSchema.safeParse({ password, confirmPassword });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast.success('Password updated successfully!');
      
      // Redirect to feed after a short delay
      setTimeout(() => {
        navigate('/feed');
      }, 2000);
    } catch (err) {
      toast.error('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <Card className="w-full max-w-md shadow-card border-border/50">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Password Updated!</h2>
            <p className="text-muted-foreground">
              Your password has been successfully updated. Redirecting...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set New Password</h1>
          <p className="text-muted-foreground mt-2">Enter your new password below</p>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">Reset Password</CardTitle>
            <CardDescription>
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>
            <Button 
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity" 
              onClick={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
