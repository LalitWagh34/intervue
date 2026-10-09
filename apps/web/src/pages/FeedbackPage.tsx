import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";

export default function FeedbackPage() {
  const { data: session } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Prepopulate from session if available
  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !name) setName(session.user.name);
      if (session.user.email && !email) setEmail(session.user.email);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!message.trim()) {
      toast.error("Please enter your message or feedback.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject || "General Feedback",
          message: message.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      toast.success("Feedback submitted successfully!", {
        description: "Thank you for helping us improve Intervue.",
      });

      setSubmitted(true);
      setMessage("");
    } catch (err: any) {
      console.error("Feedback error:", err);
      toast.error(err?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-2xl mx-auto space-y-8">
      {/* Page Title & Subtitle (Matching Screenshot 2) */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Feedback</h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
          We value your feedback and are here to assist you. Please use the form below to drop your
          reviews, suggestions, or to ask for support.
        </p>
      </div>

      {submitted ? (
        <div className="p-8 rounded-2xl bg-[#0D0E12] border border-zinc-800 text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Thank You for Your Feedback!</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Our engineering team reviews every suggestion and bug report directly.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setSubmitted(false)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-4 h-9 rounded-xl cursor-pointer"
          >
            Submit Another Response
          </Button>
        </div>
      ) : (
        /* Form (Matching Screenshot 2) */
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-xs font-medium text-zinc-300">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full h-11 px-4 rounded-xl bg-[#0D0E12] border border-[#1E2229] focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs sm:text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium text-zinc-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-11 px-4 rounded-xl bg-[#0D0E12] border border-[#1E2229] focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs sm:text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
            />
          </div>

          {/* Subject Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="subject" className="block text-xs font-medium text-zinc-300">
              Subject
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#0D0E12] border border-[#1E2229] focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs sm:text-sm text-white outline-none transition-colors cursor-pointer"
            >
              <option value="" disabled className="bg-[#0D0E12] text-zinc-500">
                Select subject
              </option>
              <option value="General Feedback" className="bg-[#0D0E12] text-white">
                General Feedback
              </option>
              <option value="Bug Report" className="bg-[#0D0E12] text-white">
                Bug Report
              </option>
              <option value="Feature Request" className="bg-[#0D0E12] text-white">
                Feature Request
              </option>
              <option value="Company Kit Question Request" className="bg-[#0D0E12] text-white">
                Company Kit Question Request
              </option>
              <option value="Account Support" className="bg-[#0D0E12] text-white">
                Account & Login Support
              </option>
            </select>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="message" className="block text-xs font-medium text-zinc-300">
              Message
            </label>
            <textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think or how we can help..."
              required
              className="w-full p-4 rounded-xl bg-[#0D0E12] border border-[#1E2229] focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs sm:text-sm text-white placeholder:text-zinc-600 outline-none transition-colors resize-y leading-relaxed"
            />
          </div>

          {/* Submit Button (Right Aligned matching Screenshot 2) */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold px-6 h-10 rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
