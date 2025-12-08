-- Drop the existing restrictive delete policy
DROP POLICY IF EXISTS "Users can cancel their requests" ON public.connections;

-- Create a new policy that allows users to delete their own connections (both pending and accepted)
CREATE POLICY "Users can delete their connections" 
ON public.connections 
FOR DELETE 
USING (
  (requester_id = get_profile_id(auth.uid())) 
  OR (receiver_id = get_profile_id(auth.uid()))
);