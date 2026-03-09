import { SECTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Branding */}
      <header className="p-6">
        <h1 className="text-2xl font-bold text-center md:text-left bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Masked Minds
        </h1>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center py-20 px-6 text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent animate-fade-in">
          Speak Freely. <br />
          <span className="text-primary">Stay Anonymous.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up">
          A safe, moderated space for youth to share perspectives on
          life, career, and relationships without fear of judgment.
        </p>
        <div className="flex justify-center gap-4 pt-4 animate-slide-up">
          <Link href="/auth/signup">
            <Button size="lg" className="rounded-full px-8">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="outline" size="lg" className="rounded-full px-8">
              Explore Topics
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
