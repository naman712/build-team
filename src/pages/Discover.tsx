import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { triggerHaptic } from "@/hooks/useHapticFeedback";

interface SearchResult {
  id: string;
  name: string;
  photo_url: string | null;
  city: string | null;
  country: string | null;
  looking_for: string | null;
}

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchProfiles = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      setShowResults(true);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, photo_url, city, country, looking_for")
          .eq("profile_completed", true)
          .ilike("name", `%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchProfiles, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const clearSearch = () => {
    triggerHaptic('light');
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleResultClick = (id: string) => {
    triggerHaptic('selection');
    navigate(`/user/${id}`);
    clearSearch();
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <Navbar />
      
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search profiles by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={clearSearch}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto">
              <CardContent className="p-2">
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No profiles found
                  </p>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={result.photo_url || ""} />
                          <AvatarFallback>{result.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {result.city && result.country 
                              ? `${result.city}, ${result.country}` 
                              : result.looking_for || "Founder"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Swipe Deck */}
        <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)]">
          <SwipeDeck />
        </div>
      </main>
    </div>
  );
}
