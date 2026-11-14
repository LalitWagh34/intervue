import { VisualStep, TwoPointersPreset } from "../types";

export const TWO_POINTERS_PRESETS: TwoPointersPreset[] = [
  {
    id: "preset-1",
    title: "Classic Target Sum (Target = 9)",
    description: "Sorted array [1, 2, 4, 7, 11]. Demonstrates both pointer adjustments.",
    values: [1, 2, 4, 7, 11],
    target: 9,
  },
  {
    id: "preset-2",
    title: "Multi-Step Search (Target = 13)",
    description: "Sorted array [1, 2, 4, 6, 8, 9, 14, 15]. Requires multiple left & right convergence steps.",
    values: [1, 2, 4, 6, 8, 9, 14, 15],
    target: 13,
  },
  {
    id: "preset-3",
    title: "Pointers Cross (No Solution, Target = 15)",
    description: "Sorted array [2, 4, 6, 8, 10]. Demonstrates graceful termination when left >= right.",
    values: [2, 4, 6, 8, 10],
    target: 15,
  },
];

export function generateTwoPointersSteps(
  values: number[],
  target: number
): VisualStep[] {
  const steps: VisualStep[] = [];
  let left = 0;
  let right = values.length - 1;

  // Step 0: Initial Setup
  steps.push({
    stepIndex: 0,
    totalSteps: 0, // updated at end
    title: "Initialize Pointers at Opposite Boundaries",
    explanation: `Array is sorted in ascending order. Place left pointer L at index 0 (value ${values[left]}) and right pointer R at index ${right} (value ${values[right]}).`,
    variables: {
      left,
      right,
      "arr[left]": values[left],
      "arr[right]": values[right],
      sum: values[left] + values[right],
      target,
    },
    arrayState: {
      values,
      leftIndex: left,
      rightIndex: right,
      highlightedIndices: [left, right],
      status: "idle",
    },
  });

  let stepCount = 1;
  let found = false;

  while (left < right) {
    const currentSum = values[left] + values[right];

    if (currentSum === target) {
      steps.push({
        stepIndex: stepCount++,
        totalSteps: 0,
        title: `Target Found! arr[${left}] + arr[${right}] = ${target}`,
        explanation: `Current sum (${values[left]} + ${values[right]} = ${currentSum}) matches the target ${target}! The indices [${left}, ${right}] form the solution.`,
        variables: {
          left,
          right,
          "arr[left]": values[left],
          "arr[right]": values[right],
          sum: currentSum,
          target,
        },
        arrayState: {
          values,
          leftIndex: left,
          rightIndex: right,
          highlightedIndices: [left, right],
          status: "found",
        },
      });
      found = true;
      break;
    }

    if (currentSum > target) {
      // Create prediction question before pointer shift on first large occurrence
      const isFirstCheck = steps.length === 1;
      steps.push({
        stepIndex: stepCount++,
        totalSteps: 0,
        title: `Sum (${currentSum}) > Target (${target}): Decrement Right Pointer`,
        explanation: `Because the array is sorted, the sum ${currentSum} is too large. Moving the right pointer left (R: ${right} → ${right - 1}) decreases the sum because arr[${right - 1}] ≤ arr[${right}].`,
        variables: {
          left,
          right,
          "arr[left]": values[left],
          "arr[right]": values[right],
          sum: currentSum,
          target,
        },
        arrayState: {
          values,
          leftIndex: left,
          rightIndex: right,
          highlightedIndices: [left, right],
          status: "too_large",
        },
        predictionQuestion: isFirstCheck
          ? {
              id: "pred-sum-large",
              prompt: `The current sum (${currentSum}) is greater than target (${target}). Since the array is sorted, which pointer should move?`,
              options: [
                "Move Left pointer forward (L++) to decrease sum",
                "Move Right pointer backward (R--) to decrease sum",
                "Move both pointers inward simultaneously",
              ],
              correctOption: 1,
              explanation:
                "In a sorted array, moving R to the left picks a smaller or equal element, reducing the total sum.",
            }
          : undefined,
      });

      right--;
    } else {
      steps.push({
        stepIndex: stepCount++,
        totalSteps: 0,
        title: `Sum (${currentSum}) < Target (${target}): Increment Left Pointer`,
        explanation: `The sum ${currentSum} is smaller than target ${target}. Moving the left pointer right (L: ${left} → ${left + 1}) increases the sum because arr[${left + 1}] ≥ arr[${left}].`,
        variables: {
          left,
          right,
          "arr[left]": values[left],
          "arr[right]": values[right],
          sum: currentSum,
          target,
        },
        arrayState: {
          values,
          leftIndex: left,
          rightIndex: right,
          highlightedIndices: [left, right],
          status: "too_small",
        },
        predictionQuestion:
          steps.length === 2
            ? {
                id: "pred-sum-small",
                prompt: `The current sum (${currentSum}) is less than target (${target}). What is the optimal move?`,
                options: [
                  "Move Left pointer forward (L++) to test larger values",
                  "Move Right pointer forward (R++)",
                  "Exit loop immediately",
                ],
                correctOption: 0,
                explanation:
                  "Moving L to the right accesses a larger value in the sorted array, increasing the two-element sum.",
              }
            : undefined,
      });

      left++;
    }
  }

  if (!found) {
    steps.push({
      stepIndex: stepCount++,
      totalSteps: 0,
      title: "Pointers Crossed: No Valid Pair Exists",
      explanation: `Left pointer (${left}) and right pointer (${right}) have met or crossed without finding any pair summing to ${target}. Completed in O(n) time.`,
      variables: {
        left,
        right,
        sum: "N/A",
        target,
      },
      arrayState: {
        values,
        leftIndex: left,
        rightIndex: right,
        highlightedIndices: [],
        status: "exhausted",
      },
    });
  }

  // Populate totalSteps in each step
  const total = steps.length;
  steps.forEach((s) => {
    s.totalSteps = total;
  });

  return steps;
}

