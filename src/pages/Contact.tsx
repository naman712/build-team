import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import logo from "@/assets/logo.png";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="FounderNow" className="w-10 h-10 rounded-xl object-contain" />
            <span className="font-bold text-xl text-foreground">FounderNow</span>
          </Link>
          
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-card">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Contact Us</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Have questions or need help? We're here for you.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center p-8 bg-secondary/50 rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                  <a 
                    href="mailto:naman@foundernow.in"
                    className="text-primary hover:underline text-lg font-medium"
                  >
                    naman@foundernow.in
                  </a>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    We typically respond within 24 hours
                  </p>
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={() => window.location.href = "mailto:naman@foundernow.in"}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Send us an Email
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
