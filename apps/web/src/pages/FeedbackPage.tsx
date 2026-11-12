import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FeedbackPage() {
  const { data: session } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});
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

    const newErrors: { subject?: string; message?: string } = {};
    if (!subject.trim()) {
      newErrors.subject = "Please select a feedback subject.";
    }
    if (!message.trim()) {
      newErrors.message = "Please enter your message or feedback.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(newErrors.subject || newErrors.message);
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
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
      setSubject("");
      setErrors({});
    } catch (err: any) {
      console.error("Feedback error:", err);
      toast.error(err?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-2xl mx-auto space-y-8 text-[var(--text-primary)]">
      {/* Page Title & Subtitle */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Feedback</h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
          We value your feedback and are here to assist you. Please use the form below to drop your
          reviews, suggestions, or to ask for support.
        </p>
      </div>

      {submitted ? (
        <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] text-center space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-full bg-[var(--status-success-subtle)] border border-[var(--border-subtle)] text-[var(--status-success)] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Thank You for Your Feedback!</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Our engineering team reviews every suggestion and bug report directly.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setSubmitted(false)}
            className="bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-control)] text-xs px-4 h-9 rounded-xl cursor-pointer"
          >
            Submit Another Response
          </Button>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-xs font-medium text-[var(--text-secondary)]">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full h-11 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border-control)] focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)]/30 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium text-[var(--text-secondary)]">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-11 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border-control)] focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)]/30 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors"
            />
          </div>

          {/* Subject Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="subject" className="block text-xs font-medium text-[var(--text-secondary)]">
              Subject <span className="text-[var(--status-danger)]">*</span>
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
              }}
              className={cn(
                "w-full h-11 px-3.5 rounded-xl bg-[var(--surface)] border text-xs sm:text-sm text-[var(--text-primary)] outline-none transition-colors cursor-pointer",
                errors.subject
                  ? "border-[var(--status-danger)] focus:border-[var(--status-danger)] ring-1 ring-[var(--status-danger)]/30"
                  : "border-[var(--border-control)] focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)]/30"
              )}
            >
              <option value="" disabled className="bg-[var(--surface)] text-[var(--text-muted)]">
                Select subject
              </option>
              <option value="General Feedback" className="bg-[var(--surface)] text-[var(--text-primary)]">
                General Feedback
              </option>
              <option value="Bug Report" className="bg-[var(--surface)] text-[var(--text-primary)]">
                Bug Report
              </option>
              <option value="Feature Request" className="bg-[var(--surface)] text-[var(--text-primary)]">
                Feature Request
              </option>
              <option value="Company Kit Question Request" className="bg-[var(--surface)] text-[var(--text-primary)]">
                Company Kit Question Request
              </option>
              <option value="Account Support" className="bg-[var(--surface)] text-[var(--text-primary)]">
                Account & Login Support
              </option>
            </select>
            {errors.subject && (
              <p className="text-[11px] text-[var(--status-danger)] mt-1 font-medium">{errors.subject}</p>
            )}
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="message" className="block text-xs font-medium text-[var(--text-secondary)]">
              Message <span className="text-[var(--status-danger)]">*</span>
            </label>
            <textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
              }}
              placeholder="Tell us what you think or how we can help..."
              className={cn(
                "w-full p-4 rounded-xl bg-[var(--surface)] border text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors resize-y leading-relaxed",
                errors.message
                  ? "border-[var(--status-danger)] focus:border-[var(--status-danger)] ring-1 ring-[var(--status-danger)]/30"
                  : "border-[var(--border-control)] focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)]/30"
              )}
            />
            {errors.message && (
              <p className="text-[11px] text-[var(--status-danger)] mt-1 font-medium">{errors.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs sm:text-sm font-semibold px-6 h-10 rounded-xl cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
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
