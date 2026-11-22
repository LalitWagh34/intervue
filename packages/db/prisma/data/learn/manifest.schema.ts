export type LearnDifficultyType = "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";

export interface LearnQuestionManifest {
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
  orderIndex?: number;
  isPublished?: boolean;
}

export interface LearnAppliedQuestionManifest {
  scenario: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface LearnComplexityManifest {
  time: string;
  space: string;
  tradeOffs?: string;
}

export interface LearnSourceManifest {
  title: string;
  url?: string;
}

export interface LearnConceptManifest {
  moduleSlug: string;
  slug: string;
  orderIndex: number;
  title: string;
  summary: string;
  difficulty: LearnDifficultyType;
  estimatedMinutes: number;
  objectives?: string[];
  prerequisites?: string[];
  quickRevisionMd: string;
  deepDiveMd: string;
  workedExamples?: string[];
  complexity?: LearnComplexityManifest;
  commonMistakes: string[];
  keyTakeaways: string[];
  sources: (string | LearnSourceManifest)[];
  reviewer: string;
  reviewDate: string; // ISO date format, e.g. "2026-11-20"
  changeSummary: string;
  recallQuestions: LearnQuestionManifest[];
  appliedQuestions?: LearnAppliedQuestionManifest[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VALID_DIFFICULTIES = new Set(["FOUNDATION", "INTERMEDIATE", "ADVANCED"]);

export function validateConceptManifest(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Manifest must be a non-null JSON object"] };
  }

  // Module Slug
  if (typeof data.moduleSlug !== "string" || !data.moduleSlug.trim()) {
    errors.push("moduleSlug is required and must be a non-empty string");
  } else if (!SLUG_REGEX.test(data.moduleSlug)) {
    errors.push(`moduleSlug '${data.moduleSlug}' has an invalid format (kebab-case expected)`);
  }

  // Concept Slug
  if (typeof data.slug !== "string" || !data.slug.trim()) {
    errors.push("slug is required and must be a non-empty string");
  } else if (!SLUG_REGEX.test(data.slug)) {
    errors.push(`slug '${data.slug}' has an invalid format (kebab-case expected)`);
  }

  // Order Index
  if (typeof data.orderIndex !== "number" || !Number.isInteger(data.orderIndex) || data.orderIndex < 0) {
    errors.push("orderIndex must be a non-negative integer");
  }

  // Title
  if (typeof data.title !== "string" || data.title.trim().length < 3) {
    errors.push("title must be at least 3 characters long");
  }

  // Summary
  if (typeof data.summary !== "string" || data.summary.trim().length < 10) {
    errors.push("summary must be at least 10 characters long");
  }

  // Difficulty
  if (!VALID_DIFFICULTIES.has(data.difficulty)) {
    errors.push(`difficulty must be one of: ${Array.from(VALID_DIFFICULTIES).join(", ")}`);
  }

  // Estimated Minutes
  if (typeof data.estimatedMinutes !== "number" || !Number.isInteger(data.estimatedMinutes) || data.estimatedMinutes <= 0) {
    errors.push("estimatedMinutes must be a positive integer");
  }

  // Quick Revision Markdown
  if (typeof data.quickRevisionMd !== "string" || data.quickRevisionMd.trim().length < 100) {
    errors.push("quickRevisionMd must be at least 100 characters long");
  }

  // Deep Dive Markdown
  if (typeof data.deepDiveMd !== "string" || data.deepDiveMd.trim().length < 300) {
    errors.push("deepDiveMd must be at least 300 characters long");
  }

  // Key Takeaways
  if (!Array.isArray(data.keyTakeaways) || data.keyTakeaways.length < 2) {
    errors.push("keyTakeaways must be an array of at least 2 items");
  } else if (data.keyTakeaways.some((t: any) => typeof t !== "string" || !t.trim())) {
    errors.push("All keyTakeaways items must be non-empty strings");
  }

  // Common Mistakes
  if (!Array.isArray(data.commonMistakes) || data.commonMistakes.length < 1) {
    errors.push("commonMistakes must be an array of at least 1 item");
  } else if (data.commonMistakes.some((m: any) => typeof m !== "string" || !m.trim())) {
    errors.push("All commonMistakes items must be non-empty strings");
  }

  // Sources
  if (!Array.isArray(data.sources) || data.sources.length < 1) {
    errors.push("sources must be an array of at least 1 source");
  } else {
    data.sources.forEach((s: any, idx: number) => {
      if (typeof s === "string") {
        if (!s.trim()) errors.push(`sources[${idx}] cannot be an empty string`);
      } else if (typeof s === "object" && s !== null) {
        if (typeof s.title !== "string" || !s.title.trim()) {
          errors.push(`sources[${idx}].title must be a non-empty string`);
        }
      } else {
        errors.push(`sources[${idx}] must be a string or an object with title and optional url`);
      }
    });
  }

  // Reviewer
  if (typeof data.reviewer !== "string" || !data.reviewer.trim()) {
    errors.push("reviewer is required (name of technical reviewer)");
  }

  // Review Date
  if (typeof data.reviewDate !== "string" || isNaN(Date.parse(data.reviewDate))) {
    errors.push("reviewDate must be a valid ISO date string (e.g. YYYY-MM-DD)");
  }

  // Change Summary
  if (typeof data.changeSummary !== "string" || !data.changeSummary.trim()) {
    errors.push("changeSummary is required (description of revisions or changes made)");
  }

  // Recall Questions
  if (!Array.isArray(data.recallQuestions) || data.recallQuestions.length < 2) {
    errors.push("recallQuestions must be an array of at least 2 questions");
  } else {
    const promptSet = new Set<string>();

    data.recallQuestions.forEach((q: any, idx: number) => {
      if (!q || typeof q !== "object") {
        errors.push(`Question ${idx + 1} must be an object`);
        return;
      }

      // Prompt
      if (typeof q.prompt !== "string" || q.prompt.trim().length < 5) {
        errors.push(`Question ${idx + 1} prompt must be at least 5 characters long`);
      } else {
        const normalizedPrompt = q.prompt.trim().toLowerCase();
        if (promptSet.has(normalizedPrompt)) {
          errors.push(`Question ${idx + 1} has a duplicate prompt within this manifest`);
        } else {
          promptSet.add(normalizedPrompt);
        }
      }

      // Options
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) {
        errors.push(`Question ${idx + 1} must have between 2 and 6 options`);
      } else {
        const optionSet = new Set<string>();
        let hasDuplicateOption = false;

        q.options.forEach((opt: any, optIdx: number) => {
          if (typeof opt !== "string" || !opt.trim()) {
            errors.push(`Question ${idx + 1} option ${optIdx + 1} must be a non-empty string`);
          } else {
            const normalizedOpt = opt.trim().toLowerCase();
            if (optionSet.has(normalizedOpt)) {
              hasDuplicateOption = true;
            } else {
              optionSet.add(normalizedOpt);
            }
          }
        });

        if (hasDuplicateOption) {
          errors.push(`Question ${idx + 1} contains duplicate options`);
        }

        // Correct Option
        if (typeof q.correctOption !== "number" || !Number.isInteger(q.correctOption)) {
          errors.push(`Question ${idx + 1} correctOption must be an integer index`);
        } else if (q.correctOption < 0 || q.correctOption >= q.options.length) {
          errors.push(`Question ${idx + 1} correctOption index (${q.correctOption}) is out of bounds for ${q.options.length} options`);
        }
      }

      // Explanation
      if (typeof q.explanation !== "string" || q.explanation.trim().length < 5) {
        errors.push(`Question ${idx + 1} explanation must be at least 5 characters long`);
      }
    });
  }

  // Applied questions (optional)
  if (data.appliedQuestions !== undefined) {
    if (!Array.isArray(data.appliedQuestions)) {
      errors.push("appliedQuestions, if provided, must be an array");
    } else {
      data.appliedQuestions.forEach((aq: any, idx: number) => {
        if (!aq || typeof aq !== "object") {
          errors.push(`Applied question ${idx + 1} must be an object`);
          return;
        }
        if (typeof aq.scenario !== "string" || aq.scenario.trim().length < 10) {
          errors.push(`Applied question ${idx + 1} scenario must be at least 10 characters long`);
        }
        if (!Array.isArray(aq.options) || aq.options.length < 2 || aq.options.length > 6) {
          errors.push(`Applied question ${idx + 1} must have between 2 and 6 options`);
        }
        if (typeof aq.correctOption !== "number" || aq.correctOption < 0 || (Array.isArray(aq.options) && aq.correctOption >= aq.options.length)) {
          errors.push(`Applied question ${idx + 1} has an invalid correctOption`);
        }
        if (typeof aq.explanation !== "string" || aq.explanation.trim().length < 5) {
          errors.push(`Applied question ${idx + 1} explanation must be at least 5 characters long`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
