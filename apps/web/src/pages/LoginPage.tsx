import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam === "state_mismatch") {
      toast.error("Sign-in session expired. Please click below to try again.", {
        description: "Google verification state mismatched. Avoid double clicking the sign-in button.",
      });
    }
  }, [errorParam]);

  const handleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "http://localhost:5173/dashboard",
      });
    } catch (err: any) {
      console.error("Google sign in initiation failed:", err);
      setIsLoading(false);
      toast.error("Failed to initiate sign-in. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">I</span>
            </div>
            <span className="text-white font-bold text-xl font-sans">Intervue</span>
          </div>
          <CardTitle className="text-white text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            Sign in to continue your interview and coding practice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorParam === "state_mismatch" && (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Previous OAuth session expired or was interrupted. Click below once to start fresh.
              </span>
            </div>
          )}

          <Button
            className="w-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center gap-3 h-10 font-medium cursor-pointer"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{isLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </Button>
          <p className="text-center text-zinc-500 text-xs">
            No account needed — sign in with Google to get started
          </p>
        </CardContent>
      </Card>
    </div>
  );
}