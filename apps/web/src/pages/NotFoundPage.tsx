import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Construction } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // If they tried to access the coding page, show a specific V2 message
  const isCodingPage = location.pathname.includes("/coding");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#060709] text-white p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center max-w-md text-center space-y-8">
        <div className="relative">
          <h1 className="text-[120px] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 select-none">
            {isCodingPage ? "V2" : "404"}
          </h1>
          {isCodingPage && (
            <div className="absolute -top-4 right-3 animate-bounce">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {isCodingPage 
              ? "Coding Practice is Under Construction" 
              : "Oops! Page not found"}
          </h2>
          <p className="text-zinc-400 text-lg">
            {isCodingPage 
              ? "We are building an ultra-fast, secure coding sandbox for V2. Stay tuned!"
              : "The page you are looking for doesn't exist or has been moved."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate(-1)}
            className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button 
            size="lg" 
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]"
          >
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
