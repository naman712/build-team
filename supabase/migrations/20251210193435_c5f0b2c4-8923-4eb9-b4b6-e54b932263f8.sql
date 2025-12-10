-- Drop the restrictive SELECT policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view their own referrals as referrer" ON public.referrals;
DROP POLICY IF EXISTS "Users can view their referral status" ON public.referrals;

-- Create permissive SELECT policies
CREATE POLICY "Users can view referrals as referrer"
ON public.referrals
FOR SELECT
TO authenticated
USING (referrer_id = get_profile_id(auth.uid()));

CREATE POLICY "Users can view referrals as referred"
ON public.referrals
FOR SELECT
TO authenticated
USING (referred_id = get_profile_id(auth.uid()));