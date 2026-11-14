export interface LinkedListPreset {
  id: string;
  title: string;
  description: string;
  values: number[];
}

export interface LinkedListNodeState {
  id: number;
  val: number;
  nextId: number | null; // which node id this node points to
}

export interface LinkedListStep {
  stepIndex: number;
  totalSteps: number;
  title: string;
  explanation: string;
  nodes: LinkedListNodeState[];
  prevId: number | null;
  currId: number | null;
  nextTempId: number | null;
  phase: "save_next" | "reverse_edge" | "advance_prev" | "advance_curr" | "done";
  values: number[];
}

export const LINKED_LIST_PRESETS: LinkedListPreset[] = [
  {
    id: "list-5-nodes",
    title: "5 Nodes: [1 -> 2 -> 3 -> 4 -> 5]",
    description: "Iterative 3-pointer reversal (prev, curr, nextTemp) in O(n) time and O(1) space.",
    values: [1, 2, 3, 4, 5],
  },
  {
    id: "list-3-nodes",
    title: "3 Nodes: [10 -> 20 -> 30]",
    description: "Compact demonstration showing initial null head conversion and terminal pointer handoff.",
    values: [10, 20, 30],
  },
];

export function generateLinkedListSteps(preset: LinkedListPreset): LinkedListStep[] {
  const steps: LinkedListStep[] = [];
  const { values } = preset;
  const n = values.length;

  if (n === 0) return steps;

  // Build initial node graph
  const nodes: LinkedListNodeState[] = values.map((val, idx) => ({
    id: idx,
    val,
    nextId: idx < n - 1 ? idx + 1 : null,
  }));

  // Initial Step 0: prev = null, curr = 0
  let prevId: number | null = null;
  let currId: number | null = 0;

  steps.push({
    stepIndex: 0,
    totalSteps: 0,
    title: "Initialize Pointers: prev = null, curr = head",
    explanation: "Start with prev = null (which will become the new tail's next pointer) and curr = head (Node 0).",
    nodes: nodes.map((n) => ({ ...n })),
    prevId: null,
    currId: 0,
    nextTempId: null,
    phase: "save_next",
    values,
  });

  while (currId !== null) {
    const nextTempId: number | null = nodes[currId].nextId;

    // 1. Save next
    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      title: `Step 1: Save nextTemp = curr.next (Node ${nextTempId !== null ? nodes[nextTempId].val : "null"})`,
      explanation: `Temporarily store the forward pointer nextTemp = curr.next. If we redirect curr.next before saving, we permanently lose reference to the rest of the list!`,
      nodes: nodes.map((n) => ({ ...n })),
      prevId,
      currId,
      nextTempId,
      phase: "save_next",
      values,
    });

    // 2. Reverse edge: curr.next = prev
    nodes[currId].nextId = prevId;

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      title: `Step 2: Reverse Arrow: curr.next = prev (Node ${nodes[currId].val} -> ${prevId !== null ? nodes[prevId].val : "null"})`,
      explanation: `Redirect Node ${nodes[currId].val}'s next pointer backward to prev (${prevId !== null ? `Node ${nodes[prevId].val}` : "null"}). The link is now reversed.`,
      nodes: nodes.map((n) => ({ ...n })),
      prevId,
      currId,
      nextTempId,
      phase: "reverse_edge",
      values,
    });

    // 3. Advance prev = curr
    prevId = currId;

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      title: `Step 3: Advance prev = curr (prev is now Node ${nodes[prevId].val})`,
      explanation: `Move prev forward to become the node we just reversed (Node ${nodes[prevId].val}).`,
      nodes: nodes.map((n) => ({ ...n })),
      prevId,
      currId,
      nextTempId,
      phase: "advance_prev",
      values,
    });

    // 4. Advance curr = nextTemp
    currId = nextTempId;

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      title: `Step 4: Advance curr = nextTemp (${currId !== null ? `Node ${nodes[currId].val}` : "null"})`,
      explanation: `Step curr forward into the unreversed slice via our saved nextTemp reference.`,
      nodes: nodes.map((n) => ({ ...n })),
      prevId,
      currId,
      nextTempId: null,
      phase: "advance_curr",
      values,
    });
  }

  // Final Step: Complete
  steps.push({
    stepIndex: steps.length,
    totalSteps: 0,
    title: `Reversal Complete: New Head is Node ${nodes[prevId!].val}`,
    explanation: `curr has reached null. prev points to the newly established head of the reversed singly linked list (${nodes[prevId!].val}). Algorithm runs in strictly O(n) time and O(1) auxiliary memory.`,
    nodes: nodes.map((n) => ({ ...n })),
    prevId,
    currId: null,
    nextTempId: null,
    phase: "done",
    values,
  });

  const total = steps.length;
  for (let i = 0; i < total; i++) {
    steps[i].totalSteps = total;
  }

  return steps;
}
