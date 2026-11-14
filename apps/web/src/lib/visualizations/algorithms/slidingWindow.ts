export type SlidingWindowType = "fixed" | "variable_min" | "variable_max";

export interface SlidingWindowPreset {
  id: string;
  title: string;
  description: string;
  type: SlidingWindowType;
  values: number[];
  paramK: number; // For fixed window: size K. For variable: target sum S
}

export interface SlidingWindowStep {
  stepIndex: number;
  totalSteps: number;
  title: string;
  explanation: string;
  windowStart: number;
  windowEnd: number; // inclusive
  currentSum: number;
  bestValue: number; // maxSum or minLen
  bestWindow?: [number, number];
  action: "expand" | "shrink" | "slide" | "init" | "found" | "done";
  status: "valid" | "invalid" | "optimal" | "running" | "completed";
  values: number[];
  paramK: number;
  type: SlidingWindowType;
  codeSnippet?: string;
}

export const SLIDING_WINDOW_PRESETS: SlidingWindowPreset[] = [
  {
    id: "fixed-max-sum",
    title: "Fixed Window (Size K = 3)",
    description: "Maximum sum of any contiguous subarray of exact size K = 3.",
    type: "fixed",
    values: [2, 1, 5, 1, 3, 2],
    paramK: 3,
  },
  {
    id: "variable-min-sum",
    title: "Variable Window (Sum ≥ 7)",
    description: "Smallest contiguous subarray length whose sum is at least 7.",
    type: "variable_min",
    values: [2, 3, 1, 2, 4, 3],
    paramK: 7,
  },
  {
    id: "variable-longest-sum",
    title: "Variable Window (Sum ≤ 8)",
    description: "Longest contiguous subarray whose elements sum to at most 8.",
    type: "variable_max",
    values: [3, 1, 2, 5, 1, 1, 2],
    paramK: 8,
  },
];

export function generateSlidingWindowSteps(
  preset: SlidingWindowPreset
): SlidingWindowStep[] {
  const steps: SlidingWindowStep[] = [];
  const { values, type, paramK } = preset;
  const n = values.length;

  if (n === 0) return steps;

  if (type === "fixed") {
    const k = Math.min(paramK, n);
    // 1. Build initial window of size k
    let initialSum = 0;
    for (let i = 0; i < k; i++) initialSum += values[i];

    let maxSum = initialSum;
    let bestWindow: [number, number] = [0, k - 1];

    steps.push({
      stepIndex: 0,
      totalSteps: 0,
      title: `Build Initial Window of Size K=${k}`,
      explanation: `Sum the first ${k} elements: [${values.slice(0, k).join(", ")}] = ${initialSum}. Initialize maxSum = ${initialSum}.`,
      windowStart: 0,
      windowEnd: k - 1,
      currentSum: initialSum,
      bestValue: maxSum,
      bestWindow: [0, k - 1],
      action: "init",
      status: "optimal",
      values,
      paramK: k,
      type,
    });

    let currentSum = initialSum;
    for (let right = k; right < n; right++) {
      const leftToEvict = right - k;
      const evictedVal = values[leftToEvict];
      const incomingVal = values[right];
      currentSum = currentSum - evictedVal + incomingVal;
      const isNewMax = currentSum > maxSum;
      if (isNewMax) {
        maxSum = currentSum;
        bestWindow = [right - k + 1, right];
      }

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        title: `Slide Window to [${right - k + 1} ... ${right}]`,
        explanation: `Evict arr[${leftToEvict}]=${evictedVal} from left, add arr[${right}]=${incomingVal} from right. New sum = ${currentSum}.${
          isNewMax ? ` New maximum sum found: ${maxSum}!` : ` Current max remains ${maxSum}.`
        }`,
        windowStart: right - k + 1,
        windowEnd: right,
        currentSum,
        bestValue: maxSum,
        bestWindow,
        action: "slide",
        status: isNewMax ? "optimal" : "valid",
        values,
        paramK: k,
        type,
      });
    }

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      title: "Window Traversal Completed",
      explanation: `All contiguous subarrays of size ${k} evaluated in O(n) amortized time. Maximum sum is ${maxSum} at window [${bestWindow[0]} ... ${bestWindow[1]}].`,
      windowStart: bestWindow[0],
      windowEnd: bestWindow[1],
      currentSum: maxSum,
      bestValue: maxSum,
      bestWindow,
      action: "done",
      status: "completed",
      values,
      paramK: k,
      type,
    });
  } else if (type === "variable_min") {
    // Smallest Subarray with Sum >= S
    const targetSum = paramK;
    let left = 0;
    let currentSum = 0;
    let minLen = Infinity;
    let bestWindow: [number, number] | undefined = undefined;

    steps.push({
      stepIndex: 0,
      totalSteps: 0,
      title: "Initialize Variable Window",
      explanation: `Target threshold is Sum ≥ ${targetSum}. Start with empty window at index 0.`,
      windowStart: 0,
      windowEnd: -1,
      currentSum: 0,
      bestValue: 0,
      action: "init",
      status: "running",
      values,
      paramK: targetSum,
      type,
    });

    for (let right = 0; right < n; right++) {
      currentSum += values[right];

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        title: `Expand Right to Include arr[${right}] = ${values[right]}`,
        explanation: `Window expands to [${left} ... ${right}]. Running sum is ${currentSum} (Target threshold: ≥ ${targetSum}).`,
        windowStart: left,
        windowEnd: right,
        currentSum,
        bestValue: minLen === Infinity ? 0 : minLen,
        bestWindow,
        action: "expand",
        status: currentSum >= targetSum ? "optimal" : "valid",
        values,
        paramK: targetSum,
        type,
      });

      while (currentSum >= targetSum && left <= right) {
        const windowLen = right - left + 1;
        const isShorter = windowLen < minLen;
        if (isShorter) {
          minLen = windowLen;
          bestWindow = [left, right];
        }

        steps.push({
          stepIndex: steps.length,
          totalSteps: 0,
          title: `Feasible Window Found (Length = ${windowLen})`,
          explanation: `Window [${left} ... ${right}] has sum ${currentSum} ≥ ${targetSum}.${
            isShorter ? ` New minimum length record: ${minLen}!` : ` Current record remains ${minLen}.`
          } Now shrink left to test if an even shorter window suffices.`,
          windowStart: left,
          windowEnd: right,
          currentSum,
          bestValue: minLen,
          bestWindow,
          action: "found",
          status: "optimal",
          values,
          paramK: targetSum,
          type,
        });

        const evicted = values[left];
        currentSum -= evicted;
        left++;

        if (left <= right) {
          steps.push({
            stepIndex: steps.length,
            totalSteps: 0,
            title: `Shrink Left: Evict arr[${left - 1}] = ${evicted}`,
            explanation: `Contract window to [${left} ... ${right}]. New sum is ${currentSum}.`,
            windowStart: left,
            windowEnd: right,
            currentSum,
            bestValue: minLen,
            bestWindow,
            action: "shrink",
            status: currentSum >= targetSum ? "optimal" : "running",
            values,
            paramK: targetSum,
            type,
          });
        }
      }
    }

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      title: "Optimal Shortest Window Confirmed",
      explanation:
        minLen === Infinity
          ? `No contiguous subarray reaches sum ≥ ${targetSum}.`
          : `Optimal minimum length is ${minLen} (Window [${bestWindow![0]} ... ${bestWindow![1]}] with sum ≥ ${targetSum}).`,
      windowStart: bestWindow ? bestWindow[0] : 0,
      windowEnd: bestWindow ? bestWindow[1] : n - 1,
      currentSum: bestWindow
        ? values.slice(bestWindow[0], bestWindow[1] + 1).reduce((a, b) => a + b, 0)
        : 0,
      bestValue: minLen === Infinity ? 0 : minLen,
      bestWindow,
      action: "done",
      status: "completed",
      values,
      paramK: targetSum,
      type,
    });
  } else {
    // Variable Window: Longest Subarray with Sum <= K
    const maxAllowedSum = paramK;
    let left = 0;
    let currentSum = 0;
    let maxLen = 0;
    let bestWindow: [number, number] | undefined = undefined;

    steps.push({
      stepIndex: 0,
      totalSteps: 0,
      title: "Initialize Variable Window",
      explanation: `Target constraint: Sum ≤ ${maxAllowedSum}. Expand right greedily; shrink left when violated.`,
      windowStart: 0,
      windowEnd: -1,
      currentSum: 0,
      bestValue: 0,
      action: "init",
      status: "running",
      values,
      paramK: maxAllowedSum,
      type,
    });

    for (let right = 0; right < n; right++) {
      currentSum += values[right];

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        title: `Expand Right to Include arr[${right}] = ${values[right]}`,
        explanation: `Window [${left} ... ${right}] has sum = ${currentSum} (Max allowed: ${maxAllowedSum}).`,
        windowStart: left,
        windowEnd: right,
        currentSum,
        bestValue: maxLen,
        bestWindow,
        action: "expand",
        status: currentSum <= maxAllowedSum ? "valid" : "invalid",
        values,
        paramK: maxAllowedSum,
        type,
      });

      while (currentSum > maxAllowedSum && left <= right) {
        const evicted = values[left];
        currentSum -= evicted;
        left++;

        steps.push({
          stepIndex: steps.length,
          totalSteps: 0,
          title: `Invariant Violated: Evict arr[${left - 1}] = ${evicted}`,
          explanation: `Sum exceeded ${maxAllowedSum}! Shrink left pointer to restore validity. New sum: ${currentSum}.`,
          windowStart: left,
          windowEnd: right,
          currentSum,
          bestValue: maxLen,
          bestWindow,
          action: "shrink",
          status: currentSum <= maxAllowedSum ? "valid" : "invalid",
          values,
          paramK: maxAllowedSum,
          type,
        });
      }

      const len = right - left + 1;
      if (len > maxLen) {
        maxLen = len;
        bestWindow = [left, right];
      }

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        title: `Valid Window Recorded (Length = ${len})`,
        explanation: `Subarray [${left} ... ${right}] satisfies sum ≤ ${maxAllowedSum}. Best max length so far: ${maxLen}.`,
        windowStart: left,
        windowEnd: right,
        currentSum,
        bestValue: maxLen,
        bestWindow,
        action: "found",
        status: "optimal",
        values,
        paramK: maxAllowedSum,
        type,
      });
    }

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      title: "Algorithm Completed",
      explanation: `Longest valid contiguous subarray length is ${maxLen} (Window [${bestWindow![0]} ... ${bestWindow![1]}] with sum ${values.slice(bestWindow![0], bestWindow![1] + 1).reduce((a, b) => a + b, 0)}).`,
      windowStart: bestWindow ? bestWindow[0] : 0,
      windowEnd: bestWindow ? bestWindow[1] : n - 1,
      currentSum: bestWindow
        ? values.slice(bestWindow[0], bestWindow[1] + 1).reduce((a, b) => a + b, 0)
        : 0,
      bestValue: maxLen,
      bestWindow,
      action: "done",
      status: "completed",
      values,
      paramK: maxAllowedSum,
      type,
    });
  }

  // Update totalSteps across all steps
  const total = steps.length;
  for (let i = 0; i < total; i++) {
    steps[i].totalSteps = total;
  }

  return steps;
}
