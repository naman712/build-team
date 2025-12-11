-- Add streak columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN current_streak integer DEFAULT 0,
ADD COLUMN last_streak_date date DEFAULT NULL,
ADD COLUMN longest_streak integer DEFAULT 0;

-- Function to check and update streak
CREATE OR REPLACE FUNCTION public.update_user_streak(profile_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_date date;
  today_date date := CURRENT_DATE;
  posted_today boolean;
  new_streak integer;
  current integer;
  longest integer;
BEGIN
  -- Get current streak info
  SELECT last_streak_date, current_streak, longest_streak 
  INTO last_date, current, longest
  FROM public.profiles 
  WHERE id = profile_uuid;
  
  -- Check if user posted today
  SELECT EXISTS(
    SELECT 1 FROM public.posts 
    WHERE profile_id = profile_uuid 
    AND DATE(created_at) = today_date
  ) INTO posted_today;
  
  -- If already updated today, return current streak
  IF last_date = today_date THEN
    RETURN current;
  END IF;
  
  -- If posted today, calculate new streak
  IF posted_today THEN
    IF last_date = today_date - 1 THEN
      -- Consecutive day, increment streak
      new_streak := current + 1;
    ELSE
      -- Missed days or first time, start at 1
      new_streak := 1;
    END IF;
    
    -- Update longest streak if needed
    IF new_streak > longest THEN
      longest := new_streak;
    END IF;
    
    -- Update profile
    UPDATE public.profiles 
    SET current_streak = new_streak,
        last_streak_date = today_date,
        longest_streak = longest
    WHERE id = profile_uuid;
    
    RETURN new_streak;
  ELSE
    -- No post today, check if streak should reset
    IF last_date IS NOT NULL AND last_date < today_date - 1 THEN
      UPDATE public.profiles 
      SET current_streak = 0
      WHERE id = profile_uuid;
      RETURN 0;
    END IF;
    RETURN current;
  END IF;
END;
$$;

-- Trigger to auto-update streak when a post is created
CREATE OR REPLACE FUNCTION public.check_streak_on_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.update_user_streak(NEW.profile_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_streak_on_post
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.check_streak_on_post();