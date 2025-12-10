-- Add referral_code column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create referrals table to track referrals
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful')),
  profile_completed BOOLEAN DEFAULT FALSE,
  post_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals as referrer"
ON public.referrals
FOR SELECT
USING (referrer_id = get_profile_id(auth.uid()));

CREATE POLICY "Users can view their referral status"
ON public.referrals
FOR SELECT
USING (referred_id = get_profile_id(auth.uid()));

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'FN' || UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate referral code on profile creation
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Generate referral codes for existing profiles
UPDATE public.profiles 
SET referral_code = 'FN' || UPPER(SUBSTRING(MD5(id::text || NOW()::text) FROM 1 FOR 6))
WHERE referral_code IS NULL;

-- Function to check and update referral status
CREATE OR REPLACE FUNCTION public.check_referral_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_record RECORD;
BEGIN
  -- Check if this profile has a pending referral
  SELECT * INTO ref_record FROM public.referrals 
  WHERE referred_id = NEW.id AND status = 'pending';
  
  IF FOUND THEN
    -- Update profile_completed status
    IF NEW.profile_completed = TRUE THEN
      UPDATE public.referrals 
      SET profile_completed = TRUE
      WHERE referred_id = NEW.id;
    END IF;
    
    -- Check if both conditions are met
    SELECT * INTO ref_record FROM public.referrals 
    WHERE referred_id = NEW.id;
    
    IF ref_record.profile_completed = TRUE AND ref_record.post_created = TRUE AND ref_record.status = 'pending' THEN
      UPDATE public.referrals 
      SET status = 'successful', completed_at = NOW()
      WHERE referred_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on profile update to check referral completion
CREATE TRIGGER check_referral_on_profile_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_referral_completion();

-- Function to mark post_created when user creates first post
CREATE OR REPLACE FUNCTION public.check_referral_post_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_record RECORD;
BEGIN
  -- Check if this profile has a pending referral
  SELECT * INTO ref_record FROM public.referrals 
  WHERE referred_id = NEW.profile_id AND status = 'pending' AND post_created = FALSE;
  
  IF FOUND THEN
    UPDATE public.referrals 
    SET post_created = TRUE
    WHERE referred_id = NEW.profile_id;
    
    -- Check if both conditions are now met
    SELECT * INTO ref_record FROM public.referrals 
    WHERE referred_id = NEW.profile_id;
    
    IF ref_record.profile_completed = TRUE AND ref_record.post_created = TRUE THEN
      UPDATE public.referrals 
      SET status = 'successful', completed_at = NOW()
      WHERE referred_id = NEW.profile_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on post insert to check referral completion
CREATE TRIGGER check_referral_on_post_insert
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.check_referral_post_created();

-- Function to get successful referral count
CREATE OR REPLACE FUNCTION public.get_successful_referral_count(profile_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.referrals 
  WHERE referrer_id = profile_uuid AND status = 'successful';
$$;