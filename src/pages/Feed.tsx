import { useState } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard, PostData } from "@/components/feed/PostCard";

export default function Feed() {
  const [posts, setPosts] = useState<PostData[]>([]);

  const handleNewPost = (content: string) => {
    const newPost: PostData = {
      id: Date.now().toString(),
      author: {
        name: "You",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        role: "Founder",
      },
      content,
      tags: [],
      likes: 0,
      comments: 0,
      timestamp: "Just now",
    };
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-xl mx-auto space-y-6">
          <CreatePost onPost={handleNewPost} />
          
          {posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your startup journey!
              </p>
            </motion.div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
