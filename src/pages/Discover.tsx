import { Navbar } from "@/components/layout/Navbar";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";

export default function Discover() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-20">
      <Navbar />
      
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)]">
        <div className="max-w-md mx-auto h-full">
          <SwipeDeck />
        </div>
      </main>
    </div>
  );
}
