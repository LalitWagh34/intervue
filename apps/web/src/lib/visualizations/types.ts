export type VisualizerStatus =
  | "idle"
  | "comparing"
  | "too_large"
  | "too_small"
  | "found"
  | "exhausted";

export interface PredictionQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface ArrayVisualState {
  values: number[];
  leftIndex: number;
  rightIndex: number;
  highlightedIndices: number[];
  status: VisualizerStatus;
}

export interface VisualStep {
  stepIndex: number;
  totalSteps: number;
  title: string;
  explanation: string;
  codeSnippet?: string;
  activeLineIndex?: number;
  variables: Record<string, string | number>;
  arrayState: ArrayVisualState;
  predictionQuestion?: PredictionQuestion;
}

export interface TwoPointersPreset {
  id: string;
  title: string;
  description: string;
  values: number[];
  target: number;
}

