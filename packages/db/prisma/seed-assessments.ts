import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";

const db = new PrismaClient();

const assessmentQuestions = [
  // ─── OPERATING SYSTEMS ───────────────────────────────────────────
  {
    category: "CORE_CS" as const,
    subject: "OS",
    topic: "Process Scheduling",
    difficulty: "EASY" as const,
    question: "Which of the following CPU scheduling algorithms is non-preemptive?",
    options: ["Round Robin", "First-Come, First-Served (FCFS)", "Shortest Remaining Time First (SRTF)", "Priority Scheduling (Preemptive)"],
    correctOption: 1,
    explanation: "FCFS (First-Come, First-Served) executes processes strictly in the order they arrive until completion, without preemption.",
  },
  {
    category: "CORE_CS" as const,
    subject: "OS",
    topic: "Deadlocks",
    difficulty: "MEDIUM" as const,
    question: "Which of the following conditions is NOT one of Coffman's four conditions required for a deadlock to occur?",
    options: ["Mutual Exclusion", "Hold and Wait", "Preemption Allowed", "Circular Wait"],
    correctOption: 2,
    explanation: "Deadlock requires *No Preemption*. If preemption is allowed, resources can be forcibly reclaimed, breaking the deadlock.",
  },
  {
    category: "CORE_CS" as const,
    subject: "OS",
    topic: "Memory Management",
    difficulty: "MEDIUM" as const,
    question: "What is 'thrashing' in an operating system?",
    options: [
      "A high rate of CPU usage due to intensive calculations",
      "When the CPU spends more time swapping pages in and out than executing instructions",
      "Physical damage caused to a solid-state drive due to excessive writes",
      "A condition where multiple threads simultaneously lock the memory bus"
    ],
    correctOption: 1,
    explanation: "Thrashing occurs when virtual memory resources are overused, causing the system to spend more time paging than executing processes.",
  },
  {
    category: "CORE_CS" as const,
    subject: "OS",
    topic: "Synchronization",
    difficulty: "HARD" as const,
    question: "What is the primary difference between a binary semaphore and a mutex?",
    options: [
      "A mutex can be locked by multiple threads simultaneously",
      "Only the thread that locked a mutex can unlock it (ownership), whereas any thread can signal a semaphore",
      "A binary semaphore can take any positive integer value",
      "Semaphores are implemented in hardware whereas mutexes are purely software constructs"
    ],
    correctOption: 1,
    explanation: "A mutex has the concept of ownership: only the thread that acquired the mutex can release it. A semaphore has no ownership and can be signaled by any thread.",
  },

  // ─── DBMS ────────────────────────────────────────────────────────
  {
    category: "CORE_CS" as const,
    subject: "DBMS",
    topic: "ACID Properties",
    difficulty: "EASY" as const,
    question: "In the ACID acronym for database transactions, what does the 'I' stand for?",
    options: ["Integrity", "Isolation", "Indexing", "Idempotence"],
    correctOption: 1,
    explanation: "The 'I' in ACID stands for Isolation, which guarantees that concurrently executing transactions do not interfere with each other.",
  },
  {
    category: "CORE_CS" as const,
    subject: "DBMS",
    topic: "Normalization",
    difficulty: "MEDIUM" as const,
    question: "A table is in 2NF (Second Normal Form) if and only if it is in 1NF and:",
    options: [
      "There are no transitive dependencies",
      "Every non-prime attribute is fully functionally dependent on the primary key (no partial dependency)",
      "All multivalue dependencies are eliminated",
      "The primary key contains at most two columns"
    ],
    correctOption: 1,
    explanation: "2NF eliminates partial functional dependency: every non-key column must depend on the entire primary key, not just a subset of a composite key.",
  },
  {
    category: "CORE_CS" as const,
    subject: "DBMS",
    topic: "Indexing",
    difficulty: "MEDIUM" as const,
    question: "Why are B+ trees preferred over standard binary search trees for disk-based database indexes?",
    options: [
      "B+ trees have a much higher branching factor, drastically reducing disk I/O operations",
      "B+ trees require less total RAM to store than binary trees",
      "Binary search trees do not support searching in O(log N) time",
      "B+ trees only store keys and do not store pointers"
    ],
    correctOption: 0,
    explanation: "B+ trees have a high fan-out (branching factor), resulting in a short tree height (3-4 levels) which minimizes costly disk read operations.",
  },
  {
    category: "CORE_CS" as const,
    subject: "DBMS",
    topic: "Transactions",
    difficulty: "HARD" as const,
    question: "Which transaction isolation level prevents 'Dirty Reads' and 'Non-Repeatable Reads', but allows 'Phantom Reads'?",
    options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
    correctOption: 2,
    explanation: "In SQL-92 standards, 'Repeatable Read' prevents dirty reads and non-repeatable reads, but still allows phantom rows to appear unless Serializable isolation is used.",
  },

  // ─── COMPUTER NETWORKS ───────────────────────────────────────────
  {
    category: "CORE_CS" as const,
    subject: "CN",
    topic: "OSI Model",
    difficulty: "EASY" as const,
    question: "At which layer of the OSI model does a standard network router primarily operate?",
    options: ["Data Link Layer (Layer 2)", "Network Layer (Layer 3)", "Transport Layer (Layer 4)", "Session Layer (Layer 5)"],
    correctOption: 1,
    explanation: "Routers operate primarily at the Network Layer (Layer 3) to route IP packets between distinct subnets.",
  },
  {
    category: "CORE_CS" as const,
    subject: "CN",
    topic: "Transport Protocols",
    difficulty: "MEDIUM" as const,
    question: "What packets are exchanged during a standard TCP three-way handshake to establish a connection?",
    options: ["SYN -> SYN-ACK -> ACK", "ACK -> SYN -> ACK", "SYN -> ACK -> FIN", "DATA -> ACK -> FIN"],
    correctOption: 0,
    explanation: "TCP establishes a reliable connection using: Client sends SYN, Server replies with SYN-ACK, and Client acknowledges with ACK.",
  },
  {
    category: "CORE_CS" as const,
    subject: "CN",
    topic: "DNS & Application Layer",
    difficulty: "MEDIUM" as const,
    question: "Which transport protocol and port does standard DNS query lookup primarily use?",
    options: ["TCP port 80", "UDP port 53", "TCP port 443", "UDP port 25"],
    correctOption: 1,
    explanation: "Standard DNS client queries use UDP on port 53 for speed and minimal overhead (TCP is used mainly for zone transfers or oversized responses).",
  },

  // ─── QUANTITATIVE APTITUDE ────────────────────────────────────────
  {
    category: "APTITUDE" as const,
    subject: "QUANT",
    topic: "Time and Work",
    difficulty: "EASY" as const,
    question: "A can complete a piece of work in 12 days, and B can complete it in 24 days. Working together, in how many days can they complete the work?",
    options: ["6 days", "8 days", "9 days", "10 days"],
    correctOption: 1,
    explanation: "Work per day = 1/12 + 1/24 = 3/24 = 1/8. Therefore, together they take 8 days.",
  },
  {
    category: "APTITUDE" as const,
    subject: "QUANT",
    topic: "Speed and Distance",
    difficulty: "MEDIUM" as const,
    question: "A train 150 meters long passes a telegraph post in 9 seconds. What is the speed of the train in km/hr?",
    options: ["50 km/hr", "60 km/hr", "72 km/hr", "80 km/hr"],
    correctOption: 1,
    explanation: "Speed = 150m / 9s = 50/3 m/s. To convert to km/hr: (50/3) * (18/5) = 60 km/hr.",
  },
  {
    category: "APTITUDE" as const,
    subject: "QUANT",
    topic: "Probability",
    difficulty: "MEDIUM" as const,
    question: "Two dice are rolled simultaneously. What is the probability of getting a sum equal to 7?",
    options: ["1/12", "1/6", "5/36", "7/36"],
    correctOption: 1,
    explanation: "Outcomes that sum to 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 combinations out of 36 total. 6/36 = 1/6.",
  },

  // ─── LOGICAL REASONING ───────────────────────────────────────────
  {
    category: "APTITUDE" as const,
    subject: "LOGICAL",
    topic: "Number Series",
    difficulty: "EASY" as const,
    question: "Find the next number in the sequence: 2, 6, 12, 20, 30, ?",
    options: ["40", "42", "44", "46"],
    correctOption: 1,
    explanation: "Differences between successive terms are +4, +6, +8, +10, +12. 30 + 12 = 42 (or n^2 + n: 1*2, 2*3, 3*4, 4*5, 5*6, 6*7 = 42).",
  },
  {
    category: "APTITUDE" as const,
    subject: "LOGICAL",
    topic: "Blood Relations",
    difficulty: "MEDIUM" as const,
    question: "Pointing to a photograph, a man says: 'She is the daughter of my grandfather's only son.' How is the woman in the photograph related to the man?",
    options: ["Mother", "Sister", "Aunt", "Daughter"],
    correctOption: 1,
    explanation: "The man's grandfather's only son is the man's father. The daughter of the man's father is his sister.",
  },
];

import fs from "fs";
import path from "path";

async function seedAssessments() {
  console.log("Seeding assessment questions (Core CS & Aptitude)...");

  // Collect all questions from built-in list and data directory
  const allQuestions: any[] = [...assessmentQuestions];

  const dataDir = path.join(__dirname, "data");
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          console.log(`Loaded ${parsed.length} questions from ${file}`);
          allQuestions.push(...parsed);
        }
      } catch (err) {
        console.warn(`Could not parse question file ${file}:`, err);
      }
    }
  }

  // Deduplicate questions by (subject, question text)
  const uniqueMap = new Map<string, any>();
  for (const q of allQuestions) {
    if (!q.subject || !q.question || !Array.isArray(q.options) || q.correctOption === undefined) {
      continue;
    }
    const key = `${q.subject}:::${q.question.trim()}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        category: q.category || (["QUANT", "LOGICAL", "VERBAL"].includes(q.subject) ? "APTITUDE" : "CORE_CS"),
        subject: q.subject.trim().toUpperCase(),
        topic: q.topic || "General",
        difficulty: q.difficulty || "MEDIUM",
        question: q.question.trim(),
        options: q.options,
        correctOption: Number(q.correctOption),
        explanation: q.explanation || null,
      });
    }
  }

  const uniqueQuestions = Array.from(uniqueMap.values());
  console.log(`Total unique questions to process: ${uniqueQuestions.length}`);

  // Fetch existing questions to skip
  const existingQuestions = await db.assessmentQuestion.findMany({
    select: { subject: true, question: true },
  });

  const existingSet = new Set(
    existingQuestions.map((q) => `${q.subject}:::${q.question.trim()}`)
  );

  const toInsert = uniqueQuestions.filter(
    (q) => !existingSet.has(`${q.subject}:::${q.question}`)
  );

  if (toInsert.length > 0) {
    // Batch insert in chunks of 100 for safety and speed
    const chunkSize = 100;
    let totalInserted = 0;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const result = await db.assessmentQuestion.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      totalInserted += result.count;
    }
    console.log(`Successfully batch inserted ${totalInserted} new questions!`);
  } else {
    console.log("All questions are already up-to-date in the database.");
  }

  const finalCount = await db.assessmentQuestion.count();
  console.log(`Current Total Assessment Questions in DB: ${finalCount}`);
}

seedAssessments()
  .catch((e) => {
    console.error("Error seeding assessment questions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
