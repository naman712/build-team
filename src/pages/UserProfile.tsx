import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Briefcase, GraduationCap, Link as LinkIcon, 
  Lightbulb, Heart, ArrowLeft, UserPlus, MessageCircle,
  Mail, Phone
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { playSoundEffect } from '@/hooks/useSoundEffects';

type Profile = Tables<'profiles'>;
type Experience = Tables<'experiences'>;
type Education = Tables<'education'>;
type Post = Tables<'posts'>;

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile: myProfile } = useProfile();
  
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'connected'>('none');
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileData) {
        setViewedProfile(profileData);

        // Fetch experiences
        const { data: expData } = await supabase
          .from('experiences')
          .select('*')
          .eq('profile_id', id);
        setExperiences(expData || []);

        // Fetch education
        const { data: eduData } = await supabase
          .from('education')
          .select('*')
          .eq('profile_id', id);
        setEducation(eduData || []);

        // Fetch posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('profile_id', id)
          .order('created_at', { ascending: false });
        setPosts(postsData || []);

        // Check connection status
        if (myProfile) {
          const { data: connections } = await supabase
            .from('connections')
            .select('*')
            .or(`and(requester_id.eq.${myProfile.id},receiver_id.eq.${id}),and(requester_id.eq.${id},receiver_id.eq.${myProfile.id})`);

          if (connections && connections.length > 0) {
            const conn = connections[0];
            if (conn.status === 'accepted') {
              setConnectionStatus('connected');
            } else if (conn.status === 'pending') {
              setConnectionStatus(conn.requester_id === myProfile.id ? 'pending_sent' : 'pending_received');
            }
          }
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [id, myProfile]);

  const handleSendRequest = async () => {
    if (!myProfile || !viewedProfile) return;

    setSendingRequest(true);
    const { error } = await supabase
      .from('connections')
      .insert({
        requester_id: myProfile.id,
        receiver_id: viewedProfile.id,
      });

    if (error) {
      console.error('Error sending request:', error);
      toast.error('Failed to send connection request');
    } else {
      playSoundEffect('connectionRequest');
      toast.success('Connection request sent!');
      setConnectionStatus('pending_sent');
    }
    setSendingRequest(false);
  };

  const handleAcceptRequest = async () => {
    if (!myProfile || !viewedProfile) return;

    setSendingRequest(true);
    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('requester_id', viewedProfile.id)
      .eq('receiver_id', myProfile.id);

    if (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept connection request');
    } else {
      playSoundEffect('success');
      toast.success('Connection accepted!');
      setConnectionStatus('connected');
    }
    setSendingRequest(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!viewedProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground mb-4">Profile not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const isOwnProfile = myProfile?.id === viewedProfile.id;
  const showContactInfo = connectionStatus === 'connected' || isOwnProfile;

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
          >
            <div className="h-32 bg-gradient-primary" />
            
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
                <Avatar className="w-32 h-32 ring-4 ring-card">
                  <AvatarImage src={viewedProfile.photo_url || undefined} alt={viewedProfile.name || ''} />
                  <AvatarFallback className="text-3xl">{viewedProfile.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold">{viewedProfile.name}, {viewedProfile.age}</h1>
                  <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                    <MapPin className="w-4 h-4" />
                    {viewedProfile.city}, {viewedProfile.country}
                  </p>
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-2">
                    {connectionStatus === 'none' && (
                      <Button onClick={handleSendRequest} disabled={sendingRequest}>
                        {sendingRequest ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        Connect
                      </Button>
                    )}
                    {connectionStatus === 'pending_sent' && (
                      <Button disabled variant="outline">Request Sent</Button>
                    )}
                    {connectionStatus === 'pending_received' && (
                      <Button onClick={handleAcceptRequest} disabled={sendingRequest}>
                        Accept Request
                      </Button>
                    )}
                    {connectionStatus === 'connected' && (
                      <Button variant="outline" onClick={() => navigate('/messages')}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Contact Info - Only if connected */}
          {showContactInfo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{viewedProfile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{viewedProfile.phone}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-4 mt-4">
              {/* Looking For */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Looking For
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="bg-primary/10 text-primary px-4 py-2">
                    {viewedProfile.looking_for}
                  </Badge>
                </CardContent>
              </Card>

              {/* About Me */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">About Me</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{viewedProfile.about_me}</p>
                </CardContent>
              </Card>

              {/* My Idea */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-accent" />
                    My Idea
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{viewedProfile.my_idea}</p>
                </CardContent>
              </Card>

              {/* Interests */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {viewedProfile.interests?.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Experience */}
              {experiences.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{exp.role}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {education.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {education.map((edu) => (
                      <div key={edu.id} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{edu.degree}</h4>
                          <p className="text-sm text-muted-foreground">{edu.school} • {edu.year}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Links */}
              {viewedProfile.links && viewedProfile.links.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LinkIcon className="w-5 h-5" />
                      Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {viewedProfile.links.map((link, index) => (
                        <a
                          key={index}
                          href={link.startsWith('http') ? link : `https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <LinkIcon className="w-4 h-4" />
                          {link}
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-4 mt-4">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No posts yet
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <p className="text-foreground">{post.content}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        {new Date(post.created_at!).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
