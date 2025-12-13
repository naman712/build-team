import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/api';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (requiresAuth) {
        const token = await this.getAuthToken();
        if (!token) {
          return { data: null, error: 'Not authenticated' };
        }
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.message || 'Request failed' };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; version: string }>('GET', '/health', undefined, false);
  }

  // Profile endpoints
  async getProfile() {
    return this.request<{ profile: any }>('GET', '/profile');
  }

  async updateProfile(updates: any) {
    return this.request<{ profile: any }>('PUT', '/profile', updates);
  }

  // Posts endpoints
  async getPosts(limit = 20, offset = 0) {
    return this.request<{ posts: any[]; pagination: any }>(
      'GET',
      `/posts?limit=${limit}&offset=${offset}`
    );
  }

  async createPost(content: string, imageUrl?: string, tags?: string[]) {
    return this.request<{ post: any }>('POST', '/posts', { content, imageUrl, tags });
  }

  // Connections endpoints
  async getConnections() {
    return this.request<{ pending: any[]; sent: any[]; accepted: any[] }>('GET', '/connections');
  }

  async createConnection(receiverId: string) {
    return this.request<{ connection: any }>('POST', '/connections', { receiverId });
  }

  // Discover endpoints
  async getDiscoverProfiles(limit = 10) {
    return this.request<{ profiles: any[] }>('GET', `/discover?limit=${limit}`);
  }

  // Messages endpoints
  async getMessages(connectionId: string) {
    return this.request<{ messages: any[] }>('GET', `/messages/${connectionId}`);
  }

  async sendMessage(connectionId: string, content: string, attachmentUrl?: string) {
    return this.request<{ message: any }>('POST', '/messages', {
      connectionId,
      content,
      attachmentUrl,
    });
  }
}

export const apiClient = new ApiClient();
