import { SAMPLE_BTREE, BTreeModel, BTreeNode } from "../models/bPlusTree";

export interface BTreeStep {
  stepIndex: number;
  totalSteps: number;
  title: string;
  explanation: string;
  activeLevel: "root" | "internal" | "leaf" | "done";
  activeNodeId: string;
  activeKey?: number;
  visitedNodeIds: string[];
  pagesVisited: number;
  comparisonDetails: string;
  isMatch: boolean;
  status: "searching" | "found" | "not_found" | "scanning" | "range_done";
  leafScanIds: string[];
  matchedKeys: number[];
}

export interface BTreePreset {
  id: string;
  title: string;
  targetKey: number;
  type: "point" | "range";
  rangeEnd?: number;
  description: string;
}

export const BTREE_PRESETS: BTreePreset[] = [
  {
    id: "point-44",
    title: "Lookup id = 44",
    targetKey: 44,
    type: "point",
    description: "Traverse Root → Middle Internal Node → Leaf Page to find row 44 in 3 page reads.",
  },
  {
    id: "point-84",
    title: "Lookup id = 84",
    targetKey: 84,
    type: "point",
    description: "Traverse Root → Right Internal Node → Leaf Page to find row 84 in 3 page reads.",
  },
  {
    id: "point-45",
    title: "Lookup id = 45 (Missing)",
    targetKey: 45,
    type: "point",
    description: "Demonstrates non-existent key search: routes accurately to Leaf Page #4 and proves absence in O(log n).",
  },
  {
    id: "range-33-58",
    title: "Range Scan: 33 to 58",
    targetKey: 33,
    type: "range",
    rangeEnd: 58,
    description: "Seeks starting leaf in O(log n), then walks leaf sibling pointers horizontally in O(k).",
  },
  {
    id: "range-80-98",
    title: "Range Scan: 80 to 98",
    targetKey: 80,
    type: "range",
    rangeEnd: 98,
    description: "Range scan on right subtree: seeks Leaf Page #8 and streams into Leaf Page #9.",
  },
];

export function generateBTreeSteps(
  preset: BTreePreset,
  tree: BTreeModel = SAMPLE_BTREE
): BTreeStep[] {
  const steps: BTreeStep[] = [];
  const root = tree.nodes[tree.rootId];

  if (preset.type === "point") {
    const key = preset.targetKey;

    // 1. Root Page Evaluation
    let childIndex = 0;
    while (childIndex < root.keys.length && key >= root.keys[childIndex]) {
      childIndex++;
    }
    const internalId = root.childIds![childIndex];
    const internalNode = tree.nodes[internalId];

    steps.push({
      stepIndex: 0,
      totalSteps: 3,
      title: `Step 1: Inspect Root Page #${root.pageNumber}`,
      explanation: `Executing SELECT * FROM users WHERE id = ${key}. Engine begins at Root Page #${root.pageNumber} (pinned in Buffer Pool RAM). Binary searches keys [${root.keys.join(", ")}].`,
      activeLevel: "root",
      activeNodeId: root.id,
      visitedNodeIds: [root.id],
      pagesVisited: 1,
      comparisonDetails: `Key ${key} routes via pointer #${childIndex} (${
        childIndex === 0
          ? `< ${root.keys[0]}`
          : childIndex === root.keys.length
          ? `≥ ${root.keys[root.keys.length - 1]}`
          : `${root.keys[childIndex - 1]} ≤ key < ${root.keys[childIndex]}`
      }) to Page #${internalNode.pageNumber}.`,
      isMatch: false,
      status: "searching",
      leafScanIds: [],
      matchedKeys: [],
    });

    // 2. Internal Page Evaluation
    let leafChildIndex = 0;
    while (leafChildIndex < internalNode.keys.length && key >= internalNode.keys[leafChildIndex]) {
      leafChildIndex++;
    }
    const leafId = internalNode.childIds![leafChildIndex];
    const leafNode = tree.nodes[leafId];

    steps.push({
      stepIndex: 1,
      totalSteps: 3,
      title: `Step 2: Inspect Internal Page #${internalNode.pageNumber}`,
      explanation: `Internal pages hold only routing keys (no row data). Binary search on [${internalNode.keys.join(", ")}] identifies the leaf pointer leading to Leaf Page #${leafNode.pageNumber}.`,
      activeLevel: "internal",
      activeNodeId: internalNode.id,
      visitedNodeIds: [root.id, internalNode.id],
      pagesVisited: 2,
      comparisonDetails: `Key ${key} routes to Leaf Page #${leafNode.pageNumber} (${leafNode.id}) with keys [${leafNode.keys.join(", ")}].`,
      isMatch: false,
      status: "searching",
      leafScanIds: [],
      matchedKeys: [],
    });

    // 3. Leaf Page Evaluation (Actual membership check!)
    const hasKey = leafNode.keys.includes(key);

    if (hasKey) {
      steps.push({
        stepIndex: 2,
        totalSteps: 3,
        title: `Step 3: Record Found in Leaf Page #${leafNode.pageNumber}!`,
        explanation: `Found record with id = ${key} in Leaf Page #${leafNode.pageNumber}! For a Clustered Index (InnoDB), the complete row payload is stored right here. Total cost: 3 logical page reads (with Root cached in RAM, exactly 1-2 physical I/Os).`,
        activeLevel: "done",
        activeNodeId: leafNode.id,
        activeKey: key,
        visitedNodeIds: [root.id, internalNode.id, leafNode.id],
        pagesVisited: 3,
        comparisonDetails: `MATCH: id = ${key} located in Leaf Page #${leafNode.pageNumber}.`,
        isMatch: true,
        status: "found",
        leafScanIds: [leafNode.id],
        matchedKeys: [key],
      });
    } else {
      steps.push({
        stepIndex: 2,
        totalSteps: 3,
        title: `Step 3: Key ${key} NOT Found (Proved Absent)`,
        explanation: `Leaf Page #${leafNode.pageNumber} contains keys [${leafNode.keys.join(", ")}]. Since the leaf is ordered and ${key} is missing, the engine proves in O(log n) time that row ${key} does NOT exist, without scanning the rest of the table.`,
        activeLevel: "done",
        activeNodeId: leafNode.id,
        visitedNodeIds: [root.id, internalNode.id, leafNode.id],
        pagesVisited: 3,
        comparisonDetails: `NOT FOUND: id = ${key} is absent between [${leafNode.keys.join(", ")}].`,
        isMatch: false,
        status: "not_found",
        leafScanIds: [leafNode.id],
        matchedKeys: [],
      });
    }
  } else {
    // Dynamic Range Scan Implementation based on preset.targetKey and preset.rangeEnd
    const startKey = preset.targetKey;
    const endKey = preset.rangeEnd ?? startKey + 25;

    // 1. Root route to find start
    let childIndex = 0;
    while (childIndex < root.keys.length && startKey >= root.keys[childIndex]) {
      childIndex++;
    }
    const internalId = root.childIds![childIndex];
    const internalNode = tree.nodes[internalId];

    // 2. Internal route to starting leaf
    let leafChildIndex = 0;
    while (leafChildIndex < internalNode.keys.length && startKey >= internalNode.keys[leafChildIndex]) {
      leafChildIndex++;
    }
    const startingLeafId = internalNode.childIds![leafChildIndex];

    steps.push({
      stepIndex: 0,
      totalSteps: 0, // filled later
      title: `Step 1: Seek Lower Bound (WHERE id >= ${startKey})`,
      explanation: `Phase 1 of Range Scan: Use root and internal routing to locate the lower bound key ${startKey} in O(log_b N) tree depth.`,
      activeLevel: "root",
      activeNodeId: root.id,
      visitedNodeIds: [root.id],
      pagesVisited: 1,
      comparisonDetails: `Root [${root.keys.join(", ")}]: key ${startKey} routes to Internal Page #${internalNode.pageNumber}.`,
      isMatch: false,
      status: "scanning",
      leafScanIds: [],
      matchedKeys: [],
    });

    steps.push({
      stepIndex: 1,
      totalSteps: 0,
      title: `Step 2: Reach Starting Leaf Page`,
      explanation: `Internal Page #${internalNode.pageNumber} routes directly to starting Leaf Page #${tree.nodes[startingLeafId].pageNumber}.`,
      activeLevel: "internal",
      activeNodeId: internalNode.id,
      visitedNodeIds: [root.id, internalNode.id],
      pagesVisited: 2,
      comparisonDetails: `Routed to starting Leaf Page #${tree.nodes[startingLeafId].pageNumber}.`,
      isMatch: false,
      status: "scanning",
      leafScanIds: [],
      matchedKeys: [],
    });

    // 3. Sequentially walk through leaf chain
    let currentLeafId: string | undefined = startingLeafId;
    let stepCount = 2;
    const visitedNodes = [root.id, internalNode.id];
    const scannedLeafIds: string[] = [];
    const accumulatedMatchedKeys: number[] = [];
    let pageCount = 2;

    while (currentLeafId) {
      const currentLeaf: BTreeNode | undefined = tree.nodes[currentLeafId];
      if (!currentLeaf) break;

      pageCount++;
      visitedNodes.push(currentLeaf.id);
      scannedLeafIds.push(currentLeaf.id);

      const leafMatches = currentLeaf.keys.filter((k: number) => k >= startKey && k <= endKey);
      accumulatedMatchedKeys.push(...leafMatches);

      const isFirstLeaf = currentLeafId === startingLeafId;
      const isLastLeaf =
        !currentLeaf.nextLeafId ||
        currentLeaf.keys[currentLeaf.keys.length - 1] >= endKey;

      steps.push({
        stepIndex: stepCount++,
        totalSteps: 0,
        title: isFirstLeaf
          ? `Step 3: Read Initial Range on Leaf Page #${currentLeaf.pageNumber}`
          : `Step ${stepCount}: Follow Sibling Pointer to Leaf Page #${currentLeaf.pageNumber}`,
        explanation: isFirstLeaf
          ? `Reached starting leaf #${currentLeaf.pageNumber}. Emits matching rows [${leafMatches.join(", ")}] in range.`
          : `CRITICAL INVARIANT: Follows horizontal 'next' sibling pointer directly to Leaf Page #${currentLeaf.pageNumber}. Emits rows [${leafMatches.join(", ")}] with zero tree re-traversals!`,
        activeLevel: isLastLeaf ? "done" : "leaf",
        activeNodeId: currentLeaf.id,
        visitedNodeIds: [...visitedNodes],
        pagesVisited: pageCount,
        comparisonDetails: `Leaf Page #${currentLeaf.pageNumber}: matched [${leafMatches.join(", ")}]. (Total matched: ${accumulatedMatchedKeys.length}).`,
        isMatch: leafMatches.length > 0,
        status: isLastLeaf ? "range_done" : "scanning",
        leafScanIds: [...scannedLeafIds],
        matchedKeys: [...accumulatedMatchedKeys],
      });

      if (isLastLeaf) break;
      currentLeafId = currentLeaf.nextLeafId;
    }
  }

  // Populate dynamic totalSteps
  const total = steps.length;
  steps.forEach((s) => {
    s.totalSteps = total;
  });

  return steps;
}
