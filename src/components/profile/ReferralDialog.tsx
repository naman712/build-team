import { useState, useEffect } from "react";
import { Gift, Copy, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReferralDialogProps {
  referralCode: string | null;
  profileId: string;
  children: React.ReactNode;
}

export function ReferralDialog({ referralCode, profileId, children }: ReferralDialogProps) {
  const [copied, setCopied] = useState(false);
  const [successfulReferrals, setSuccessfulReferrals] = useState(0);
  const [pendingReferrals, setPendingReferrals] = useState(0);

  useEffect(() => {
    const fetchReferralStats = async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('status')
        .eq('referrer_id', profileId);

      if (!error && data) {
        setSuccessfulReferrals(data.filter(r => r.status === 'successful').length);
        setPendingReferrals(data.filter(r => r.status === 'pending').length);
      }
    };

    fetchReferralStats();
  }, [profileId]);

  const handleCopy = async () => {
    if (!referralCode) return;
    
    const shareMessage = `Join FounderNow and find your perfect co-founder! Use my referral code: ${referralCode}\n\nSign up at: https://foundernow.in/auth`;
    
    await navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    toast.success("Referral message copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Refer & Earn
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Reward Info */}
          <div className="bg-gradient-primary text-primary-foreground p-4 rounded-xl">
            <p className="font-semibold text-lg">Get ₹250 Amazon voucher</p>
            <p className="text-sm opacity-90">on 10 successful referrals</p>
          </div>

          {/* Progress */}
          <div className="bg-secondary/50 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Your Progress</span>
              </div>
              <span className="text-lg font-bold text-primary">{successfulReferrals}/10</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((successfulReferrals / 10) * 100, 100)}%` }}
              />
            </div>
            {pendingReferrals > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {pendingReferrals} pending referral{pendingReferrals > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Referral Code */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary p-3 rounded-lg font-mono text-lg font-bold text-center">
                {referralCode || "Loading..."}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopy}
                disabled={!referralCode}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-muted/50 p-4 rounded-xl space-y-2">
            <p className="text-sm font-medium">Conditions for successful referral:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                The referred user must complete their profile
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                The referred user must create at least one post
              </li>
            </ul>
          </div>

          {/* Share Button */}
          <Button className="w-full" onClick={handleCopy} disabled={!referralCode}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Referral Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
