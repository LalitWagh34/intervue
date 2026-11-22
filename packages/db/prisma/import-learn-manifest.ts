import { db, PrismaClient } from "../index";
import * as fs from "fs";
import * as path from "path";
import { validateConceptManifest, LearnConceptManifest } from "./data/learn/manifest.schema";

export interface ImportDetail {
  file: string;
  slug: string;
  action: "created_draft" | "updated_draft" | "skipped_protected" | "skipped_identical" | "error";
  version?: number;
  reason?: string;
  errors?: string[];
}

export interface ManifestImportSummary {
  dryRun: boolean;
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  createdDrafts: number;
  updatedDrafts: number;
  skippedDrafts: number;
  details: ImportDetail[];
}

export interface ImportManifestOptions {
  dryRun?: boolean;
  dirPath?: string;
  filePath?: string;
  dbClient?: any;
  allowDraftOverwrite?: boolean;
}

function arraysEqual(a?: any[] | null, b?: any[] | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

export function isRevisionIdenticalToManifest(
  revision: any,
  questions: any[],
  manifest: LearnConceptManifest,
  sourcesSerialized: string[]
): { identical: boolean; diffReason?: string } {
  if (!revision) return { identical: false, diffReason: "Revision does not exist" };

  if ((revision.title || "").trim() !== (manifest.title || "").trim()) {
    return { identical: false, diffReason: "title differs" };
  }
  if ((revision.summary || "").trim() !== (manifest.summary || "").trim()) {
    return { identical: false, diffReason: "summary differs" };
  }
  if ((revision.quickRevisionMd || "").trim() !== (manifest.quickRevisionMd || "").trim()) {
    return { identical: false, diffReason: "quickRevisionMd differs" };
  }
  if ((revision.deepDiveMd || "").trim() !== (manifest.deepDiveMd || "").trim()) {
    return { identical: false, diffReason: "deepDiveMd differs" };
  }
  if (revision.estimatedMinutes !== manifest.estimatedMinutes) {
    return { identical: false, diffReason: "estimatedMinutes differs" };
  }
  if (revision.difficulty !== manifest.difficulty) {
    return { identical: false, diffReason: "difficulty differs" };
  }
  if (!arraysEqual(revision.keyTakeaways, manifest.keyTakeaways)) {
    return { identical: false, diffReason: "keyTakeaways differ" };
  }
  if (!arraysEqual(revision.commonMistakes, manifest.commonMistakes)) {
    return { identical: false, diffReason: "commonMistakes differ" };
  }
  if (!arraysEqual(revision.sources, sourcesSerialized)) {
    return { identical: false, diffReason: "sources differ" };
  }
  if ((revision.reviewer || "").trim() !== (manifest.reviewer || "").trim()) {
    return { identical: false, diffReason: "reviewer differs" };
  }
  if ((revision.changeSummary || "").trim() !== (manifest.changeSummary || "").trim()) {
    return { identical: false, diffReason: "changeSummary differs" };
  }
  if (manifest.reviewDate) {
    const manifestDate = new Date(manifest.reviewDate).toISOString().slice(0, 10);
    const dbDate = revision.reviewedAt ? new Date(revision.reviewedAt).toISOString().slice(0, 10) : null;
    if (dbDate !== manifestDate) {
      return { identical: false, diffReason: `reviewDate differs (database: ${dbDate}, manifest: ${manifestDate})` };
    }
  }

  // Check recall questions comprehensively
  const sortedDbQuestions = [...(questions || [])].sort((a, b) => a.orderIndex - b.orderIndex);
  if (sortedDbQuestions.length !== manifest.recallQuestions.length) {
    return {
      identical: false,
      diffReason: `questions count differs (database: ${sortedDbQuestions.length}, manifest: ${manifest.recallQuestions.length})`,
    };
  }

  for (let i = 0; i < manifest.recallQuestions.length; i++) {
    const dbQ = sortedDbQuestions[i];
    const mQ = manifest.recallQuestions[i];

    if ((dbQ.prompt || "").trim() !== (mQ.prompt || "").trim()) {
      return { identical: false, diffReason: `question ${i + 1} prompt differs` };
    }
    if (dbQ.correctOption !== mQ.correctOption) {
      return { identical: false, diffReason: `question ${i + 1} correctOption differs` };
    }
    if ((dbQ.explanation || "").trim() !== (mQ.explanation || "").trim()) {
      return { identical: false, diffReason: `question ${i + 1} explanation differs` };
    }
    if (Boolean(dbQ.isPublished) !== Boolean(mQ.isPublished ?? true)) {
      return { identical: false, diffReason: `question ${i + 1} isPublished differs` };
    }
    const dbOpts = Array.isArray(dbQ.options) ? dbQ.options : [];
    if (!arraysEqual(dbOpts, mQ.options)) {
      return { identical: false, diffReason: `question ${i + 1} options differ` };
    }
  }

  return { identical: true };
}

export async function runImportLearnManifests(
  options: ImportManifestOptions = {}
): Promise<ManifestImportSummary> {
  const dryRun = options.dryRun ?? false;
  const allowDraftOverwrite = options.allowDraftOverwrite ?? false;
  const prisma = options.dbClient ?? db;

  const manifestDir =
    options.dirPath ?? path.resolve(import.meta.dir, "data/learn");

  let filesToProcess: string[] = [];

  if (options.filePath) {
    filesToProcess = [path.resolve(options.filePath)];
  } else if (fs.existsSync(manifestDir)) {
    const entries = fs.readdirSync(manifestDir);
    filesToProcess = entries
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.join(manifestDir, file));
  }

  const details: ImportDetail[] = [];
  let validFiles = 0;
  let invalidFiles = 0;
  let createdDrafts = 0;
  let updatedDrafts = 0;
  let skippedDrafts = 0;

  for (const filePath of filesToProcess) {
    const fileName = path.basename(filePath);

    let rawContent: string;
    let parsedData: any;

    try {
      rawContent = fs.readFileSync(filePath, "utf-8");
      parsedData = JSON.parse(rawContent);
    } catch (err: any) {
      invalidFiles++;
      details.push({
        file: fileName,
        slug: "unknown",
        action: "error",
        reason: `Failed to read or parse JSON: ${err?.message || String(err)}`,
        errors: [err?.message || String(err)],
      });
      continue;
    }

    const validation = validateConceptManifest(parsedData);
    if (!validation.valid) {
      invalidFiles++;
      details.push({
        file: fileName,
        slug: parsedData?.slug || "unknown",
        action: "error",
        reason: "Structural manifest validation failed",
        errors: validation.errors,
      });
      continue;
    }

    validFiles++;
    const manifest: LearnConceptManifest = parsedData;

    try {
      // 1. Resolve module
      const moduleRecord = await prisma.learnModule.findFirst({
        where: { slug: manifest.moduleSlug },
        select: { id: true, slug: true },
      });

      if (!moduleRecord) {
        details.push({
          file: fileName,
          slug: manifest.slug,
          action: "error",
          reason: `Module '${manifest.moduleSlug}' does not exist in database`,
          errors: [`Module '${manifest.moduleSlug}' does not exist`],
        });
        continue;
      }

      // 2. Resolve concept with revisions and questions for full comparison
      const conceptRecord = await prisma.learnConcept.findUnique({
        where: { slug: manifest.slug },
        include: {
          revisions: {
            orderBy: { version: "desc" },
            include: {
              questions: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      });

      const sourcesSerialized = manifest.sources.map((s) =>
        typeof s === "string" ? s : s.url ? `${s.title} (${s.url})` : s.title
      );

      if (!conceptRecord) {
        // Concept does not exist yet -> Create concept & draft revision v1
        if (dryRun) {
          createdDrafts++;
          details.push({
            file: fileName,
            slug: manifest.slug,
            action: "created_draft",
            version: 1,
            reason: "Concept does not exist. Would create concept and DRAFT revision v1.",
          });
        } else {
          await prisma.$transaction(async (tx: any) => {
            const newConcept = await tx.learnConcept.create({
              data: {
                moduleId: moduleRecord.id,
                slug: manifest.slug,
                orderIndex: manifest.orderIndex,
              },
            });

            const newRev = await tx.learnConceptRevision.create({
              data: {
                conceptId: newConcept.id,
                version: 1,
                status: "DRAFT",
                title: manifest.title,
                summary: manifest.summary,
                quickRevisionMd: manifest.quickRevisionMd,
                deepDiveMd: manifest.deepDiveMd,
                estimatedMinutes: manifest.estimatedMinutes,
                difficulty: manifest.difficulty,
                keyTakeaways: manifest.keyTakeaways,
                commonMistakes: manifest.commonMistakes,
                sources: sourcesSerialized,
                reviewer: manifest.reviewer,
                reviewedAt: new Date(manifest.reviewDate),
                changeSummary: manifest.changeSummary,
              },
            });

            for (let i = 0; i < manifest.recallQuestions.length; i++) {
              const q = manifest.recallQuestions[i];
              await tx.learnRecallQuestion.create({
                data: {
                  conceptId: newConcept.id,
                  revisionId: newRev.id,
                  prompt: q.prompt,
                  options: q.options,
                  correctOption: q.correctOption,
                  explanation: q.explanation,
                  orderIndex: i + 1,
                  isPublished: q.isPublished ?? true,
                },
              });
            }
          });

          createdDrafts++;
          details.push({
            file: fileName,
            slug: manifest.slug,
            action: "created_draft",
            version: 1,
            reason: "Created concept and DRAFT revision v1 with revision-bound questions.",
          });
        }
      } else {
        // Concept exists
        const latestRev = conceptRecord.revisions[0];

        if (!latestRev) {
          // Concept exists without revisions -> Create DRAFT revision v1
          if (dryRun) {
            createdDrafts++;
            details.push({
              file: fileName,
              slug: manifest.slug,
              action: "created_draft",
              version: 1,
              reason: "Concept has no revisions. Would create DRAFT revision v1.",
            });
          } else {
            await prisma.$transaction(async (tx: any) => {
              const newRev = await tx.learnConceptRevision.create({
                data: {
                  conceptId: conceptRecord.id,
                  version: 1,
                  status: "DRAFT",
                  title: manifest.title,
                  summary: manifest.summary,
                  quickRevisionMd: manifest.quickRevisionMd,
                  deepDiveMd: manifest.deepDiveMd,
                  estimatedMinutes: manifest.estimatedMinutes,
                  difficulty: manifest.difficulty,
                  keyTakeaways: manifest.keyTakeaways,
                  commonMistakes: manifest.commonMistakes,
                  sources: sourcesSerialized,
                  reviewer: manifest.reviewer,
                  reviewedAt: new Date(manifest.reviewDate),
                  changeSummary: manifest.changeSummary,
                },
              });

              for (let i = 0; i < manifest.recallQuestions.length; i++) {
                const q = manifest.recallQuestions[i];
                await tx.learnRecallQuestion.create({
                  data: {
                    conceptId: conceptRecord.id,
                    revisionId: newRev.id,
                    prompt: q.prompt,
                    options: q.options,
                    correctOption: q.correctOption,
                    explanation: q.explanation,
                    orderIndex: i + 1,
                    isPublished: q.isPublished ?? true,
                  },
                });
              }
            });

            createdDrafts++;
            details.push({
              file: fileName,
              slug: manifest.slug,
              action: "created_draft",
              version: 1,
              reason: "Created DRAFT revision v1 with revision-bound questions.",
            });
          }
        } else if (latestRev.status === "DRAFT") {
          // Latest revision is a DRAFT -> Run full comprehensive equality check
          const { identical, diffReason } = isRevisionIdenticalToManifest(
            latestRev,
            latestRev.questions || [],
            manifest,
            sourcesSerialized
          );

          if (identical) {
            skippedDrafts++;
            details.push({
              file: fileName,
              slug: manifest.slug,
              action: "skipped_identical",
              version: latestRev.version,
              reason: `DRAFT revision v${latestRev.version} is already identical to manifest across all metadata, content, and questions.`,
            });
          } else {
            // The draft differs from the manifest.
            // Protect admin work: if the draft was edited in admin (authorId is set or status is IN_REVIEW),
            // or if allowDraftOverwrite is not explicitly enabled, do NOT overwrite it!
            const hasManualEdits = latestRev.authorId !== null || latestRev.status === "IN_REVIEW";

            if (hasManualEdits) {
              skippedDrafts++;
              details.push({
                file: fileName,
                slug: manifest.slug,
                action: "skipped_protected",
                version: latestRev.version,
                reason: `DRAFT revision v${latestRev.version} contains manual admin edits (author: ${latestRev.authorId}). Protected from overwrite to preserve admin work.`,
              });
            } else if (!allowDraftOverwrite) {
              skippedDrafts++;
              details.push({
                file: fileName,
                slug: manifest.slug,
                action: "skipped_protected",
                version: latestRev.version,
                reason: `DRAFT revision v${latestRev.version} differs from manifest (${diffReason}). Protected from overwrite to prevent losing draft edits. Pass allowDraftOverwrite / --overwrite-draft to update.`,
              });
            } else {
              // Update existing unauthored DRAFT in-place because allowDraftOverwrite was explicitly requested
              if (dryRun) {
                updatedDrafts++;
                details.push({
                  file: fileName,
                  slug: manifest.slug,
                  action: "updated_draft",
                  version: latestRev.version,
                  reason: `Would update existing DRAFT revision v${latestRev.version} and sync questions (${diffReason}).`,
                });
              } else {
                await prisma.$transaction(async (tx: any) => {
                  await tx.learnConceptRevision.update({
                    where: { id: latestRev.id },
                    data: {
                      title: manifest.title,
                      summary: manifest.summary,
                      quickRevisionMd: manifest.quickRevisionMd,
                      deepDiveMd: manifest.deepDiveMd,
                      estimatedMinutes: manifest.estimatedMinutes,
                      difficulty: manifest.difficulty,
                      keyTakeaways: manifest.keyTakeaways,
                      commonMistakes: manifest.commonMistakes,
                      sources: sourcesSerialized,
                      reviewer: manifest.reviewer,
                      reviewedAt: new Date(manifest.reviewDate),
                      changeSummary: manifest.changeSummary,
                    },
                  });

                  // Replace questions for this draft revision
                  await tx.learnRecallQuestion.deleteMany({
                    where: { revisionId: latestRev.id },
                  });

                  for (let i = 0; i < manifest.recallQuestions.length; i++) {
                    const q = manifest.recallQuestions[i];
                    await tx.learnRecallQuestion.create({
                      data: {
                        conceptId: conceptRecord.id,
                        revisionId: latestRev.id,
                        prompt: q.prompt,
                        options: q.options,
                        correctOption: q.correctOption,
                        explanation: q.explanation,
                        orderIndex: i + 1,
                        isPublished: q.isPublished ?? true,
                      },
                    });
                  }
                });

                updatedDrafts++;
                details.push({
                  file: fileName,
                  slug: manifest.slug,
                  action: "updated_draft",
                  version: latestRev.version,
                  reason: `Updated DRAFT revision v${latestRev.version} and synced questions.`,
                });
              }
            }
          }
        } else {
          // Latest revision is PUBLISHED or IN_REVIEW -> Run full comprehensive equality check
          const { identical } = isRevisionIdenticalToManifest(
            latestRev,
            latestRev.questions || [],
            manifest,
            sourcesSerialized
          );

          if (identical) {
            skippedDrafts++;
            details.push({
              file: fileName,
              slug: manifest.slug,
              action: "skipped_protected",
              version: latestRev.version,
              reason: `Latest revision v${latestRev.version} is already ${latestRev.status} with matching content and questions. Protected.`,
            });
          } else {
            // New changes require a new DRAFT revision (v + 1)
            const nextVersion = latestRev.version + 1;

            if (dryRun) {
              createdDrafts++;
              details.push({
                file: fileName,
                slug: manifest.slug,
                action: "created_draft",
                version: nextVersion,
                reason: `Latest revision v${latestRev.version} is ${latestRev.status}. Would create new DRAFT revision v${nextVersion}.`,
              });
            } else {
              await prisma.$transaction(async (tx: any) => {
                const newRev = await tx.learnConceptRevision.create({
                  data: {
                    conceptId: conceptRecord.id,
                    version: nextVersion,
                    status: "DRAFT",
                    title: manifest.title,
                    summary: manifest.summary,
                    quickRevisionMd: manifest.quickRevisionMd,
                    deepDiveMd: manifest.deepDiveMd,
                    estimatedMinutes: manifest.estimatedMinutes,
                    difficulty: manifest.difficulty,
                    keyTakeaways: manifest.keyTakeaways,
                    commonMistakes: manifest.commonMistakes,
                    sources: sourcesSerialized,
                    reviewer: manifest.reviewer,
                    reviewedAt: new Date(manifest.reviewDate),
                    changeSummary: manifest.changeSummary,
                  },
                });

                for (let i = 0; i < manifest.recallQuestions.length; i++) {
                  const q = manifest.recallQuestions[i];
                  await tx.learnRecallQuestion.create({
                    data: {
                      conceptId: conceptRecord.id,
                      revisionId: newRev.id,
                      prompt: q.prompt,
                      options: q.options,
                      correctOption: q.correctOption,
                      explanation: q.explanation,
                      orderIndex: i + 1,
                      isPublished: q.isPublished ?? true,
                    },
                  });
                }
              });

              createdDrafts++;
              details.push({
                file: fileName,
                slug: manifest.slug,
                action: "created_draft",
                version: nextVersion,
                reason: `Preserved published v${latestRev.version} and created new DRAFT revision v${nextVersion}.`,
              });
            }
          }
        }
      }
    } catch (err: any) {
      details.push({
        file: fileName,
        slug: manifest.slug,
        action: "error",
        reason: `Database error during manifest import: ${err?.message || String(err)}`,
        errors: [err?.message || String(err)],
      });
    }
  }

  return {
    dryRun,
    totalFiles: filesToProcess.length,
    validFiles,
    invalidFiles,
    createdDrafts,
    updatedDrafts,
    skippedDrafts,
    details,
  };
}

// ─── CLI Entrypoint ───────────────────────────────────────────────────────────
if (import.meta.main) {
  const isExecute = process.argv.includes("--execute");
  const isDryRun = !isExecute || process.argv.includes("--dry-run");
  const allowDraftOverwrite = process.argv.includes("--overwrite-draft") || process.argv.includes("--force");

  const fileArgIndex = process.argv.indexOf("--file");
  const specificFile = fileArgIndex !== -1 ? process.argv[fileArgIndex + 1] : undefined;

  console.log(`\n======================================================`);
  console.log(` 📚 Intervue Learn Manifest Importer`);
  console.log(` Mode: ${isDryRun ? "🔍 DRY-RUN (safe preview, no DB writes)" : "⚡ EXECUTE (applying mutations)"}`);
  if (allowDraftOverwrite) console.log(` Option: --overwrite-draft ENABLED (unauthored drafts may update)`);
  if (specificFile) console.log(` Target File: ${specificFile}`);
  console.log(`======================================================\n`);

  runImportLearnManifests({ dryRun: isDryRun, filePath: specificFile, allowDraftOverwrite })
    .then((summary) => {
      console.log(`Results Summary:`);
      console.log(`  Total Files Processed: ${summary.totalFiles}`);
      console.log(`  Valid Manifests:       ${summary.validFiles}`);
      console.log(`  Invalid Manifests:     ${summary.invalidFiles}`);
      console.log(`  Created Drafts:        ${summary.createdDrafts}`);
      console.log(`  Updated Drafts:        ${summary.updatedDrafts}`);
      console.log(`  Skipped (Protected):   ${summary.skippedDrafts}\n`);

      console.log(`Details:`);
      summary.details.forEach((d) => {
        const icon =
          d.action === "created_draft"
            ? "✨"
            : d.action === "updated_draft"
            ? "📝"
            : d.action === "skipped_identical" || d.action === "skipped_protected"
            ? "🛡️"
            : "❌";
        console.log(`  ${icon} [${d.action.toUpperCase()}] ${d.file} (${d.slug}) - ${d.reason}`);
        if (d.errors && d.errors.length > 0) {
          d.errors.forEach((err) => console.log(`      ⚠️  ${err}`));
        }
      });

      console.log(`\n======================================================\n`);
      if (summary.invalidFiles > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n❌ Fatal error running Learn Manifest Importer:", err);
      process.exit(1);
    });
}
