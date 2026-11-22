import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export interface QuestionData {
  id: string;
  revisionId: string;
  conceptId: string;
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
  orderIndex: number;
  isPublished: boolean;
}

interface AdminQuestionEditorProps {
  revisionId: string;
  conceptId: string;
  conceptTitle: string;
  revisionVersion: number;
  isPublished: boolean;
  onClose: () => void;
}

export function AdminQuestionEditor({
  revisionId,
  conceptId,
  conceptTitle,
  revisionVersion,
  isPublished,
  onClose,
}: AdminQuestionEditorProps) {
  const queryClient = useQueryClient();

  // Form State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, number>>({});

  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctOption, setCorrectOption] = useState<number>(0);
  const [explanation, setExplanation] = useState("");

  // Query questions
  const { data, isLoading } = useQuery<{ questions: QuestionData[] }>({
    queryKey: ["admin", "learn", "questions", revisionId],
    queryFn: async () => {
      const res = await api.get<{ questions: QuestionData[] }>(
        `/admin/learn/revisions/${revisionId}/questions`
      );
      return res.data;
    },
  });

  const questions = data?.questions || [];

  // Reset form
  const resetForm = () => {
    setEditingQuestionId(null);
    setPrompt("");
    setOptions(["", ""]);
    setCorrectOption(0);
    setExplanation("");
    setIsFormOpen(false);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleStartEdit = (q: QuestionData) => {
    setEditingQuestionId(q.id);
    setPrompt(q.prompt);
    setOptions([...q.options]);
    setCorrectOption(q.correctOption);
    setExplanation(q.explanation);
    setIsFormOpen(true);
  };

  // Add / remove options
  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (correctOption === index) {
      setCorrectOption(0);
    } else if (correctOption > index) {
      setCorrectOption(correctOption - 1);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        prompt,
        options: options.map((o) => o.trim()),
        correctOption,
        explanation: explanation.trim(),
        orderIndex: questions.length,
      };
      const res = await api.post(
        `/admin/learn/revisions/${revisionId}/questions`,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Question created");
      queryClient.invalidateQueries({ queryKey: ["admin", "learn", "questions", revisionId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "learn", "concepts"] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create question");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingQuestionId) return;
      const payload = {
        prompt,
        options: options.map((o) => o.trim()),
        correctOption,
        explanation: explanation.trim(),
      };
      const res = await api.patch(
        `/admin/learn/questions/${editingQuestionId}`,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Question updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "learn", "questions", revisionId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "learn", "concepts"] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update question");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/learn/questions/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Question deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "learn", "questions", revisionId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "learn", "concepts"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete question");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (questionIds: string[]) => {
      const res = await api.put(
        `/admin/learn/revisions/${revisionId}/questions/reorder`,
        { questionIds }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "learn", "questions", revisionId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to reorder questions");
    },
  });

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const newQuestions = [...questions];
    const [moved] = newQuestions.splice(index, 1);
    newQuestions.splice(targetIndex, 0, moved);

    reorderMutation.mutate(newQuestions.map((q) => q.id));
  };

  const handleSave = () => {
    if (prompt.trim().length < 5) {
      toast.error("Prompt must be at least 5 characters");
      return;
    }
    if (options.some((o) => !o.trim())) {
      toast.error("All options must have non-empty text");
      return;
    }
    if (correctOption < 0 || correctOption >= options.length) {
      toast.error("Please select a valid correct option");
      return;
    }
    if (!explanation.trim()) {
      toast.error("Explanation is required");
      return;
    }

    if (editingQuestionId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[var(--border-control)] bg-[var(--surface)] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Recall Questions &bull; {conceptTitle}
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-[var(--border-control)]"
              >
                Revision v{revisionVersion}
              </Badge>
              {isPublished && (
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px]">
                  Published
                </Badge>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Active revision questions tested during student recall quizzes. Minimum 2 required to publish.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status / Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-muted)] p-3 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[var(--text-primary)]">
              {questions.length} Question{questions.length === 1 ? "" : "s"}
            </span>
            {questions.length >= 2 ? (
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] gap-1">
                <CheckCircle2 className="h-3 w-3" /> Ready to publish
              </Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] gap-1">
                <AlertCircle className="h-3 w-3" /> Minimum 2 questions required ({2 - questions.length} more needed)
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="h-8 text-xs gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              {previewMode ? "Exit Student Preview" : "Preview as Student"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleStartAdd}
              disabled={isFormOpen}
              className="h-8 text-xs font-semibold gap-1.5 bg-[#327CF6] hover:bg-[#2563EB] text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Question
            </Button>
          </div>
        </div>

        {/* Question Add/Edit Form */}
        {isFormOpen && (
          <div className="rounded-xl border border-[#327CF6]/40 bg-[var(--surface-muted)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#327CF6]">
                {editingQuestionId ? "Edit Question" : "New Question"}
              </h4>
              <button
                type="button"
                onClick={resetForm}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Prompt (Question text)</Label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What is the time complexity of cycle detection using slow and fast pointers?"
                className="w-full h-18 rounded-md border border-[var(--border-control)] bg-[var(--surface)] p-2.5 text-xs text-[var(--text-primary)]"
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  Options (2–6 options, select the radio button for the correct answer)
                </Label>
                {options.length < 6 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddOption}
                    className="h-6 text-[11px] text-[#327CF6] hover:text-[#2563EB] gap-1 px-1.5"
                  >
                    <Plus className="h-3 w-3" /> Add Option
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOption === idx}
                      onChange={() => setCorrectOption(idx)}
                      title="Mark as correct option"
                      className="h-4 w-4 text-[#327CF6] focus:ring-[#327CF6]"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="h-8 text-xs bg-[var(--surface)] flex-1"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(idx)}
                        className="h-8 px-2 text-rose-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-1.5">
              <Label className="text-xs">Explanation (shown to student after answering)</Label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="The fast pointer covers distance twice as fast as the slow pointer, detecting cycles in O(N) time."
                className="w-full h-18 rounded-md border border-[var(--border-control)] bg-[var(--surface)] p-2.5 text-xs text-[var(--text-primary)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 text-xs font-semibold bg-[#327CF6] hover:bg-[#2563EB] text-white"
              >
                {isSaving ? "Saving..." : editingQuestionId ? "Update Question" : "Add Question"}
              </Button>
            </div>
          </div>
        )}

        {/* Questions List or Preview */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
            Loading recall questions...
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-[var(--border-control)] rounded-xl">
            <HelpCircle className="h-8 w-8 mx-auto text-[var(--text-muted)]" />
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              No recall questions yet
            </div>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Add at least 2 questions to make this concept eligible for publishing to students.
            </p>
          </div>
        ) : previewMode ? (
          /* Student Preview Mode */
          <div className="space-y-4">
            <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">
              Previewing questions as a student during a recall session:
            </div>
            {questions.map((q, qIdx) => {
              const selected = previewAnswers[q.id];
              const isAnswered = selected !== undefined;
              const isCorrect = isAnswered && selected === q.correctOption;

              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {qIdx + 1}. {q.prompt}
                    </span>
                    {isAnswered && (
                      <Badge
                        className={
                          isCorrect
                            ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px]"
                            : "bg-rose-500/15 text-rose-500 border-rose-500/30 text-[10px]"
                        }
                      >
                        {isCorrect ? "Correct" : "Incorrect"}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {q.options.map((opt, optIdx) => {
                      const isOptionSelected = selected === optIdx;
                      let btnStyle =
                        "border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[#327CF6]";

                      if (isAnswered) {
                        if (optIdx === q.correctOption) {
                          btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-500 font-medium";
                        } else if (isOptionSelected) {
                          btnStyle = "border-rose-500 bg-rose-500/10 text-rose-500";
                        } else {
                          btnStyle = "opacity-50 border-[var(--border-subtle)] bg-[var(--surface)]";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            if (!isAnswered) {
                              setPreviewAnswers({ ...previewAnswers, [q.id]: optIdx });
                            }
                          }}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && optIdx === q.correctOption && (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className="text-xs bg-[var(--surface)] p-3 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--text-primary)]">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Normal Management List */
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 hover:border-[var(--border-control)] transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[10px] font-semibold text-[var(--text-secondary)]">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        {q.prompt}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {q.options.length} options &bull; Correct: Option {q.correctOption + 1} (
                        <span className="text-emerald-500 font-medium">
                          {q.options[q.correctOption]}
                        </span>
                        )
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0 || reorderMutation.isPending}
                      className="h-7 w-7 p-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === questions.length - 1 || reorderMutation.isPending}
                      className="h-7 w-7 p-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(q)}
                      className="h-7 w-7 p-0 text-[#327CF6] hover:text-[#2563EB]"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this recall question?")) {
                          deleteMutation.mutate(q.id);
                        }
                      }}
                      className="h-7 w-7 p-0 text-rose-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Options display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`px-2.5 py-1.5 rounded-md border text-[11px] flex items-center justify-between ${
                        optIdx === q.correctOption
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-medium"
                          : "border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <span>{opt}</span>
                      {optIdx === q.correctOption && (
                        <Check className="h-3 w-3 text-emerald-500" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Explanation display */}
                {q.explanation && (
                  <div className="text-[11px] text-[var(--text-muted)] bg-[var(--surface-muted)] p-2 rounded border border-[var(--border-subtle)]">
                    <span className="font-semibold text-[var(--text-secondary)]">Explanation: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[var(--border-subtle)] pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs font-medium"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
