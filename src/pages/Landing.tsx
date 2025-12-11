import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Users, MessageCircle, Lightbulb, Rocket, Zap, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const features = [
  {
    icon: Zap,
    title: "Smart Matching",
    description: "AI-powered algorithm finds co-founders who complement your skills.",
    number: "01",
  },
  {
    icon: Lightbulb,
    title: "Idea Sharing",
    description: "Share startup ideas and get feedback from entrepreneurs.",
    number: "02",
  },
  {
    icon: MessageCircle,
    title: "Direct Chat",
    description: "Connect instantly with matches and build relationships.",
    number: "03",
  },
  {
    icon: Rocket,
    title: "Startup Feed",
    description: "Stay updated with the latest from the founder community.",
    number: "04",
  },
];

const stats = [
  { value: "10K+", label: "Founders" },
  { value: "2.5K", label: "Matches Made" },
  { value: "500+", label: "Startups Born" },
];

export default function Landing() {
  const { user } = useAuth();
  const authLink = user ? "/discover" : "/auth";

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Geometric background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 right-[15%] w-40 h-40 border-2 border-border rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 left-[10%] w-24 h-24 border border-accent/30"
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img src={logo} alt="FounderNow" className="w-10 h-10 rounded-lg object-contain" />
              <div className="absolute -inset-1 bg-accent/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display font-bold text-xl text-foreground tracking-tight">FounderNow</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="font-medium" asChild>
              <Link to={authLink}>{user ? "Dashboard" : "Login"}</Link>
            </Button>
            <Button className="brutal-border bg-primary text-primary-foreground hover:bg-primary/90 shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_hsl(var(--foreground))] transition-all" asChild>
              <Link to={authLink}>
                {user ? "Start Matching" : "Get Started"}
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left column - Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-full mb-8"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">Co-Founder Matching Platform</span>
              </motion.div>
              
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-8">
                Find Your
                <br />
                <span className="text-stroke">Perfect</span>
                <br />
                <span className="text-gradient">Co-Founder</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
                Connect with ambitious founders, share ideas, and build the next big thing together. Your startup journey starts here.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button size="lg" className="brutal-border bg-foreground text-background hover:bg-foreground/90 shadow-brutal hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[8px_8px_0px_hsl(var(--accent))] transition-all text-base px-8" asChild>
                  <Link to={authLink}>
                    Start Matching
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" className="group" asChild>
                  <Link to="/contact">
                    Learn more
                    <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 mt-16 pt-8 border-t border-border">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right column - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Main card stack */}
              <div className="relative w-full max-w-md mx-auto">
                {/* Background decorative cards */}
                <motion.div
                  animate={{ rotate: [12, 14, 12] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 brutal-border bg-accent/20 rounded-2xl transform rotate-12"
                />
                <motion.div
                  animate={{ rotate: [6, 4, 6] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 brutal-border bg-secondary rounded-2xl transform rotate-6"
                />
                
                {/* Main profile card */}
                <div className="relative brutal-border bg-card rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] relative">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1200&fit=crop"
                      alt="Founder profile"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/20 to-transparent" />
                    
                    {/* Profile info */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full">
                          LOOKING FOR: TECH CO-FOUNDER
                        </span>
                      </div>
                      <h3 className="font-display text-3xl font-bold text-background">Sarah Chen</h3>
                      <p className="text-background/70 flex items-center gap-1 mt-1">
                        <Globe className="w-4 h-4" />
                        San Francisco, USA
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-8 top-20 brutal-border bg-card p-4 rounded-xl"
                >
                  <Users className="w-6 h-6 text-accent" />
                </motion.div>
                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-8 bottom-32 brutal-border bg-accent p-3 rounded-xl"
                >
                  <Zap className="w-5 h-5 text-accent-foreground" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-8 bg-foreground overflow-hidden">
        <div className="flex whitespace-nowrap">
          <div className="marquee flex items-center gap-8 px-4">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex items-center gap-8">
                {["CONNECT", "BUILD", "GROW", "INNOVATE", "MATCH", "CREATE"].map((word, index) => (
                  <span key={`${setIndex}-${index}`} className="font-display text-2xl font-bold text-background flex items-center gap-8">
                    {word}
                    <span className="w-2 h-2 bg-accent rounded-full" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-warm pattern-dots">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-sm font-bold text-accent tracking-widest uppercase mb-4">Features</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold max-w-2xl leading-tight">
              Everything you need to find your co-founder
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="brutal-card p-8 rounded-2xl group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 brutal-border bg-accent flex items-center justify-center rounded-xl">
                    <feature.icon className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <span className="font-display text-5xl font-bold text-muted-foreground/20 group-hover:text-accent/30 transition-colors">
                    {feature.number}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-10" />
        
        <div className="container mx-auto max-w-7xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-sm font-bold text-accent tracking-widest uppercase mb-4">How It Works</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Three simple steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Profile", desc: "Share your skills, experience, and startup vision" },
              { step: "02", title: "Discover & Match", desc: "Browse curated founder profiles and connect" },
              { step: "03", title: "Build Together", desc: "Chat, collaborate, and launch your startup" },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative group"
              >
                <div className="text-8xl font-display font-extrabold text-accent/20 group-hover:text-accent/40 transition-colors">
                  {item.step}
                </div>
                <div className="mt-[-2rem] relative z-10">
                  <h3 className="font-display text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-background/70 leading-relaxed">{item.desc}</p>
                </div>
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 text-accent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6" aria-labelledby="faq-heading">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-bold text-accent tracking-widest uppercase mb-4">FAQ</p>
            <h2 id="faq-heading" className="font-display text-4xl md:text-5xl font-bold">
              Common questions
            </h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "What is FounderNow?",
                a: "FounderNow is India's leading co-founder matching platform that helps entrepreneurs, founders, and builders discover compatible co-founders and startup collaborators through smart matching algorithms."
              },
              {
                q: "How does FounderNow work?",
                a: "Create your profile sharing your skills and startup ideas, browse through curated founder profiles, and connect with potential co-founders through our direct messaging system."
              },
              {
                q: "Is FounderNow free to use?",
                a: "Yes, FounderNow is completely free to use. You can create a profile, browse potential co-founders, and connect with matches at no cost."
              },
              {
                q: "Who can use FounderNow?",
                a: "FounderNow is designed for entrepreneurs, startup founders, technical experts, business professionals, and student innovators looking to find co-founders or join exciting startup ventures."
              }
            ].map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="brutal-card rounded-xl group"
              >
                <summary className="p-6 text-lg font-display font-semibold cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="w-8 h-8 brutal-border bg-secondary rounded-lg flex items-center justify-center group-open:rotate-45 transition-transform">
                    <span className="text-xl">+</span>
                  </span>
                </summary>
                <p className="px-6 pb-6 text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="brutal-border bg-foreground text-background rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 pattern-dots opacity-10" />
            
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-8 -right-8 w-24 h-24 border-2 border-accent/30 rounded-full"
              />
              
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Ready to find your
                <br />
                <span className="text-accent">co-founder?</span>
              </h2>
              <p className="text-xl text-background/70 mb-10 max-w-xl mx-auto">
                Join thousands of founders building the future together
              </p>
              <Button
                size="lg"
                className="brutal-border bg-accent text-accent-foreground hover:bg-accent/90 shadow-[4px_4px_0px_hsl(var(--background))] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_hsl(var(--background))] transition-all text-lg px-10"
                asChild
              >
                <Link to={authLink}>
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t-2 border-border">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="FounderNow" className="w-10 h-10 rounded-lg object-contain" />
              <span className="font-display font-bold text-lg text-foreground">FounderNow</span>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                Contact Us
              </Link>
              <p className="text-sm text-muted-foreground">
                © 2024 FounderNow. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}