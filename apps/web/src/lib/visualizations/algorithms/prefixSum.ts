export interface PrefixSumPreset {
  id: string;
  title: string;
  description: string;
  mode: "range_query" | "kadane";
  values: number[];
  queryRange?: [number, number]; // [L, R] inclusive for range query
}

export interface PrefixSumStep {
  stepIndex: number;
  totalSteps: number;
  title: string;
  explanation: string;
  currentIndex: number;
  values: number[];
  prefixArray?: number[];
  currentSum: number;
  bestSum?: number;
  activeRange?: [number, number];
  mode: "range_query" | "kadane";
  status: "building" | "querying" | "optimal" | "done";
}

export const PREFIX_SUM_PRESETS: PrefixSumPreset[] = [
  {
    id: "range-query-demo",
    title: "Prefix Sum: Range Query [2 ... 5]",
    description: "Construct prefix sum table and answer arbitrary range queries in O(1) time.",
    mode: "range_query",
    values: [3, 1, 4, 1, 5, 9, 2],
    queryRange: [2, 5],
  },
  {
    id: "kadane-max-subarray",
    title: "Kadane's Algorithm: Max Subarray",
    description: "Dynamic programming state transition finding maximum contiguous sum in O(n) time.",
    mode: "kadane",
    values: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  },
];

export function generatePrefixSumSteps(preset: PrefixSumPreset): PrefixSumStep[] {
  const steps: PrefixSumStep[] = [];
  const { values, mode, queryRange } = preset;
  const n = values.length;

  if (mode === "range_query") {
    // 1. Initial Step
    steps.push({
      stepIndex: 0,
      totalSteps: 0,
      title: "Initialize Prefix Array P of Size N+1",
      explanation: "Set P[0] = 0 (empty prefix sum). P[i] represents the cumulative sum of elements from index 0 up to i - 1.",
      currentIndex: 0,
      values,
      prefixArray: [0],
      currentSum: 0,
      mode,
      status: "building",
    });

    const prefix = [0];
    for (let i = 0; i < n; i++) {
      const nextSum = prefix[i] + values[i];
      prefix.push(nextSum);

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        title: `Compute P[${i + 1}] = P[${i}] + arr[${i}]`,
        explanation: `P[${i + 1}] = ${prefix[i]} + ${values[i]} = ${nextSum}. Precomputes sum for slice [0 ... ${i}].`,
        currentIndex: i,
        values,
        prefixArray: [...prefix],
        currentSum: nextSum,
        mode,
        status: "building",
      });
    }

    // Range Query Evaluation
    if (queryRange) {
      const [L, R] = queryRange;
      const rangeSum = prefix[R + 1] - prefix[L];

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        title: `Evaluate Range Query Sum(arr[${L} ... ${R}]) in O(1)`,
        explanation: `Formula: Sum(arr[L ... R]) = P[R + 1] - P[L] = P[${R + 1}] - P[${L}] = ${prefix[R + 1]} - ${prefix[L]} = ${rangeSum}. Instant O(1) response without iterating over elements!`,
        currentIndex: -1,
        values,
        prefixArray: prefix,
        currentSum: rangeSum,
        activeRange: [L, R],
        mode,
        status: "optimal",
      });

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        title: "Prefix Query Confirmed",
        explanation: `The subarray [${values.slice(L, R + 1).join(", ")}] sums exactly to ${rangeSum}. Any subsequent range query also executes in O(1) time.`,
        currentIndex: -1,
        values,
        prefixArray: prefix,
        currentSum: rangeSum,
        activeRange: [L, R],
        mode,
        status: "done",
      });
    }
  } else {
    // Kadane's Algorithm
    let maxSoFar = values[0];
    let currentEndingHere = values[0];
    let bestStart = 0;
    let bestEnd = 0;
    let currentStart = 0;

    steps.push({
      stepIndex: 0,
      totalSteps: 0,
      title: "Initialize Kadane's State at Index 0",
      explanation: `Set currentSum = arr[0] (${values[0]}) and maxSum = arr[0] (${values[0]}). Subarray starts at index 0.`,
      currentIndex: 0,
      values,
      currentSum: currentEndingHere,
      bestSum: maxSoFar,
      activeRange: [0, 0],
      mode,
      status: "building",
    });

    for (let i = 1; i < n; i++) {
      const val = values[i];
      const continueSum = currentEndingHere + val;

      if (val > continueSum) {
        currentEndingHere = val;
        currentStart = i;
        steps.push({
          stepIndex: steps.length,
          totalSteps: 0,
          title: `Index ${i}: Restart Subarray (val=${val} > continueSum=${continueSum})`,
          explanation: `Prior accumulated sum was negative or dragging down value (${continueSum} < ${val}). Abandon prior prefix; start fresh subarray at index ${i}.`,
          currentIndex: i,
          values,
          currentSum: currentEndingHere,
          bestSum: maxSoFar,
          activeRange: [currentStart, i],
          mode,
          status: "building",
        });
      } else {
        currentEndingHere = continueSum;
        steps.push({
          stepIndex: steps.length,
          totalSteps: 0,
          title: `Index ${i}: Extend Subarray (currentSum = ${currentEndingHere})`,
          explanation: `Adding arr[${i}] (${val}) yields ${currentEndingHere}. Extend current contiguous window [${currentStart} ... ${i}].`,
          currentIndex: i,
          values,
          currentSum: currentEndingHere,
          bestSum: maxSoFar,
          activeRange: [currentStart, i],
          mode,
          status: "building",
        });
      }

      if (currentEndingHere > maxSoFar) {
        maxSoFar = currentEndingHere;
        bestStart = currentStart;
        bestEnd = i;

        steps.push({
          stepIndex: steps.length,
          totalSteps: 0,
          title: `New Maximum Subarray Found: ${maxSoFar}!`,
          explanation: `currentSum (${currentEndingHere}) exceeds prior record (${maxSoFar}). Update best contiguous slice to [${bestStart} ... ${bestEnd}].`,
          currentIndex: i,
          values,
          currentSum: currentEndingHere,
          bestSum: maxSoFar,
          activeRange: [bestStart, bestEnd],
          mode,
          status: "optimal",
        });
      }
    }

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      title: "Kadane's Algorithm Complete",
      explanation: `Optimal contiguous subarray is [${values.slice(bestStart, bestEnd + 1).join(", ")}] spanning indices [${bestStart} ... ${bestEnd}] with maximum sum = ${maxSoFar}. Computed in strictly O(n) single pass and O(1) extra space.`,
      currentIndex: -1,
      values,
      currentSum: maxSoFar,
      bestSum: maxSoFar,
      activeRange: [bestStart, bestEnd],
      mode,
      status: "done",
    });
  }

  const total = steps.length;
  for (let i = 0; i < total; i++) {
    steps[i].totalSteps = total;
  }

  return steps;
}
