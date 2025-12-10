-- Add successful_referrals column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS successful_referrals INTEGER DEFAULT 0;

-- Update the referral code generation to be exactly 6 characters (FN + 4 chars from user_id)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.referral_code IS NULL THEN
    -- Generate 6 character code: FN + first 4 chars of MD5 hash of user_id
    NEW.referral_code := 'FN' || UPPER(SUBSTRING(MD5(NEW.user_id::text) FROM 1 FOR 4));
  END IF;
  RETURN NEW;
END;
$function$;

-- Create function to update referrer's successful_referrals count when referral becomes successful
CREATE OR REPLACE FUNCTION public.update_referrer_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'successful' AND OLD.status = 'pending' THEN
    UPDATE public.profiles 
    SET successful_referrals = successful_referrals + 1
    WHERE id = NEW.referrer_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-update referrer count
DROP TRIGGER IF EXISTS on_referral_successful ON public.referrals;
CREATE TRIGGER on_referral_successful
  AFTER UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referrer_count();