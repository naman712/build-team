import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/api';
const API_VERSION = 'v1';

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: { version: string; timestamp: string };
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}

type RequestOptions = {
  cache?: RequestCache;
  retries?: number;
};

class ApiClient {
  private retryDelay = 1000;

  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    requiresAuth = true,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { cache = 'default', retries = 2 } = options;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Version': API_VERSION,
    };

    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          cache,
        });

        // Handle rate limiting with retry
        if (response.status === 429 && attempt < retries) {
          const resetTime = response.headers.get('X-RateLimit-Reset');
          const waitTime = resetTime ? Math.max(0, parseInt(resetTime) * 1000 - Date.now()) : this.retryDelay * (attempt + 1);
          await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 10000)));
          continue;
        }

        const data = await response.json();
        return data as ApiResponse<T>;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        }
      }
    }

    return { 
      success: false, 
      data: null, 
      error: { code: 'NETWORK_ERROR', message: lastError?.message || 'Network request failed' } 
    };
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; version: string }>('GET', '/health', undefined, false);
  }

  // Profile endpoints
  async getProfile() {
    return this.request<{ profile: any }>('GET', '/profile', undefined, true, { cache: 'no-store' });
  }

  async getProfileById(profileId: string) {
    return this.request<{ profile: any }>('GET', `/profile/${profileId}`);
  }

  async updateProfile(updates: any) {
    return this.request<{ profile: any }>('PUT', '/profile', updates);
  }

  // Posts endpoints with cursor pagination
  async getPosts(limit = 20, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.set('cursor', cursor);
    return this.request<{ posts: any[]; pagination: any }>('GET', `/posts?${params}`);
  }

  async getPostById(postId: string) {
    return this.request<{ post: any }>('GET', `/posts/${postId}`);
  }

  async createPost(content: string, imageUrl?: string, tags?: string[]) {
    return this.request<{ post: any }>('POST', '/posts', { content, imageUrl, tags });
  }

  async toggleLike(postId: string) {
    return this.request<{ liked: boolean }>('POST', `/posts/${postId}/like`);
  }

  async getComments(postId: string) {
    return this.request<{ comments: any[] }>('GET', `/posts/${postId}/comments`);
  }

  async addComment(postId: string, content: string, parentCommentId?: string) {
    return this.request<{ comment: any }>('POST', `/posts/${postId}/comments`, { content, parentCommentId });
  }

  // Connections endpoints
  async getConnections() {
    return this.request<{ pending: any[]; sent: any[]; accepted: any[] }>('GET', '/connections');
  }

  async createConnection(receiverId: string) {
    return this.request<{ connection: any }>('POST', '/connections', { receiverId });
  }

  async updateConnection(connectionId: string, status: 'accepted' | 'rejected') {
    return this.request<{ connection: any }>('PUT', `/connections/${connectionId}`, { status });
  }

  async deleteConnection(connectionId: string) {
    return this.request<{ deleted: boolean }>('DELETE', `/connections/${connectionId}`);
  }

  // Discover endpoints
  async getDiscoverProfiles(limit = 10) {
    return this.request<{ profiles: any[] }>('GET', `/discover?limit=${limit}`);
  }

  // Messages endpoints with cursor pagination
  async getMessages(connectionId: string, limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.set('cursor', cursor);
    return this.request<{ messages: any[]; pagination: any }>('GET', `/messages/${connectionId}?${params}`);
  }

  async sendMessage(connectionId: string, content: string, attachmentUrl?: string) {
    return this.request<{ message: any }>('POST', '/messages', { connectionId, content, attachmentUrl });
  }

  // Notifications
  async getNotifications() {
    return this.request<{ connections: any[]; likes: any[]; comments: any[] }>('GET', '/notifications');
  }

  // Streak
  async updateStreak() {
    return this.request<{ currentStreak: number }>('POST', '/streak');
  }
}

export const apiClient = new ApiClient();
