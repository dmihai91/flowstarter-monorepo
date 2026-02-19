export interface FlowstarterArtifactData {
  id: string;
  title: string;
  type?: string | undefined;
}

export interface ThinkingArtifactData extends FlowstarterArtifactData {
  type: 'thinking';
  steps: string[];
  content: string;
}

