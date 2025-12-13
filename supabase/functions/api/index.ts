import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_VERSION = "v1";
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window

// In-memory rate limiting (use Redis for production clusters)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Expose-Headers": "x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset, x-api-version",
};

// Rate limiting check
function checkRateLimit(clientId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetAt: record.resetAt };
}

// Standard API response helper
function apiResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify({
    success: status >= 200 && status < 300,
    data,
    meta: {
      version: API_VERSION,
      timestamp: new Date().toISOString(),
    }
  }), {
    status,
    headers: { 
      ...corsHeaders, 
      "Content-Type": "application/json",
      "X-API-Version": API_VERSION,
      "Cache-Control": "no-cache",
      ...extraHeaders 
    },
  });
}

function errorResponse(message: string, code: string, status = 400) {
  return new Response(JSON.stringify({
    success: false,
    error: { code, message },
    meta: { version: API_VERSION, timestamp: new Date().toISOString() }
  }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "X-API-Version": API_VERSION },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/api", "").replace(`/${API_VERSION}`, "");
    const authHeader = req.headers.get("Authorization");
    
    // Extract client identifier for rate limiting
    const clientId = authHeader || req.headers.get("x-forwarded-for") || "anonymous";
    
    // Check rate limit
    const rateLimit = checkRateLimit(clientId);
    const rateLimitHeaders = {
      "X-RateLimit-Limit": RATE_LIMIT_MAX.toString(),
      "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(rateLimit.resetAt / 1000).toString(),
    };

    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests" }
      }), {
        status: 429,
        headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" },
      });
    }

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
        return errorResponse("Invalid or expired token", "UNAUTHORIZED", 401);
      }
      userId = user?.id || null;
    }

    // Route handling with caching headers
    const { response, cacheControl } = await handleRoute(supabase, req.method, path, userId, req);
    
    return apiResponse(response, 200, { 
      ...rateLimitHeaders,
      ...(cacheControl ? { "Cache-Control": cacheControl } : {})
    });
  } catch (error: unknown) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Return appropriate error codes based on error type
    if (errorMessage.includes("not found")) {
      return errorResponse(errorMessage, "NOT_FOUND", 404);
    }
    if (errorMessage.includes("Authentication required")) {
      return errorResponse(errorMessage, "UNAUTHORIZED", 401);
    }
    if (errorMessage.includes("Permission denied")) {
      return errorResponse(errorMessage, "FORBIDDEN", 403);
    }
    
    return errorResponse(errorMessage, "INTERNAL_ERROR", 500);
  }
});

interface RouteResponse {
  response: any;
  cacheControl?: string;
}

// OpenAPI specification
const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "FounderNow API",
    description: "REST API for FounderNow - Co-founder matching platform",
    version: "1.0.0",
    contact: { email: "naman@foundernow.in" }
  },
  servers: [{ url: "https://ttkvpfwoivjpvwmvegig.supabase.co/functions/v1/api", description: "Production" }],
  externalDocs: { description: "Full OpenAPI Spec", url: "https://ttkvpfwoivjpvwmvegig.supabase.co/functions/v1/api/openapi.json" }
};

async function handleRoute(
  supabase: any,
  method: string,
  path: string,
  userId: string | null,
  req: Request
): Promise<RouteResponse> {
  // Health check endpoint (public, cacheable)
  if (path === "/health" || path === "/") {
    return { 
      response: { status: "ok", version: API_VERSION, timestamp: new Date().toISOString() },
      cacheControl: "public, max-age=60"
    };
  }

  // API Documentation endpoints (public)
  if (path === "/docs" && method === "GET") {
    return { 
      response: {
        title: "FounderNow API Documentation",
        version: API_VERSION,
        baseUrl: "https://ttkvpfwoivjpvwmvegig.supabase.co/functions/v1/api",
        openApiSpec: "https://ttkvpfwoivjpvwmvegig.supabase.co/functions/v1/api/openapi.json",
        endpoints: {
          health: { method: "GET", path: "/health", auth: false },
          docs: { method: "GET", path: "/docs", auth: false },
          webhooks: { method: "POST", path: "/webhooks", auth: false },
          profile: [
            { method: "GET", path: "/profile", auth: true, description: "Get current user profile" },
            { method: "PUT", path: "/profile", auth: true, description: "Update profile" },
            { method: "GET", path: "/profile/:id", auth: true, description: "Get profile by ID" }
          ],
          posts: [
            { method: "GET", path: "/posts", auth: true, description: "Get feed with pagination" },
            { method: "POST", path: "/posts", auth: true, description: "Create post" },
            { method: "GET", path: "/posts/:id", auth: true, description: "Get post by ID" },
            { method: "POST", path: "/posts/:id/like", auth: true, description: "Toggle like" },
            { method: "GET", path: "/posts/:id/comments", auth: true, description: "Get comments" },
            { method: "POST", path: "/posts/:id/comments", auth: true, description: "Add comment" }
          ],
          connections: [
            { method: "GET", path: "/connections", auth: true, description: "Get all connections" },
            { method: "POST", path: "/connections", auth: true, description: "Send request" },
            { method: "PUT", path: "/connections/:id", auth: true, description: "Accept/reject" },
            { method: "DELETE", path: "/connections/:id", auth: true, description: "Withdraw/delete" }
          ],
          discover: [
            { method: "GET", path: "/discover", auth: true, description: "Get profiles to match" }
          ],
          messages: [
            { method: "GET", path: "/messages/:connectionId", auth: true, description: "Get messages" },
            { method: "POST", path: "/messages", auth: true, description: "Send message" }
          ],
          notifications: [
            { method: "GET", path: "/notifications", auth: true, description: "Get notifications" }
          ],
          streak: [
            { method: "POST", path: "/streak", auth: true, description: "Update streak" }
          ]
        },
        authentication: {
          type: "Bearer Token",
          header: "Authorization: Bearer <jwt_token>",
          description: "Get JWT token from Supabase Auth login"
        },
        rateLimiting: {
          limit: 100,
          window: "1 minute",
          headers: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]
        },
        pagination: {
          type: "cursor-based",
          params: { limit: "number (default: 20, max: 50)", cursor: "ISO timestamp" },
          response: { hasMore: "boolean", nextCursor: "string|null" }
        }
      },
      cacheControl: "public, max-age=3600"
    };
  }

  // OpenAPI JSON spec endpoint (public)
  if (path === "/openapi.json" && method === "GET") {
    return { 
      response: openApiSpec,
      cacheControl: "public, max-age=3600"
    };
  }

  // Webhook endpoint (public, for external integrations)
  if (path === "/webhooks" && method === "POST") {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));
    return { response: { received: true } };
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
  const url = new URL(req.url);

  // Profile routes
  if (path === "/profile" && method === "GET") {
    return { response: await getProfile(supabase, profileId), cacheControl: "private, max-age=30" };
  }
  if (path === "/profile" && method === "PUT") {
    const body = await req.json();
    return { response: await updateProfile(supabase, profileId, body) };
  }
  if (path.match(/^\/profile\/[a-f0-9-]+$/) && method === "GET") {
    const targetProfileId = path.replace("/profile/", "");
    return { response: await getProfileById(supabase, targetProfileId), cacheControl: "public, max-age=60" };
  }

  // Feed routes with pagination
  if (path === "/posts" && method === "GET") {
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const cursor = url.searchParams.get("cursor");
    return { response: await getPosts(supabase, limit, cursor), cacheControl: "private, max-age=15" };
  }
  if (path === "/posts" && method === "POST") {
    const body = await req.json();
    return { response: await createPost(supabase, profileId, body) };
  }
  if (path.match(/^\/posts\/[a-f0-9-]+$/) && method === "GET") {
    const postId = path.replace("/posts/", "");
    return { response: await getPostById(supabase, postId), cacheControl: "public, max-age=30" };
  }
  if (path.match(/^\/posts\/[a-f0-9-]+\/like$/) && method === "POST") {
    const postId = path.replace("/posts/", "").replace("/like", "");
    return { response: await toggleLike(supabase, profileId, postId) };
  }
  if (path.match(/^\/posts\/[a-f0-9-]+\/comments$/) && method === "GET") {
    const postId = path.replace("/posts/", "").replace("/comments", "");
    return { response: await getComments(supabase, postId), cacheControl: "private, max-age=15" };
  }
  if (path.match(/^\/posts\/[a-f0-9-]+\/comments$/) && method === "POST") {
    const postId = path.replace("/posts/", "").replace("/comments", "");
    const body = await req.json();
    return { response: await addComment(supabase, profileId, postId, body) };
  }

  // Connections routes
  if (path === "/connections" && method === "GET") {
    return { response: await getConnections(supabase, profileId) };
  }
  if (path === "/connections" && method === "POST") {
    const body = await req.json();
    return { response: await createConnection(supabase, profileId, body.receiverId) };
  }
  if (path.match(/^\/connections\/[a-f0-9-]+$/) && method === "PUT") {
    const connectionId = path.replace("/connections/", "");
    const body = await req.json();
    return { response: await updateConnection(supabase, profileId, connectionId, body.status) };
  }
  if (path.match(/^\/connections\/[a-f0-9-]+$/) && method === "DELETE") {
    const connectionId = path.replace("/connections/", "");
    return { response: await deleteConnection(supabase, profileId, connectionId) };
  }

  // Discover/Match routes
  if (path === "/discover" && method === "GET") {
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 30);
    return { response: await getDiscoverProfiles(supabase, profileId, limit) };
  }

  // Messages routes
  if (path.match(/^\/messages\/[a-f0-9-]+$/) && method === "GET") {
    const connectionId = path.replace("/messages/", "");
    const cursor = url.searchParams.get("cursor");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    return { response: await getMessages(supabase, connectionId, limit, cursor) };
  }
  if (path === "/messages" && method === "POST") {
    const body = await req.json();
    return { response: await sendMessage(supabase, profileId, body) };
  }

  // Notifications route
  if (path === "/notifications" && method === "GET") {
    return { response: await getNotifications(supabase, profileId) };
  }

  // Streak route
  if (path === "/streak" && method === "POST") {
    return { response: await updateStreak(supabase, profileId) };
  }

  throw new Error(`Route not found: ${method} ${path}`);
}

// Profile handlers
async function getProfile(supabase: any, profileId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`*, experiences(*), education(*)`)
    .eq("id", profileId)
    .single();

  if (error) throw error;
  return { profile: data };
}

async function getProfileById(supabase: any, profileId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, name, photo_url, startup_name, city, country, looking_for, about_me, my_idea, 
      interests, links, intro_video_url, current_streak, longest_streak, profile_completed,
      experiences(*), education(*)
    `)
    .eq("id", profileId)
    .single();

  if (error) throw error;
  return { profile: data };
}

async function updateProfile(supabase: any, profileId: string, updates: any) {
  // Remove sensitive fields that shouldn't be updated via API
  const { email, phone, user_id, referral_code, successful_referrals, ...safeUpdates } = updates;
  
  const { data, error } = await supabase
    .from("profiles")
    .update(safeUpdates)
    .eq("id", profileId)
    .select()
    .single();

  if (error) throw error;
  return { profile: data };
}

// Posts handlers with cursor-based pagination
async function getPosts(supabase: any, limit: number, cursor: string | null) {
  let query = supabase
    .from("posts")
    .select(`
      *,
      profiles:profile_id(id, name, photo_url, startup_name),
      post_likes(id, profile_id),
      post_comments(id)
    `)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = data.length > limit;
  const posts = hasMore ? data.slice(0, -1) : data;
  const nextCursor = hasMore ? posts[posts.length - 1]?.created_at : null;

  return { 
    posts, 
    pagination: { limit, hasMore, nextCursor } 
  };
}

async function getPostById(supabase: any, postId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:profile_id(id, name, photo_url, startup_name),
      post_likes(id, profile_id),
      post_comments(id, content, created_at, profile_id, profiles:profile_id(id, name, photo_url))
    `)
    .eq("id", postId)
    .single();

  if (error) throw error;
  return { post: data };
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

async function toggleLike(supabase: any, profileId: string, postId: string) {
  // Check if already liked
  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("profile_id", profileId)
    .eq("post_id", postId)
    .single();

  if (existing) {
    await supabase.from("post_likes").delete().eq("id", existing.id);
    return { liked: false };
  } else {
    await supabase.from("post_likes").insert({ profile_id: profileId, post_id: postId });
    return { liked: true };
  }
}

async function getComments(supabase: any, postId: string) {
  const { data, error } = await supabase
    .from("post_comments")
    .select(`*, profiles:profile_id(id, name, photo_url)`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return { comments: data };
}

async function addComment(supabase: any, profileId: string, postId: string, body: any) {
  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      profile_id: profileId,
      post_id: postId,
      content: body.content,
      parent_comment_id: body.parentCommentId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return { comment: data };
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
    .insert({ requester_id: profileId, receiver_id: receiverId, status: "pending" })
    .select()
    .single();

  if (error) throw error;
  return { connection: data };
}

async function updateConnection(supabase: any, profileId: string, connectionId: string, status: string) {
  const { data, error } = await supabase
    .from("connections")
    .update({ status })
    .eq("id", connectionId)
    .eq("receiver_id", profileId)
    .select()
    .single();

  if (error) throw error;
  return { connection: data };
}

async function deleteConnection(supabase: any, profileId: string, connectionId: string) {
  const { error } = await supabase
    .from("connections")
    .delete()
    .eq("id", connectionId)
    .or(`requester_id.eq.${profileId},receiver_id.eq.${profileId}`);

  if (error) throw error;
  return { deleted: true };
}

// Discover handlers
async function getDiscoverProfiles(supabase: any, profileId: string, limit: number) {
  const { data: connections } = await supabase
    .from("connections")
    .select("requester_id, receiver_id")
    .or(`requester_id.eq.${profileId},receiver_id.eq.${profileId}`);

  const connectedIds = connections?.flatMap((c: any) => [c.requester_id, c.receiver_id]) || [];
  connectedIds.push(profileId);

  const { data, error } = await supabase
    .from("profiles")
    .select(`*, experiences(*), education(*)`)
    .eq("profile_completed", true)
    .not("id", "in", `(${connectedIds.join(",")})`)
    .limit(limit);

  if (error) throw error;
  return { profiles: data };
}

// Messages handlers with cursor pagination
async function getMessages(supabase: any, connectionId: string, limit: number, cursor: string | null) {
  let query = supabase
    .from("messages")
    .select(`*, sender:sender_id(id, name, photo_url)`)
    .eq("connection_id", connectionId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = data.length > limit;
  const messages = hasMore ? data.slice(0, -1) : data;
  messages.reverse(); // Return in chronological order

  return { 
    messages, 
    pagination: { limit, hasMore, nextCursor: hasMore ? messages[0]?.created_at : null } 
  };
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

// Notifications handler
async function getNotifications(supabase: any, profileId: string) {
  // Get pending connection requests
  const { data: connections } = await supabase
    .from("connections")
    .select(`*, requester:requester_id(id, name, photo_url)`)
    .eq("receiver_id", profileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  // Get recent likes on user's posts
  const { data: likes } = await supabase
    .from("post_likes")
    .select(`
      *, 
      profiles:profile_id(id, name, photo_url),
      posts!inner(id, profile_id, content)
    `)
    .eq("posts.profile_id", profileId)
    .neq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get recent comments on user's posts
  const { data: comments } = await supabase
    .from("post_comments")
    .select(`
      *, 
      profiles:profile_id(id, name, photo_url),
      posts!inner(id, profile_id, content)
    `)
    .eq("posts.profile_id", profileId)
    .neq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(20);

  return { connections: connections || [], likes: likes || [], comments: comments || [] };
}

// Streak handler
async function updateStreak(supabase: any, profileId: string) {
  const { data, error } = await supabase.rpc("update_user_streak", { profile_uuid: profileId });
  if (error) throw error;
  return { currentStreak: data };
}
