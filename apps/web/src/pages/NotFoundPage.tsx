import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Construction } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // If they tried to access the coding page, show a specific V2 message
  const isCodingPage = location.pathname.includes("/coding");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] p-4 relative overflow-hidden">
      <div className="z-10 flex flex-col items-center max-w-md text-center space-y-8">
        <div className="relative">
          <h1 className="text-[120px] font-bold leading-none text-[var(--text-primary)] select-none">
            {isCodingPage ? "V2" : "404"}
          </h1>
          {isCodingPage && (
            <div className="absolute -top-4 right-3 animate-bounce">
              <span className="bg-[var(--action-primary)] text-[var(--on-primary)] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {isCodingPage 
              ? "Coding Practice is Under Construction" 
              : "Oops! Page not found"}
          </h2>
          <p className="text-[var(--text-secondary)] text-lg">
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
            className="border-[var(--border-control)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button 
            size="lg" 
            asChild
            className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] shadow-sm"
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
