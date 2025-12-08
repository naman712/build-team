-- Create profiles table with all mandatory and optional fields
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Mandatory fields
  photo_url TEXT,
  name TEXT,
  age INTEGER,
  phone TEXT,
  email TEXT,
  city TEXT,
  country TEXT,
  looking_for TEXT,
  about_me TEXT,
  my_idea TEXT,
  
  -- Interests stored as array
  interests TEXT[] DEFAULT '{}',
  
  -- Optional fields
  startup_name TEXT,
  intro_video_url TEXT,
  links TEXT[] DEFAULT '{}',
  
  -- Profile completion tracking
  profile_completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create experience table (multiple entries per user)
CREATE TABLE public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create education table (multiple entries per user)
CREATE TABLE public.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  degree TEXT NOT NULL,
  school TEXT NOT NULL,
  year TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, profile_id)
);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create connections table
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status connection_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id),
  CHECK (requester_id != receiver_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.connections(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper function to get profile_id from auth.uid()
CREATE OR REPLACE FUNCTION public.get_profile_id(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Helper function to check if two profiles are connected
CREATE OR REPLACE FUNCTION public.are_connected(profile1 UUID, profile2 UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
    AND (
      (requester_id = profile1 AND receiver_id = profile2)
      OR (requester_id = profile2 AND receiver_id = profile1)
    )
  );
$$;

-- Helper function to check if profile is completed
CREATE OR REPLACE FUNCTION public.is_profile_complete(profile_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT profile_completed FROM public.profiles WHERE id = profile_uuid;
$$;

-- PROFILES POLICIES
-- Users can view all profiles (for discovery)
CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- EXPERIENCES POLICIES
CREATE POLICY "Anyone can view experiences"
ON public.experiences FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own experiences"
ON public.experiences FOR INSERT
TO authenticated
WITH CHECK (profile_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can update their own experiences"
ON public.experiences FOR UPDATE
TO authenticated
USING (profile_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can delete their own experiences"
ON public.experiences FOR DELETE
TO authenticated
USING (profile_id = public.get_profile_id(auth.uid()));

-- EDUCATION POLICIES
CREATE POLICY "Anyone can view education"
ON public.education FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own education"
ON public.education FOR INSERT
TO authenticated
WITH CHECK (profile_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can update their own education"
ON public.education FOR UPDATE
TO authenticated
USING (profile_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can delete their own education"
ON public.education FOR DELETE
TO authenticated
USING (profile_id = public.get_profile_id(auth.uid()));

-- POSTS POLICIES
-- Everyone can view posts
CREATE POLICY "Anyone can view posts"
ON public.posts FOR SELECT
TO authenticated
USING (true);

-- Only completed profiles can create posts
CREATE POLICY "Completed profiles can create posts"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = public.get_profile_id(auth.uid())
  AND public.is_profile_complete(profile_id)
);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON public.posts FOR UPDATE
TO authenticated
USING (profile_id = public.get_profile_id(auth.uid()));

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON public.posts FOR DELETE
TO authenticated
USING (profile_id = public.get_profile_id(auth.uid()));

-- POST_LIKES POLICIES
CREATE POLICY "Anyone can view likes"
ON public.post_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can like posts"
ON public.post_likes FOR INSERT
TO authenticated
WITH CHECK (profile_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can unlike posts"
ON public.post_likes FOR DELETE
TO authenticated
USING (profile_id = public.get_profile_id(auth.uid()));

-- POST_COMMENTS POLICIES
CREATE POLICY "Anyone can view comments"
ON public.post_comments FOR SELECT
TO authenticated
USING (true);

-- Only completed profiles can comment
CREATE POLICY "Completed profiles can comment"
ON public.post_comments FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = public.get_profile_id(auth.uid())
  AND public.is_profile_complete(profile_id)
);

CREATE POLICY "Users can delete their own comments"
ON public.post_comments FOR DELETE
TO authenticated
USING (profile_id = public.get_profile_id(auth.uid()));

-- CONNECTIONS POLICIES
-- Users can view connections they're part of
CREATE POLICY "Users can view their connections"
ON public.connections FOR SELECT
TO authenticated
USING (
  requester_id = public.get_profile_id(auth.uid())
  OR receiver_id = public.get_profile_id(auth.uid())
);

-- Only completed profiles can send connection requests
CREATE POLICY "Completed profiles can send requests"
ON public.connections FOR INSERT
TO authenticated
WITH CHECK (
  requester_id = public.get_profile_id(auth.uid())
  AND public.is_profile_complete(requester_id)
);

-- Receivers can update connection status (accept/reject)
CREATE POLICY "Receivers can respond to requests"
ON public.connections FOR UPDATE
TO authenticated
USING (receiver_id = public.get_profile_id(auth.uid()));

-- Users can delete their own sent requests
CREATE POLICY "Users can cancel their requests"
ON public.connections FOR DELETE
TO authenticated
USING (requester_id = public.get_profile_id(auth.uid()) AND status = 'pending');

-- MESSAGES POLICIES
-- Users can view messages in their connections
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.id = connection_id
    AND c.status = 'accepted'
    AND (
      c.requester_id = public.get_profile_id(auth.uid())
      OR c.receiver_id = public.get_profile_id(auth.uid())
    )
  )
);

-- Users can send messages in their accepted connections
CREATE POLICY "Users can send messages to connections"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = public.get_profile_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.id = connection_id
    AND c.status = 'accepted'
    AND (
      c.requester_id = public.get_profile_id(auth.uid())
      OR c.receiver_id = public.get_profile_id(auth.uid())
    )
  )
);

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
TO authenticated
USING (
  sender_id != public.get_profile_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.id = connection_id
    AND (
      c.requester_id = public.get_profile_id(auth.uid())
      OR c.receiver_id = public.get_profile_id(auth.uid())
    )
  )
);

-- Create function to auto-update profile_completed field
CREATE OR REPLACE FUNCTION public.check_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completed := (
    NEW.photo_url IS NOT NULL AND NEW.photo_url != '' AND
    NEW.name IS NOT NULL AND NEW.name != '' AND
    NEW.age IS NOT NULL AND
    NEW.phone IS NOT NULL AND NEW.phone != '' AND
    NEW.email IS NOT NULL AND NEW.email != '' AND
    NEW.city IS NOT NULL AND NEW.city != '' AND
    NEW.country IS NOT NULL AND NEW.country != '' AND
    NEW.looking_for IS NOT NULL AND NEW.looking_for != '' AND
    NEW.about_me IS NOT NULL AND NEW.about_me != '' AND
    NEW.my_idea IS NOT NULL AND NEW.my_idea != '' AND
    array_length(NEW.interests, 1) > 0
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to check profile completion on insert/update
CREATE TRIGGER check_profile_completion_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_profile_completion();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
BEFORE UPDATE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_completed ON public.profiles(profile_completed);
CREATE INDEX idx_posts_profile_id ON public.posts(profile_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_connections_requester ON public.connections(requester_id);
CREATE INDEX idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX idx_connections_status ON public.connections(status);
CREATE INDEX idx_messages_connection_id ON public.messages(connection_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;