import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import logoImage from "@/assets/logo.png";

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthStep = 'form' | 'otp-verification' | 'reset-password-otp';

export default function Auth() {
  const { user, signIn, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('form');
  const [otpValue, setOtpValue] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingName, setPendingName] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  
  // Forgot password state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordOtpSent, setForgotPasswordOtpSent] = useState(false);
  const [resetPasswordOtp, setResetPasswordOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/feed" replace />;
  }

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast.error('Please enter your email address');
      return;
    }

    const emailValidation = z.string().email().safeParse(forgotPasswordEmail);
    if (!emailValidation.success) {
      toast.error('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: forgotPasswordEmail,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        if (error.message.includes('User not found')) {
          toast.error('No account found with this email');
        } else {
          toast.error(error.message);
        }
      } else {
        setForgotPasswordOtpSent(true);
        toast.success('OTP sent to your email!');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleVerifyResetOtp = async () => {
    if (resetPasswordOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: forgotPasswordEmail,
        token: resetPasswordOtp,
        type: 'email',
      });

      if (error) {
        toast.error(error.message);
        setForgotPasswordLoading(false);
        return;
      }

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error(updateError.message);
        setForgotPasswordLoading(false);
        return;
      }

      toast.success('Password updated successfully!');
      setForgotPasswordOpen(false);
      resetForgotPasswordState();
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const resetForgotPasswordState = () => {
    setForgotPasswordEmail('');
    setForgotPasswordOtpSent(false);
    setResetPasswordOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleLogin = async () => {
    const validation = loginSchema.safeParse({ email, password });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email before signing in.');
        } else {
          toast.error(error.message);
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    const validation = signupSchema.safeParse({ name, phone, email, password });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/feed`,
          data: {
            name,
            phone,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      setPendingEmail(email);
      setPendingName(name);
      setPendingPhone(phone);
      setAuthStep('otp-verification');
      toast.success('Verification code sent to your email!');
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpValue,
        type: 'signup',
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const updateProfileWithRetry = async (retries = 3) => {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', data.user!.id)
            .maybeSingle();

          if (!existingProfile && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return updateProfileWithRetry(retries - 1);
          }

          if (existingProfile) {
            await supabase
              .from('profiles')
              .update({ name: pendingName, phone: pendingPhone })
              .eq('user_id', data.user!.id);
          }
        };

        await updateProfileWithRetry();
      }

      toast.success('Email verified successfully!');
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Verification code resent!');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setAuthStep('form');
    setOtpValue('');
    setPendingEmail('');
    setPendingName('');
    setPendingPhone('');
  };

  // OTP Verification Screen
  if (authStep === 'otp-verification') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verify Your Email</h1>
            <p className="text-muted-foreground mt-2">
              We've sent a 6-digit code to<br />
              <span className="font-medium text-foreground">{pendingEmail}</span>
            </p>
          </div>

          <Card className="shadow-card border-border/50">
            <CardContent className="pt-6 space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={(value) => setOtpValue(value)}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity" 
                onClick={handleVerifyOtp}
                disabled={isLoading || otpValue.length !== 6}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Verify Email
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleResendOtp}
                  disabled={isLoading}
                >
                  Resend Code
                </Button>
              </div>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={resetForm}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign Up
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src={logoImage} alt="FounderNow" className="w-10 h-10 rounded-xl object-cover shadow-glow" />
            <span className="text-2xl font-bold text-foreground">FounderNow</span>
          </div>
          <p className="text-muted-foreground">Find your perfect co-founder</p>
        </div>

        <Card className="shadow-card border-border/50">
          <Tabs defaultValue="login" className="w-full" onValueChange={resetForm}>
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login">
              <CardHeader className="pt-0 pb-2">
                <CardTitle className="text-xl">Welcome back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <Dialog open={forgotPasswordOpen} onOpenChange={(open) => {
                      setForgotPasswordOpen(open);
                      if (!open) {
                        resetForgotPasswordState();
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="px-0 h-auto text-xs text-primary">
                          Forgot password?
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        {!forgotPasswordOtpSent ? (
                          <>
                            <DialogHeader>
                              <DialogTitle>Reset Password</DialogTitle>
                              <DialogDescription>
                                Enter your email address and we'll send you an OTP to reset your password.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="forgot-email">Email</Label>
                                <Input
                                  id="forgot-email"
                                  type="email"
                                  placeholder="you@example.com"
                                  value={forgotPasswordEmail}
                                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                  disabled={forgotPasswordLoading}
                                  onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                                />
                              </div>
                              <Button 
                                className="w-full bg-gradient-primary hover:opacity-90" 
                                onClick={handleForgotPassword}
                                disabled={forgotPasswordLoading}
                              >
                                {forgotPasswordLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Send OTP
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <DialogHeader>
                              <DialogTitle>Enter OTP & New Password</DialogTitle>
                              <DialogDescription>
                                Enter the 6-digit code sent to {forgotPasswordEmail}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="flex justify-center">
                                <InputOTP
                                  maxLength={6}
                                  value={resetPasswordOtp}
                                  onChange={(value) => setResetPasswordOtp(value)}
                                  disabled={forgotPasswordLoading}
                                >
                                  <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                  </InputOTPGroup>
                                </InputOTP>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                  id="new-password"
                                  type="password"
                                  placeholder="••••••••"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  disabled={forgotPasswordLoading}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirm-new-password">Confirm Password</Label>
                                <Input
                                  id="confirm-new-password"
                                  type="password"
                                  placeholder="••••••••"
                                  value={confirmNewPassword}
                                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                                  disabled={forgotPasswordLoading}
                                />
                              </div>
                              <Button 
                                className="w-full bg-gradient-primary hover:opacity-90" 
                                onClick={handleVerifyResetOtp}
                                disabled={forgotPasswordLoading || resetPasswordOtp.length !== 6}
                              >
                                {forgotPasswordLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Reset Password
                              </Button>
                              <Button 
                                variant="ghost" 
                                className="w-full"
                                onClick={() => setForgotPasswordOtpSent(false)}
                              >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                              </Button>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <Button 
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity" 
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Sign In
                </Button>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader className="pt-0 pb-2">
                <CardTitle className="text-xl">Create account</CardTitle>
                <CardDescription>
                  Enter your details to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>
                <Button 
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity" 
                  onClick={handleSignup}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Create Account
                </Button>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
