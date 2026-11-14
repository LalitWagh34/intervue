export interface MonotonicStackPreset {
  id: string;
  title: string;
  description: string;
  values: number[];
}

export interface MonotonicStackStep {
  stepIndex: number;
  totalSteps: number;
  title: string;
  explanation: string;
  currentIndex: number;
  currentValue: number | null;
  stack: Array<{ index: number; value: number }>;
  result: Array<number | null>;
  action: "inspect" | "pop" | "push" | "done";
  poppedIndex?: number;
  poppedValue?: number;
  resolvedIndex?: number;
  values: number[];
}

export const MONOTONIC_STACK_PRESETS: MonotonicStackPreset[] = [
  {
    id: "next-greater-basic",
    title: "Next Greater Element: [2, 1, 2, 4, 3]",
    description: "Monotonically decreasing stack (storing candidate smaller elements waiting for a greater value).",
    values: [2, 1, 2, 4, 3],
  },
  {
    id: "daily-temperatures",
    title: "Daily Temperatures: [73, 74, 75, 71, 69, 72, 76, 73]",
    description: "Finding days until next warmer temperature via index difference.",
    values: [73, 74, 75, 71, 69, 72, 76, 73],
  },
];

export function generateMonotonicStackSteps(
  preset: MonotonicStackPreset
): MonotonicStackStep[] {
  const steps: MonotonicStackStep[] = [];
  const { values } = preset;
  const n = values.length;

  if (n === 0) return steps;

  const stack: Array<{ index: number; value: number }> = [];
  const result: Array<number | null> = new Array(n).fill(null);

  steps.push({
    stepIndex: 0,
    totalSteps: 0,
    title: "Initialize Monotonic Stack",
    explanation: "Initialize an empty stack. To find the Next Greater Element, we maintain a strictly decreasing stack of un-resolved elements.",
    currentIndex: -1,
    currentValue: null,
    stack: [],
    result: [...result],
    action: "inspect",
    values,
  });

  for (let i = 0; i < n; i++) {
    const val = values[i];

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      title: `Inspect arr[${i}] = ${val}`,
      explanation: `Examine element arr[${i}] = ${val}. Compare with the top of the stack (if any) to check if ${val} acts as the next greater element for pending entries.`,
      currentIndex: i,
      currentValue: val,
      stack: stack.map((item) => ({ ...item })),
      result: [...result],
      action: "inspect",
      values,
    });

    while (stack.length > 0 && stack[stack.length - 1].value < val) {
      const top = stack.pop()!;
      result[top.index] = val;

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        title: `Pop arr[${top.index}]=${top.value}: Next Greater is ${val}`,
        explanation: `arr[${i}] (${val}) is strictly greater than stack top arr[${top.index}] (${top.value}). Record result[${top.index}] = ${val} and pop ${top.value} from stack!`,
        currentIndex: i,
        currentValue: val,
        stack: stack.map((item) => ({ ...item })),
        result: [...result],
        action: "pop",
        poppedIndex: top.index,
        poppedValue: top.value,
        resolvedIndex: top.index,
        values,
      });
    }

    stack.push({ index: i, value: val });

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      title: `Push arr[${i}]=${val} to Stack`,
      explanation: `Stack is now monotonically decreasing. Push index ${i} (value ${val}) onto the stack to await its own next greater element.`,
      currentIndex: i,
      currentValue: val,
      stack: stack.map((item) => ({ ...item })),
      result: [...result],
      action: "push",
      values,
    });
  }

  // Any remaining elements in stack have no greater element to their right
  while (stack.length > 0) {
    const top = stack.pop()!;
    result[top.index] = -1;
  }

  steps.push({
    stepIndex: steps.length,
    totalSteps: 0,
    title: "Array Traversal Completed",
    explanation: "All elements processed in amortized O(n) time (each element is pushed once and popped at most once). Any un-popped elements have no greater element to their right and receive -1.",
    currentIndex: n,
    currentValue: null,
    stack: [],
    result: [...result],
    action: "done",
    values,
  });

  const total = steps.length;
  for (let i = 0; i < total; i++) {
    steps[i].totalSteps = total;
  }

  return steps;
}
