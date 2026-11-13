import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface LearnSubjectSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  moduleCount: number;
  conceptCount: number;
  estimatedMinutes: number;
}

export interface LearnConceptCard {
  id: string;
  slug: string;
  orderIndex: number;
  title: string;
  summary: string;
  difficulty: "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
  estimatedMinutes: number;
}

export interface LearnModuleWithConcepts {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  orderIndex: number;
  concepts: LearnConceptCard[];
}

export interface LearnSubjectDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  conceptCount: number;
  estimatedMinutes: number;
  modules: LearnModuleWithConcepts[];
}

export interface LearnConceptDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  quickRevisionMd: string;
  deepDiveMd: string;
  estimatedMinutes: number;
  difficulty: "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
  keyTakeaways: string[];
  commonMistakes: string[];
  version: number;
  publishedAt: string | null;
  module: {
    slug: string;
    title: string;
  };
  subject: {
    slug: string;
    title: string;
  };
}

export interface LearnConceptResponse {
  concept: LearnConceptDetail;
  navigation: {
    prev: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
  };
}

export function useLearnSubjects() {
  return useQuery<{ subjects: LearnSubjectSummary[] }>({
    queryKey: ["learn", "subjects"],
    queryFn: async () => {
      const { data } = await api.get<{ subjects: LearnSubjectSummary[] }>("/learn/subjects");
      return data;
    },
  });
}

export function useLearnSubject(slug?: string) {
  return useQuery<{ subject: LearnSubjectDetail }>({
    queryKey: ["learn", "subject", slug],
    queryFn: async () => {
      const { data } = await api.get<{ subject: LearnSubjectDetail }>(`/learn/subjects/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
  });
}

export interface LearnModuleDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  orderIndex: number;
  subject: {
    id: string;
    slug: string;
    title: string;
  };
  conceptCount: number;
  estimatedMinutes: number;
  concepts: LearnConceptCard[];
}

export function useLearnModule(subjectSlug?: string, moduleSlug?: string) {
  return useQuery<{ module: LearnModuleDetail }>({
    queryKey: ["learn", "module", subjectSlug, moduleSlug],
    queryFn: async () => {
      const { data } = await api.get<{ module: LearnModuleDetail }>(
        `/learn/subjects/${subjectSlug}/modules/${moduleSlug}`
      );
      return data;
    },
    enabled: Boolean(subjectSlug && moduleSlug),
  });
}

export function useLearnConcept(slug?: string) {
  return useQuery<LearnConceptResponse>({
    queryKey: ["learn", "concept", slug],
    queryFn: async () => {
      const { data } = await api.get<LearnConceptResponse>(`/learn/concepts/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
    retry: 1,
  });
}

export interface RecallQuestion {
  id: string;
  prompt: string;
  options: string[];
  orderIndex: number;
}

export interface ConceptProgressState {
  status: "NOT_STARTED" | "STUDYING" | "STUDIED" | "NEEDS_REVISION" | "CONFIDENT" | "DEMONSTRATED_UNDERSTANDING";
  recallAttempts: number;
  recallCorrect: number;
  reviewStage?: number;
  nextReviewAt?: string | null;
}

export interface RecallResponse {
  questions: RecallQuestion[];
  progress: ConceptProgressState | null;
}

export interface RecallResult {
  isCorrect: boolean;
  correctOption: number;
  explanation: string;
  progress: ConceptProgressState;
}

export interface RecallSessionResult {
  session: {
    id: string;
    score: number;
    questionsCount: number;
    correctCount: number;
    stageBefore: number;
    stageAfter: number;
    isScheduledReview: boolean;
    completedAt: string;
  };
  progress: ConceptProgressState;
}

export function useRecallQuestions(slug?: string) {
  return useQuery<RecallResponse>({
    queryKey: ["learn", "recall", slug],
    queryFn: async () => {
      const { data } = await api.get<RecallResponse>(`/learn/concepts/${slug}/recall`);
      return data;
    },
    enabled: Boolean(slug),
  });
}

export function useSubmitRecall(slug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      selectedOption,
    }: {
      questionId: string;
      selectedOption: number;
    }) => {
      const { data } = await api.post<RecallResult>(`/learn/concepts/${slug}/recall`, {
        questionId,
        selectedOption,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learn", "recall", slug] });
      queryClient.invalidateQueries({ queryKey: ["learn", "concept", slug] });
    },
  });
}

export function useSubmitRecallSession(slug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      answers,
      isScheduledReview,
      revisionId,
    }: {
      answers: Array<{ questionId: string; selectedOption: number }>;
      isScheduledReview?: boolean;
      revisionId?: string;
    }) => {
      const { data } = await api.post<RecallSessionResult>(
        `/learn/concepts/${slug}/recall/session`,
        { answers, isScheduledReview, revisionId }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learn", "recall", slug] });
      queryClient.invalidateQueries({ queryKey: ["learn", "concept", slug] });
      queryClient.invalidateQueries({ queryKey: ["learn", "queue"] });
    },
  });
}

export function useUpdateConceptProgress(slug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input:
        | ConceptProgressState["status"]
        | { status?: ConceptProgressState["status"]; confidence?: number }
    ) => {
      const payload = typeof input === "string" ? { status: input } : input;
      const { data } = await api.patch(`/learn/concepts/${slug}/progress`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learn", "recall", slug] });
      queryClient.invalidateQueries({ queryKey: ["learn", "concept", slug] });
      queryClient.invalidateQueries({ queryKey: ["learn", "queue"] });
    },
  });
}

export interface RevisionQueueItem {
  progressId: string;
  status: ConceptProgressState["status"];
  reviewStage: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  recallAttempts: number;
  recallCorrect: number;
  concept: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    estimatedMinutes: number;
    difficulty: "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
    module: {
      slug: string;
      title: string;
      subject: {
        slug: string;
        title: string;
      };
    };
  };
}

export interface RevisionQueueResponse {
  queue: RevisionQueueItem[];
  totalDue: number;
}

export function useRevisionQueue() {
  return useQuery<RevisionQueueResponse>({
    queryKey: ["learn", "queue"],
    queryFn: async () => {
      const { data } = await api.get<RevisionQueueResponse>("/learn/queue");
      return data;
    },
  });
}

export interface InterviewConceptRecommendation {
  concept: {
    slug: string;
    title: string;
    summary: string;
    difficulty: "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
    estimatedMinutes: number;
    module: {
      slug: string;
      title: string;
      subject: {
        slug: string;
        title: string;
      };
    };
  };
  matchedFeedback: string;
  matchedKeywords: string[];
}

export function useInterviewRecommendations(interviewId?: string) {
  return useQuery<{ recommendations: InterviewConceptRecommendation[] }>({
    queryKey: ["learn", "recommendations", "interview", interviewId],
    queryFn: async () => {
      const { data } = await api.get<{ recommendations: InterviewConceptRecommendation[] }>(
        `/learn/recommendations/interview/${interviewId}`
      );
      return data;
    },
    enabled: Boolean(interviewId),
  });
}
