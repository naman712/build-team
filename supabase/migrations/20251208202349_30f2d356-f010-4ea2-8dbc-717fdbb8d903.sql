-- Add parent_comment_id column to support threaded replies
ALTER TABLE public.post_comments 
ADD COLUMN parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- Create index for faster querying of replies
CREATE INDEX idx_post_comments_parent ON public.post_comments(parent_comment_id);

-- Update RLS policy for replies - users with complete profiles can reply
DROP POLICY IF EXISTS "Completed profiles can comment" ON public.post_comments;

CREATE POLICY "Completed profiles can comment" 
ON public.post_comments 
FOR INSERT 
WITH CHECK (
  (profile_id = get_profile_id(auth.uid())) AND is_profile_complete(profile_id)
);