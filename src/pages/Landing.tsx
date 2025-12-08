import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Users, MessageCircle, Lightbulb, Rocket, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Users,
    title: "Smart Matching",
    description: "Our algorithm finds co-founders who complement your skills and share your vision.",
  },
  {
    icon: Lightbulb,
    title: "Idea Sharing",
    description: "Share your startup ideas and get feedback from fellow entrepreneurs.",
  },
  {
    icon: MessageCircle,
    title: "Direct Chat",
    description: "Connect instantly with matches and start building relationships.",
  },
  {
    icon: Rocket,
    title: "Startup Feed",
    description: "Stay updated with the latest from the founder community.",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CEO @ TechFlow",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    quote: "Found my technical co-founder in just 2 weeks. FounderHive changed everything.",
  },
  {
    name: "Marcus Johnson",
    role: "CTO @ DataSync",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    quote: "The quality of founders here is incredible. No noise, just serious builders.",
  },
  {
    name: "Priya Sharma",
    role: "Founder @ FinLeap",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    quote: "Finally, a platform that understands what founders actually need.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-hero overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">F</span>
            </div>
            <span className="font-bold text-xl text-foreground">FounderHive</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/feed">Login</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/discover">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
              <Star className="w-4 h-4 mr-2 text-primary" />
              #1 Co-Founder Matching Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Find Your Perfect
              <span className="text-gradient block">Co-Founder</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Connect with ambitious founders, share ideas, and build the next big thing together. 
              Swipe to discover your ideal startup partner.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/discover">
                  Start Matching
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/feed">Explore Feed</Link>
              </Button>
            </div>
          </motion.div>

          {/* Hero Cards Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="flex justify-center items-center">
              <div className="relative w-72 h-96 md:w-80 md:h-[450px]">
                {/* Background cards */}
                <div className="absolute inset-0 rounded-3xl bg-card shadow-card transform rotate-6 scale-90 opacity-50" />
                <div className="absolute inset-0 rounded-3xl bg-card shadow-card transform -rotate-3 scale-95 opacity-75" />
                
                {/* Main card */}
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-glow">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1200&fit=crop"
                    alt="Founder profile"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
                    <h3 className="text-2xl font-bold">Sarah, 28</h3>
                    <p className="text-primary-foreground/80">San Francisco, USA</p>
                    <Badge className="mt-2 bg-primary/90 border-0">
                      Looking for: Technical Co-founder
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-warm">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Find a Co-Founder</h2>
            <p className="text-xl text-muted-foreground">Built by founders, for founders</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-card border border-border/50 card-hover"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Three simple steps to find your co-founder</p>
          </motion.div>

          <div className="space-y-8">
            {[
              { step: "01", title: "Complete Your Profile", desc: "Share your skills, experience, and startup ideas" },
              { step: "02", title: "Swipe & Discover", desc: "Browse through curated founder profiles" },
              { step: "03", title: "Connect & Build", desc: "Match, chat, and start building together" },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-6"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0">
                  <span className="text-3xl font-bold text-primary-foreground">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-lg">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-warm">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Loved by Founders</h2>
            <p className="text-xl text-muted-foreground">Join thousands of entrepreneurs finding their perfect match</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-primary rounded-3xl p-12 text-center shadow-glow"
          >
            <h2 className="text-4xl font-bold text-primary-foreground mb-4">
              Ready to Find Your Co-Founder?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Join FounderHive today and start building your dream startup
            </p>
            <Button
              variant="secondary"
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link to="/discover">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">F</span>
              </div>
              <span className="font-semibold text-foreground">FounderHive</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 FounderHive. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
