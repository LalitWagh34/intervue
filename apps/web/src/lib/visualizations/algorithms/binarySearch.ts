export interface BinarySearchPreset {
  id: string;
  title: string;
  description: string;
  values: number[];
  target: number;
}

export interface BinarySearchStep {
  stepIndex: number;
  totalSteps: number;
  title: string;
  explanation: string;
  left: number;
  right: number;
  mid: number | null;
  midValue: number | null;
  target: number;
  comparison: "less" | "greater" | "equal" | "none";
  discardedIndices: number[];
  activeIndices: number[];
  status: "searching" | "found" | "not_found";
  foundIndex?: number;
  values: number[];
}

export const BINARY_SEARCH_PRESETS: BinarySearchPreset[] = [
  {
    id: "target-12",
    title: "Target = 12 (Found in 3 Steps)",
    description: "Standard binary search converging onto middle-right element.",
    values: [1, 3, 5, 8, 12, 16, 21, 25],
    target: 12,
  },
  {
    id: "target-3",
    title: "Target = 3 (Found in Left Half)",
    description: "Target lies in the lower partition; right boundary contracts.",
    values: [1, 3, 5, 8, 12, 16, 21, 25],
    target: 3,
  },
  {
    id: "target-14",
    title: "Target = 14 (Absence Proof)",
    description: "Target does not exist; proves interval exhaustion and insertion index.",
    values: [1, 3, 5, 8, 12, 16, 21, 25],
    target: 14,
  },
];

export function generateBinarySearchSteps(
  preset: BinarySearchPreset
): BinarySearchStep[] {
  const steps: BinarySearchStep[] = [];
  const { values, target } = preset;
  const n = values.length;

  if (n === 0) return steps;

  let left = 0;
  let right = n - 1;

  steps.push({
    stepIndex: 0,
    totalSteps: 0,
    title: "Initialize Monotonic Search Interval",
    explanation: `Array is sorted in ascending order. Initial search domain spans indices [0 ... ${right}]. Target = ${target}.`,
    left: 0,
    right: n - 1,
    mid: null,
    midValue: null,
    target,
    comparison: "none",
    discardedIndices: [],
    activeIndices: Array.from({ length: n }, (_, i) => i),
    status: "searching",
    values,
  });

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const midVal = values[mid];

    // Compute active & discarded ranges
    const active = [];
    const discarded = [];
    for (let i = 0; i < n; i++) {
      if (i >= left && i <= right) active.push(i);
      else discarded.push(i);
    }

    if (midVal === target) {
      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        title: `Compare arr[${mid}] with Target ${target}: Match Found!`,
        explanation: `arr[mid] = ${midVal} === target (${target}). Search terminates in logarithmic time O(log n).`,
        left,
        right,
        mid,
        midValue: midVal,
        target,
        comparison: "equal",
        discardedIndices: discarded,
        activeIndices: active,
        status: "found",
        foundIndex: mid,
        values,
      });
      break;
    } else if (midVal < target) {
      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        title: `Compare arr[${mid}] = ${midVal} < ${target}`,
        explanation: `arr[${mid}] (${midVal}) is strictly less than target (${target}). Because the array is sorted, all elements at or before index ${mid} are guaranteed to be < ${target}. Discard indices [${left} ... ${mid}]. Advance left to ${mid + 1}.`,
        left,
        right,
        mid,
        midValue: midVal,
        target,
        comparison: "less",
        discardedIndices: discarded,
        activeIndices: active,
        status: "searching",
        values,
      });
      left = mid + 1;
    } else {
      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        title: `Compare arr[${mid}] = ${midVal} > ${target}`,
        explanation: `arr[${mid}] (${midVal}) is strictly greater than target (${target}). All elements at or after index ${mid} are guaranteed to be > ${target}. Discard indices [${mid} ... ${right}]. Retreat right to ${mid - 1}.`,
        left,
        right,
        mid,
        midValue: midVal,
        target,
        comparison: "greater",
        discardedIndices: discarded,
        activeIndices: active,
        status: "searching",
        values,
      });
      right = mid - 1;
    }
  }

  // If not found after loop exit
  if (left > right) {
    const discardedAll = Array.from({ length: n }, (_, i) => i);
    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      title: "Search Interval Exhausted (left > right)",
      explanation: `left pointer (${left}) has crossed right pointer (${right}). The target ${target} does not exist in the array. If inserted, target would belong at index ${left}.`,
      left,
      right,
      mid: null,
      midValue: null,
      target,
      comparison: "none",
      discardedIndices: discardedAll,
      activeIndices: [],
      status: "not_found",
      values,
    });
  }

  // Update totalSteps across all
  const total = steps.length;
  for (let i = 0; i < total; i++) {
    steps[i].totalSteps = total;
  }

  return steps;
}
