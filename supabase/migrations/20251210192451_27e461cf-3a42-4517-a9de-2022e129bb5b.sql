-- Allow authenticated users to insert referrals where they are the referred person
CREATE POLICY "Users can create their own referral record"
ON public.referrals
FOR INSERT
WITH CHECK (referred_id = get_profile_id(auth.uid()));

-- Also need to allow the triggers to update referrals (for status changes)
-- Using SECURITY DEFINER functions handles this, but we need triggers to actually exist
-- Let's make sure triggers are properly created

-- Drop and recreate the trigger for checking referral completion on profile update
DROP TRIGGER IF EXISTS check_referral_on_profile_update ON public.profiles;
CREATE TRIGGER check_referral_on_profile_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_completion();

-- Drop and recreate the trigger for checking post creation
DROP TRIGGER IF EXISTS check_referral_on_post_create ON public.posts;
CREATE TRIGGER check_referral_on_post_create
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_post_created();