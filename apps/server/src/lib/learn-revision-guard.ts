export interface ConceptRevisionContext {
  id: string;
  publishedRevisionId: string | null;
}

export interface QuestionRevisionEligibility {
  conceptId: string;
  revisionId: string | null;
  isPublished: boolean;
}

/**
 * Determines authoritative revision eligibility for recall questions:
 * 1. If the published revision has bound questions, ONLY those questions are eligible.
 * 2. If the published revision has no bound questions, fallback to legacy unversioned questions (revisionId: null).
 * 3. Never combines bound questions with legacy unversioned questions.
 */
export async function getAuthoritativeRecallFilter(
  concept: ConceptRevisionContext,
  dbClient: any
): Promise<QuestionRevisionEligibility> {
  if (concept.publishedRevisionId) {
    const boundCount = await dbClient.learnRecallQuestion.count({
      where: {
        conceptId: concept.id,
        revisionId: concept.publishedRevisionId,
        isPublished: true,
      },
    });

    if (boundCount > 0) {
      return {
        conceptId: concept.id,
        revisionId: concept.publishedRevisionId,
        isPublished: true,
      };
    }
  }

  // Fallback to legacy unversioned questions
  return {
    conceptId: concept.id,
    revisionId: null,
    isPublished: true,
  };
}

/**
 * Validates if a specific question satisfies the authoritative revision rule for the concept.
 */
export function isQuestionEligibleForRevision(
  question: { conceptId: string; revisionId: string | null; isPublished: boolean },
  concept: ConceptRevisionContext,
  eligibility: QuestionRevisionEligibility
): { eligible: boolean; reason?: string } {
  if (question.conceptId !== concept.id) {
    return { eligible: false, reason: "Question does not belong to this concept" };
  }

  if (!question.isPublished) {
    return { eligible: false, reason: "Question is not published" };
  }

  if (eligibility.revisionId !== null) {
    // Current revision has dedicated questions: legacy questions or questions from other revisions are invalid
    if (question.revisionId !== eligibility.revisionId) {
      return {
        eligible: false,
        reason: "Question does not belong to the current published revision",
      };
    }
  } else {
    // Concept is in legacy compatibility mode: accept legacy null questions or questions matching publishedRevisionId
    if (question.revisionId !== null && question.revisionId !== concept.publishedRevisionId) {
      return {
        eligible: false,
        reason: "Question does not belong to the current published revision",
      };
    }
  }

  return { eligible: true };
}
