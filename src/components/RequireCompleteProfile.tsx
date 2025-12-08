import { Navigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

interface RequireCompleteProfileProps {
  children: React.ReactNode;
}

export function RequireCompleteProfile({ children }: RequireCompleteProfileProps) {
  const { profile, loading, isProfileComplete } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isProfileComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
