import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/api", "");
    const authHeader = req.headers.get("Authorization");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // For authenticated routes, verify the JWT
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error) {
        return new Response(
          JSON.stringify({ error: "Unauthorized", message: error.message }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = user?.id || null;
    }

    // Route handling
    const response = await handleRoute(supabase, req.method, path, userId, req);
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleRoute(
  supabase: any,
  method: string,
  path: string,
  userId: string | null,
  req: Request
) {
  // Health check endpoint
  if (path === "/health" || path === "/") {
    return { status: "ok", version: "1.0.0", timestamp: new Date().toISOString() };
  }

  // Require authentication for all other routes
  if (!userId) {
    throw new Error("Authentication required");
  }

  // Get profile ID for the user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    throw new Error("Profile not found");
  }

  const profileId = profile.id;

  // Profile routes
  if (path === "/profile" && method === "GET") {
    return getProfile(supabase, profileId);
  }
  if (path === "/profile" && method === "PUT") {
    const body = await req.json();
    return updateProfile(supabase, profileId, body);
  }

  // Feed routes
  if (path === "/posts" && method === "GET") {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    return getPosts(supabase, limit, offset);
  }
  if (path === "/posts" && method === "POST") {
    const body = await req.json();
    return createPost(supabase, profileId, body);
  }

  // Connections routes
  if (path === "/connections" && method === "GET") {
    return getConnections(supabase, profileId);
  }
  if (path === "/connections" && method === "POST") {
    const body = await req.json();
    return createConnection(supabase, profileId, body.receiverId);
  }

  // Discover/Match routes
  if (path === "/discover" && method === "GET") {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    return getDiscoverProfiles(supabase, profileId, limit);
  }

  // Messages routes
  if (path.startsWith("/messages/") && method === "GET") {
    const connectionId = path.replace("/messages/", "");
    return getMessages(supabase, connectionId);
  }
  if (path === "/messages" && method === "POST") {
    const body = await req.json();
    return sendMessage(supabase, profileId, body);
  }

  throw new Error(`Route not found: ${method} ${path}`);
}

// Profile handlers
async function getProfile(supabase: any, profileId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      experiences(*),
      education(*)
    `)
    .eq("id", profileId)
    .single();

  if (error) throw error;
  return { profile: data };
}

async function updateProfile(supabase: any, profileId: string, updates: any) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", profileId)
    .select()
    .single();

  if (error) throw error;
  return { profile: data };
}

// Posts handlers
async function getPosts(supabase: any, limit: number, offset: number) {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:profile_id(id, name, photo_url, startup_name),
      post_likes(id, profile_id),
      post_comments(id)
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { posts: data, pagination: { limit, offset, hasMore: data.length === limit } };
}

async function createPost(supabase: any, profileId: string, body: any) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      profile_id: profileId,
      content: body.content,
      image_url: body.imageUrl,
      tags: body.tags || [],
    })
    .select()
    .single();

  if (error) throw error;
  return { post: data };
}

// Connections handlers
async function getConnections(supabase: any, profileId: string) {
  const { data, error } = await supabase
    .from("connections")
    .select(`
      *,
      requester:requester_id(id, name, photo_url, startup_name, looking_for),
      receiver:receiver_id(id, name, photo_url, startup_name, looking_for)
    `)
    .or(`requester_id.eq.${profileId},receiver_id.eq.${profileId}`);

  if (error) throw error;
  
  return {
    pending: data.filter((c: any) => c.status === "pending" && c.receiver_id === profileId),
    sent: data.filter((c: any) => c.status === "pending" && c.requester_id === profileId),
    accepted: data.filter((c: any) => c.status === "accepted"),
  };
}

async function createConnection(supabase: any, profileId: string, receiverId: string) {
  const { data, error } = await supabase
    .from("connections")
    .insert({
      requester_id: profileId,
      receiver_id: receiverId,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return { connection: data };
}

// Discover handlers
async function getDiscoverProfiles(supabase: any, profileId: string, limit: number) {
  // Get existing connections
  const { data: connections } = await supabase
    .from("connections")
    .select("requester_id, receiver_id")
    .or(`requester_id.eq.${profileId},receiver_id.eq.${profileId}`);

  const connectedIds = connections?.flatMap((c: any) => 
    [c.requester_id, c.receiver_id]
  ) || [];
  connectedIds.push(profileId);

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      experiences(*),
      education(*)
    `)
    .eq("profile_completed", true)
    .not("id", "in", `(${connectedIds.join(",")})`)
    .limit(limit);

  if (error) throw error;
  return { profiles: data };
}

// Messages handlers
async function getMessages(supabase: any, connectionId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:sender_id(id, name, photo_url)
    `)
    .eq("connection_id", connectionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return { messages: data };
}

async function sendMessage(supabase: any, profileId: string, body: any) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      connection_id: body.connectionId,
      sender_id: profileId,
      content: body.content,
      attachment_url: body.attachmentUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return { message: data };
}
