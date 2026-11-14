export interface BTreeNode {
  id: string;
  pageNumber: number;
  level: "root" | "internal" | "leaf";
  keys: number[];
  childIds?: string[];
  prevLeafId?: string;
  nextLeafId?: string;
}

export interface BTreeModel {
  rootId: string;
  nodes: Record<string, BTreeNode>;
}

export const SAMPLE_BTREE: BTreeModel = {
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      pageNumber: 1,
      level: "root",
      keys: [30, 70],
      childIds: ["int-left", "int-mid", "int-right"],
    },
    "int-left": {
      id: "int-left",
      pageNumber: 2,
      level: "internal",
      keys: [10, 20],
      childIds: ["leaf-0", "leaf-1", "leaf-2"],
    },
    "int-mid": {
      id: "int-mid",
      pageNumber: 3,
      level: "internal",
      keys: [40, 50, 60],
      childIds: ["leaf-3", "leaf-4", "leaf-5", "leaf-6"],
    },
    "int-right": {
      id: "int-right",
      pageNumber: 4,
      level: "internal",
      keys: [80, 90],
      childIds: ["leaf-7", "leaf-8", "leaf-9"],
    },
    // Leaf Nodes (Doubly-Linked Chain)
    "leaf-0": {
      id: "leaf-0",
      pageNumber: 10,
      level: "leaf",
      keys: [2, 5, 8],
      nextLeafId: "leaf-1",
    },
    "leaf-1": {
      id: "leaf-1",
      pageNumber: 11,
      level: "leaf",
      keys: [10, 14, 18],
      prevLeafId: "leaf-0",
      nextLeafId: "leaf-2",
    },
    "leaf-2": {
      id: "leaf-2",
      pageNumber: 12,
      level: "leaf",
      keys: [20, 24, 28],
      prevLeafId: "leaf-1",
      nextLeafId: "leaf-3",
    },
    "leaf-3": {
      id: "leaf-3",
      pageNumber: 13,
      level: "leaf",
      keys: [30, 33, 37],
      prevLeafId: "leaf-2",
      nextLeafId: "leaf-4",
    },
    "leaf-4": {
      id: "leaf-4",
      pageNumber: 14,
      level: "leaf",
      keys: [40, 44, 48],
      prevLeafId: "leaf-3",
      nextLeafId: "leaf-5",
    },
    "leaf-5": {
      id: "leaf-5",
      pageNumber: 15,
      level: "leaf",
      keys: [50, 54, 58],
      prevLeafId: "leaf-4",
      nextLeafId: "leaf-6",
    },
    "leaf-6": {
      id: "leaf-6",
      pageNumber: 16,
      level: "leaf",
      keys: [60, 63, 67],
      prevLeafId: "leaf-5",
      nextLeafId: "leaf-7",
    },
    "leaf-7": {
      id: "leaf-7",
      pageNumber: 17,
      level: "leaf",
      keys: [70, 74, 78],
      prevLeafId: "leaf-6",
      nextLeafId: "leaf-8",
    },
    "leaf-8": {
      id: "leaf-8",
      pageNumber: 18,
      level: "leaf",
      keys: [80, 84, 88],
      prevLeafId: "leaf-7",
      nextLeafId: "leaf-9",
    },
    "leaf-9": {
      id: "leaf-9",
      pageNumber: 19,
      level: "leaf",
      keys: [90, 94, 98],
      prevLeafId: "leaf-8",
    },
  },
};

