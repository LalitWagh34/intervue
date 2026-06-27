import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles, Pencil, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const LANGUAGES = ["JAVASCRIPT", "PYTHON", "CPP", "JAVA", "TYPESCRIPT"];

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "text-green-400 border-green-900",
  MEDIUM: "text-amber-400 border-amber-900",
  HARD: "text-red-400 border-red-900",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-zinc-400 border-zinc-700",
  published: "text-green-400 border-green-900",
  archived: "text-red-400 border-red-900",
};

function defaultTemplates() {
  return LANGUAGES.map((lang) => ({
    language: lang,
    code:
      lang === "JAVASCRIPT"
        ? "function solution() {\n  // your code here\n}"
        : lang === "PYTHON"
        ? "def solution():\n    # your code here\n    pass"
        : lang === "CPP"
        ? "#include<bits/stdc++.h>\nusing namespace std;\nint main() {\n  // your code here\n  return 0;\n}"
        : lang === "JAVA"
        ? "class Solution {\n  public static void main(String[] args) {\n    // your code here\n  }\n}"
        : "// TypeScript solution here",
  }));
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editId, setEditId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [difficulty, setDifficulty] = useState("EASY");
  const [description, setDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [tags, setTags] = useState("");
  const [company, setCompany] = useState("");
  const [hints, setHints] = useState("");
  const [examples, setExamples] = useState([{ input: "", output: "", explanation: "" }]);
  const [testCases, setTestCases] = useState([{ input: "", expectedOutput: "", isHidden: false }]);
  const [templates, setTemplates] = useState(defaultTemplates());
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateTags, setGenerateTags] = useState("");

  const { data: problems, isLoading } = useQuery({
    queryKey: ["admin-problems"],
    queryFn: async () => {
      const res = await api.get("/admin/problems");
      return res.data.problems;
    },
  });

  function resetForm() {
    setTitle(""); setSlug(""); setDifficulty("EASY"); setDescription("");
    setConstraints(""); setInputFormat(""); setOutputFormat("");
    setTags(""); setCompany(""); setHints("");
    setExamples([{ input: "", output: "", explanation: "" }]);
    setTestCases([{ input: "", expectedOutput: "", isHidden: false }]);
    setTemplates(defaultTemplates());
    setEditId(null);
  }

  async function generateWithAI() {
    if (!generateTopic || !difficulty) return;
    setGenerating(true);
    try {
      const res = await api.post("/admin/problems/generate", {
        topic: generateTopic,
        difficulty,
        tags: generateTags,
      });
      const g = res.data.generated;
      setTitle(g.title || "");
      setSlug(g.slug || "");
      setDescription(g.description || "");
      setConstraints(g.constraints || "");
      setInputFormat(g.inputFormat || "");
      setOutputFormat(g.outputFormat || "");
      setTags((g.tags || []).join(", "));
      setHints((g.hints || []).join("\n"));
      setExamples(g.examples?.length ? g.examples : [{ input: "", output: "", explanation: "" }]);
      setTestCases(g.testCases?.length ? g.testCases : [{ input: "", expectedOutput: "", isHidden: false }]);
      if (g.templates?.length) {
  const generated = g.templates;
  const merged = defaultTemplates().map((def) => {
    const found = generated.find((t: any) => t.language === def.language);
    return found || def;
  });
  setTemplates(merged);
}
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/admin/problems", {
        title, slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
        difficulty, description, constraints, inputFormat, outputFormat,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        company: company.split(",").map((c) => c.trim()).filter(Boolean),
        hints: hints.split("\n").filter(Boolean),
        examples, testCases, templates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      resetForm();
      setView("list");
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/admin/problems/${id}/publish`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-problems"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/problems/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-problems"] }),
  });

  if (view === "list") {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">Problem setter</h1>
            <p className="text-zinc-400 text-sm mt-1">Manage the coding problem bank</p>
          </div>
          <Button
            onClick={() => { resetForm(); setView("create"); }}
            className="bg-white text-black hover:bg-zinc-200"
          >
            <Plus className="w-4 h-4 mr-2" /> New problem
          </Button>
        </div>

        {isLoading && <p className="text-zinc-500">Loading...</p>}

        <div className="space-y-3">
          {problems?.map((p: any) => (
            <Card key={p.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{p.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={DIFFICULTY_COLORS[p.difficulty]}>
                      {p.difficulty}
                    </Badge>
                    <Badge variant="outline" className={STATUS_COLORS[p.status]}>
                      {p.status}
                    </Badge>
                    {p.tags?.slice(0, 3).map((t: string) => (
                      <Badge key={t} variant="outline" className="text-zinc-500 border-zinc-800 text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.status === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:text-white text-xs"
                      onClick={() => publishMutation.mutate(p.id)}
                    >
                      <Eye className="w-3 h-3 mr-1" /> Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:text-white"
                    onClick={() => deleteMutation.mutate(p.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => { resetForm(); setView("list"); }} className="text-zinc-400 hover:text-white text-sm">
          ← Back
        </button>
        <h1 className="text-2xl font-semibold text-white">
          {view === "create" ? "New problem" : "Edit problem"}
        </h1>
      </div>

      {/* AI Generate */}
      <Card className="bg-zinc-900 border-zinc-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Generate with AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-300 text-xs mb-1 block">Topic / concept</Label>
              <Input
                value={generateTopic}
                onChange={(e) => setGenerateTopic(e.target.value)}
                placeholder="e.g. binary search on rotated array"
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs mb-1 block">Tags (optional)</Label>
              <Input
                value={generateTags}
                onChange={(e) => setGenerateTags(e.target.value)}
                placeholder="array, dp, graphs"
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>
          </div>
          <Button
            onClick={generateWithAI}
            disabled={!generateTopic || generating}
            className="bg-amber-500 text-black hover:bg-amber-400 text-sm"
          >
            {generating ? "Generating..." : "Generate and fill form"}
          </Button>
        </CardContent>
      </Card>

      {/* Form */}
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-zinc-300 mb-1 block">Title <span className="text-red-500">*</span></Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white" />
          </div>
          <div>
            <Label className="text-zinc-300 mb-1 block">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated from title"
              className="bg-zinc-900 border-zinc-800 text-white" />
          </div>
        </div>

        <div>
          <Label className="text-zinc-300 mb-2 block">Difficulty</Label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={cn("px-3 py-1.5 rounded-lg text-sm border transition-colors",
                  difficulty === d ? "bg-white text-black border-white"
                    : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700")}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-zinc-300 mb-1 block">Description <span className="text-red-500">*</span></Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={6} className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-zinc-300 mb-1 block">Input format</Label>
            <Textarea value={inputFormat} onChange={(e) => setInputFormat(e.target.value)}
              rows={3} className="bg-zinc-900 border-zinc-800 text-white text-sm" />
          </div>
          <div>
            <Label className="text-zinc-300 mb-1 block">Output format</Label>
            <Textarea value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}
              rows={3} className="bg-zinc-900 border-zinc-800 text-white text-sm" />
          </div>
        </div>

        <div>
          <Label className="text-zinc-300 mb-1 block">Constraints</Label>
          <Textarea value={constraints} onChange={(e) => setConstraints(e.target.value)}
            rows={3} className="bg-zinc-900 border-zinc-800 text-white text-sm font-mono" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-zinc-300 mb-1 block">Tags (comma separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="array, dp, graphs"
              className="bg-zinc-900 border-zinc-800 text-white" />
          </div>
          <div>
            <Label className="text-zinc-300 mb-1 block">Companies (comma separated)</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)}
              placeholder="Google, Meta, Amazon"
              className="bg-zinc-900 border-zinc-800 text-white" />
          </div>
        </div>

        <div>
          <Label className="text-zinc-300 mb-1 block">Hints (one per line)</Label>
          <Textarea value={hints} onChange={(e) => setHints(e.target.value)}
            rows={3} placeholder="Hint 1&#10;Hint 2"
            className="bg-zinc-900 border-zinc-800 text-white text-sm" />
        </div>

        {/* Examples */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-zinc-300">Examples</Label>
            <button onClick={() => setExamples([...examples, { input: "", output: "", explanation: "" }])}
              className="text-zinc-400 hover:text-white text-xs">+ Add example</button>
          </div>
          {examples.map((ex, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <Label className="text-zinc-500 text-xs mb-1 block">Input</Label>
                <Textarea value={ex.input} rows={2}
                  onChange={(e) => { const u = [...examples]; u[i].input = e.target.value; setExamples(u); }}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs font-mono" />
              </div>
              <div>
                <Label className="text-zinc-500 text-xs mb-1 block">Output</Label>
                <Textarea value={ex.output} rows={2}
                  onChange={(e) => { const u = [...examples]; u[i].output = e.target.value; setExamples(u); }}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs font-mono" />
              </div>
              <div>
                <Label className="text-zinc-500 text-xs mb-1 block">Explanation</Label>
                <Textarea value={ex.explanation} rows={2}
                  onChange={(e) => { const u = [...examples]; u[i].explanation = e.target.value; setExamples(u); }}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs" />
              </div>
            </div>
          ))}
        </div>

        {/* Test cases */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-zinc-300">Test cases</Label>
            <button onClick={() => setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: true }])}
              className="text-zinc-400 hover:text-white text-xs">+ Add test case</button>
          </div>
          {testCases.map((tc, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 mb-3 items-start">
              <div>
                <Label className="text-zinc-500 text-xs mb-1 block">Input</Label>
                <Textarea value={tc.input} rows={2}
                  onChange={(e) => { const u = [...testCases]; u[i].input = e.target.value; setTestCases(u); }}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs font-mono" />
              </div>
              <div>
                <Label className="text-zinc-500 text-xs mb-1 block">Expected output</Label>
                <Textarea value={tc.expectedOutput} rows={2}
                  onChange={(e) => { const u = [...testCases]; u[i].expectedOutput = e.target.value; setTestCases(u); }}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs font-mono" />
              </div>
              <div className="pt-5">
                <label className="flex items-center gap-2 text-zinc-400 text-xs cursor-pointer">
                  <input type="checkbox" checked={tc.isHidden}
                    onChange={(e) => { const u = [...testCases]; u[i].isHidden = e.target.checked; setTestCases(u); }} />
                  Hidden
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Templates */}
        <div>
          <Label className="text-zinc-300 mb-2 block">Starter code templates</Label>
          <div className="space-y-3">
            {templates.map((t, i) => (
              <div key={t.language}>
                <Label className="text-zinc-500 text-xs mb-1 block">{t.language}</Label>
                <Textarea value={t.code} rows={4}
                  onChange={(e) => { const u = [...templates]; u[i].code = e.target.value; setTemplates(u); }}
                  className="bg-zinc-900 border-zinc-800 text-white text-xs font-mono" />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex gap-3">
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title || !description || createMutation.isPending}
            className="bg-white text-black hover:bg-zinc-200"
          >
            {createMutation.isPending ? "Saving..." : "Save problem"}
          </Button>
          <Button variant="outline" className="border-zinc-700 text-zinc-300"
            onClick={() => { resetForm(); setView("list"); }}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}