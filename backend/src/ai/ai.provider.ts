export type AiReport = {
  faceShape: string;
  texture: string;
  length: string;
  density: string;
  movement: string;
  visibleCondition: string;
  signals: { label: string; level: string; note: string }[];
  recommendations: { name: string; score: number; tag: string; description: string; chips: string[] }[];
  services: { name: string; reason: string }[];
};

export type QualityResult = { passed: boolean; score: number; checks: { name: string; passed: boolean; note: string }[]; retakeGuidance: string[] };

export interface AiProvider {
  analyze(prompt: string, imageBase64?: string): Promise<Partial<AiReport> | null>;
}
