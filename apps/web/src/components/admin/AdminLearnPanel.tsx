import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  X,
  Send,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface SubjectWithModules {
  id: string;
  slug: string;
  title: string;
  modules: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
}

interface AdminConcept {
  id: string;
  slug: string;
  orderIndex: number;
  publishedRevisionId: string | null;
  createdAt: string;
  module: {
    id: string;
    slug: string;
    title: string;
    subject: {
      id: string;
      slug: string;
      title: string;
    };
  };
  publishedRevision: {
    id: string;
    version: number;
    title: string;
    status: string;
    estimatedMinutes: number;
    difficulty: string;
  } | null;
  revisions: Array<{
    id: string;
    version: number;
    title: string;
    status: string;
    estimatedMinutes: number;
    difficulty: string;
  }>;
}

export function AdminLearnPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [difficulty, setDifficulty] = useState("FOUNDATION");
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);
  const [summary, setSummary] = useState("");
  const [quickRevisionMd, setQuickRevisionMd] = useState("");
  const [deepDiveMd, setDeepDiveMd] = useState("");
  const [keyTakeaways, setKeyTakeaways] = useState("");
  const [commonMistakes, setCommonMistakes] = useState("");
  const [autoPublish, setAutoPublish] = useState(false);

  // Queries
  const { data: modulesData } = useQuery<{ subjects: SubjectWithModules[] }>({
    queryKey: ["admin", "learn", "modules"],
    queryFn: async () => {
      const { data } = await api.get<{ subjects: SubjectWithModules[] }>("/admin/learn/modules");
      return data;
    },
  });

  const { data: conceptsData, isLoading } = useQuery<{ concepts: AdminConcept[] }>({
    queryKey: ["admin", "learn", "concepts"],
    queryFn: async () => {
      const { data } = await api.get<{ concepts: AdminConcept[] }>("/admin/learn/concepts");
      return data;
    },
  });

  // Mutations
  const createConceptMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        moduleId: selectedModuleId,
        slug,
        title,
        difficulty,
        estimatedMinutes: Number(estimatedMinutes),
        summary,
        quickRevisionMd,
        deepDiveMd,
        keyTakeaways: keyTakeaways.split("\n").map((s) => s.trim()).filter(Boolean),
        commonMistakes: commonMistakes.split("\n").map((s) => s.trim()).filter(Boolean),
        autoPublish,
      };
      const { data } = await api.post("/admin/learn/concepts", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Concept created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "learn", "concepts"] });
      queryClient.invalidateQueries({ queryKey: ["learn"] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create concept");
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (conceptId: string) => {
      const { data } = await api.post(`/admin/learn/concepts/${conceptId}/publish`, {});
      return data;
    },
    onSuccess: () => {
      toast.success("Concept published to students");
      queryClient.invalidateQueries({ queryKey: ["admin", "learn", "concepts"] });
      queryClient.invalidateQueries({ queryKey: ["learn"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to publish concept");
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async (conceptId: string) => {
      const { data } = await api.post(`/admin/learn/concepts/${conceptId}/unpublish`, {});
      return data;
    },
    onSuccess: () => {
      toast.info("Concept unpublished (hidden from students)");
      queryClient.invalidateQueries({ queryKey: ["admin", "learn", "concepts"] });
      queryClient.invalidateQueries({ queryKey: ["learn"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to unpublish concept");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (conceptId: string) => {
      const { data } = await api.delete(`/admin/learn/concepts/${conceptId}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Concept deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "learn", "concepts"] });
      queryClient.invalidateQueries({ queryKey: ["learn"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete concept");
    },
  });

  const resetForm = () => {
    setSelectedModuleId("");
    setTitle("");
    setSlug("");
    setDifficulty("FOUNDATION");
    setEstimatedMinutes(10);
    setSummary("");
    setQuickRevisionMd("");
    setDeepDiveMd("");
    setKeyTakeaways("");
    setCommonMistakes("");
    setAutoPublish(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const concepts = conceptsData?.concepts || [];
  const filteredConcepts = concepts.filter((c) => {
    const query = search.toLowerCase();
    const latest = c.revisions[0];
    return (
      c.slug.toLowerCase().includes(query) ||
      latest?.title.toLowerCase().includes(query) ||
      c.module.title.toLowerCase().includes(query) ||
      c.module.subject.title.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search concepts by title, slug, or module..."
            className="pl-8 text-xs h-9 bg-[var(--surface)] border-[var(--border-control)]"
          />
        </div>

        <Button
          onClick={() => {
            const firstModule = modulesData?.subjects[0]?.modules[0]?.id;
            if (firstModule) setSelectedModuleId(firstModule);
            setIsCreateOpen(true);
          }}
          size="sm"
          className="h-9 px-3.5 text-xs font-semibold gap-1.5 bg-[#327CF6] hover:bg-[#2563EB] text-white"
        >
          <Plus className="h-4 w-4" />
          New Concept
        </Button>
      </div>

      {/* Concepts Table */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
            Loading concepts catalog...
          </div>
        ) : filteredConcepts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <BookOpen className="h-8 w-8 mx-auto text-[var(--text-muted)]" />
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              No concepts found
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Create a new concept revision or clear search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="p-3">Track &bull; Module</th>
                  <th className="p-3">Concept</th>
                  <th className="p-3">Difficulty</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredConcepts.map((c) => {
                  const latest = c.revisions[0];
                  const isPublished = Boolean(c.publishedRevisionId);

                  return (
                    <tr key={c.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {c.module.subject.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {c.module.title}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {latest?.title || c.slug}
                        </div>
                        <div className="font-mono text-[11px] text-[var(--text-muted)]">
                          /{c.slug} &bull; v{latest?.version || 1}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-semibold border-[var(--border-control)]"
                        >
                          {latest?.difficulty || "FOUNDATION"}
                        </Badge>
                      </td>
                      <td className="p-3 text-[var(--text-secondary)]">
                        ~{latest?.estimatedMinutes || 10}m
                      </td>
                      <td className="p-3">
                        {isPublished ? (
                          <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Published
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] gap-1">
                            <Clock className="h-3 w-3" /> Draft
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isPublished ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => unpublishMutation.mutate(c.id)}
                              disabled={unpublishMutation.isPending}
                              className="h-7 px-2 text-[11px] text-amber-500 hover:text-amber-400"
                            >
                              Unpublish
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => publishMutation.mutate(c.id)}
                              disabled={publishMutation.isPending}
                              className="h-7 px-2 text-[11px] text-emerald-500 hover:text-emerald-400"
                            >
                              Publish
                            </Button>
                          )}

                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            <a
                              href={`/learn/concepts/${c.slug}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </a>
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Delete concept "${latest?.title || c.slug}"?`)) {
                                deleteMutation.mutate(c.id);
                              }
                            }}
                            className="h-7 px-2 text-[11px] text-rose-500 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Concept Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-control)] bg-[var(--surface)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Create New Concept
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Add a new topic to a module with revision notes and deep dive content.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Select Module</Label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-control)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-primary)]"
                >
                  <option value="" disabled>
                    -- Select Module --
                  </option>
                  {modulesData?.subjects.map((sub) => (
                    <optgroup key={sub.id} label={sub.title}>
                      {sub.modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Concept Title</Label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Fast & Slow Pointers"
                  className="h-8 text-xs bg-[var(--surface-muted)]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Slug (URL identifier)</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. fast-slow-pointers"
                  className="h-8 text-xs bg-[var(--surface-muted)]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Difficulty</Label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-control)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                >
                  <option value="FOUNDATION">Foundation</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Estimated Minutes</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="h-8 text-xs bg-[var(--surface-muted)]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Summary (1-2 sentences)</Label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Concise overview for catalog cards..."
                  className="w-full h-16 rounded-md border border-[var(--border-control)] bg-[var(--surface-muted)] p-2.5 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Quick Revision Markdown</Label>
                <textarea
                  value={quickRevisionMd}
                  onChange={(e) => setQuickRevisionMd(e.target.value)}
                  placeholder="## Core Idea\n\nMental models, complexity table, and code template..."
                  className="w-full h-28 rounded-md border border-[var(--border-control)] bg-[var(--surface-muted)] p-2.5 font-mono text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Deep Dive Markdown</Label>
                <textarea
                  value={deepDiveMd}
                  onChange={(e) => setDeepDiveMd(e.target.value)}
                  placeholder="## Deep Dive\n\nUnderlying intuition, invariant proofs, and edge cases..."
                  className="w-full h-28 rounded-md border border-[var(--border-control)] bg-[var(--surface-muted)] p-2.5 font-mono text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Key Takeaways (one per line)</Label>
                <textarea
                  value={keyTakeaways}
                  onChange={(e) => setKeyTakeaways(e.target.value)}
                  placeholder="Monotonic invariant\nO(1) space guarantee"
                  className="w-full h-20 rounded-md border border-[var(--border-control)] bg-[var(--surface-muted)] p-2.5 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Common Mistakes (one per line)</Label>
                <textarea
                  value={commonMistakes}
                  onChange={(e) => setCommonMistakes(e.target.value)}
                  placeholder="Forgetting sorted condition\nOff-by-one loop boundary"
                  className="w-full h-20 rounded-md border border-[var(--border-control)] bg-[var(--surface-muted)] p-2.5 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoPublish"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="rounded border-[var(--border-control)] bg-[var(--surface-muted)] text-[#327CF6]"
                />
                <label htmlFor="autoPublish" className="text-xs font-medium text-[var(--text-secondary)]">
                  Publish immediately (students can view right away)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => createConceptMutation.mutate()}
                disabled={!title || !slug || !selectedModuleId || createConceptMutation.isPending}
                className="h-8 text-xs font-semibold bg-[#327CF6] hover:bg-[#2563EB] text-white"
              >
                {createConceptMutation.isPending ? "Creating..." : "Save Concept"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

