import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard, PostData } from "@/components/feed/PostCard";

const initialPosts: PostData[] = [
  {
    id: "1",
    author: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      role: "Founder @ TechFlow",
    },
    content: "🚀 Just closed our pre-seed round! Looking for a technical co-founder who's passionate about AI and automation.\n\nWe're building the future of productivity tools. If you're a full-stack developer with ML experience, let's chat!",
    tags: ["hiring", "startup", "AI"],
    likes: 42,
    comments: 12,
    timestamp: "2h ago",
  },
  {
    id: "2",
    author: {
      name: "Marcus Johnson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      role: "CTO @ DataSync",
    },
    content: "What's the best way to validate a B2B SaaS idea before building?\n\nI've been cold emailing potential customers but the response rate is low. Any tips from fellow founders who've been through this?",
    tags: ["advice", "B2B", "validation"],
    likes: 89,
    comments: 34,
    timestamp: "4h ago",
  },
  {
    id: "3",
    author: {
      name: "Priya Sharma",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      role: "Product Lead @ FinLeap",
    },
    content: "Hot take: Most startups fail not because of the idea, but because founders don't find the right co-founder early enough.\n\nSkills matter, but alignment on values and work style matters more. What do you look for in a co-founder? 🤔",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop",
    tags: ["cofounder", "startups", "advice"],
    likes: 156,
    comments: 67,
    timestamp: "6h ago",
  },
  {
    id: "4",
    author: {
      name: "Alex Rivera",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      role: "Serial Entrepreneur",
    },
    content: "Just launched our MVP after 3 months of building! 🎉\n\nKey learnings:\n• Ship fast, iterate faster\n• Talk to users daily\n• Don't overthink the tech stack\n• Find a co-founder who complements your weaknesses\n\nWho else is launching this month?",
    tags: ["launch", "MVP", "startup"],
    likes: 234,
    comments: 45,
    timestamp: "8h ago",
  },
];

export default function Feed() {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);

  const handleNewPost = (content: string) => {
    const newPost: PostData = {
      id: Date.now().toString(),
      author: {
        name: "John Doe",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        role: "Aspiring Founder",
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
          
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}
