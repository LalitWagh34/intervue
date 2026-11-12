import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Zap,
  Layers,
  Search,
  Code2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useLearnModule } from "@/hooks/useLearn";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DIFFICULTY_STYLES: Record<string, string> = {
  FOUNDATION: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  INTERMEDIATE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ADVANCED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const MODULE_ICONS: Record<string, any> = {
  "arrays-patterns": Layers,
  searching: Search,
};

export default function ModuleTopicsPage() {
  const { subjectSlug, moduleSlug } = useParams<{
    subjectSlug: string;
    moduleSlug: string;
  }>();

  const { data, isLoading, isError } = useLearnModule(subjectSlug, moduleSlug);
  const moduleItem = data?.module;

  if (isLoading) {
    return (
      <div className="w-full min-h-full bg-[var(--canvas)] text-[var(--text-primary)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-pulse">
          <div className="h-4 w-48 rounded bg-[var(--surface-muted)]" />
          <div className="h-28 w-full rounded-2xl bg-[var(--surface)]" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-48 rounded-xl bg-[var(--surface)]" />
            <div className="h-48 rounded-xl bg-[var(--surface)]" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !moduleItem) {
    return (
      <div className="w-full min-h-full bg-[var(--canvas)] text-[var(--text-primary)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]">
            <BookOpen className="h-6 w-6 text-[var(--text-muted)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Module not found
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            This module does not exist or has not been published yet.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to={`/learn/subjects/${subjectSlug || "dsa"}`}>
              Return to Track
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const Icon = MODULE_ICONS[moduleItem.slug] || Code2;

  return (
    <div className="w-full min-h-full bg-[var(--canvas)] text-[var(--text-primary)]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Link
            to="/learn"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            Learn &amp; Revise
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <Link
            to={`/learn/subjects/${moduleItem.subject.slug}`}
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            {moduleItem.subject.title}
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-primary)] font-semibold">
            {moduleItem.title}
          </span>
        </nav>

        {/* Module Header Banner */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-[#327CF6]/15 text-[#327CF6] border-[#327CF6]/30 text-xs font-semibold">
                Module {String(moduleItem.orderIndex || 1).padStart(2, "0")}
              </Badge>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {moduleItem.conceptCount} topics &bull; ~{moduleItem.estimatedMinutes}m total reading time
              </span>
            </div>

            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-[var(--border-control)]">
              <Link to={`/learn/subjects/${moduleItem.subject.slug}`}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Modules
              </Link>
            </Button>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[#327CF6]">
              <Icon className="h-6 w-6" />
            </div>

            <div className="space-y-1 max-w-3xl">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {moduleItem.title}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {moduleItem.description || "Core patterns, invariants, and templates for this module."}
              </p>
            </div>
          </div>
        </div>

        {/* Topics / Concepts Grid */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Topics &amp; Concepts
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Select a concept to start fast revision or explore deep dive invariant proofs
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {moduleItem.concepts.length} {moduleItem.concepts.length === 1 ? "topic" : "topics"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moduleItem.concepts.map((concept) => (
              <Card
                key={concept.id}
                className="border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[#327CF6]/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] uppercase font-semibold", DIFFICULTY_STYLES[concept.difficulty])}
                    >
                      {concept.difficulty.charAt(0) + concept.difficulty.slice(1).toLowerCase()}
                    </Badge>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--text-muted)]">
                      <Clock className="h-3 w-3" />
                      ~{concept.estimatedMinutes}m
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                      {concept.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                      {concept.summary}
                    </p>
                  </div>
                </CardContent>

                <div className="p-4 pt-0">
                  <Button asChild size="sm" className="w-full h-8 text-xs font-semibold gap-1.5 bg-[#327CF6] hover:bg-[#2563EB] text-white">
                    <Link to={`/learn/concepts/${concept.slug}`}>
                      Revise Concept <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

