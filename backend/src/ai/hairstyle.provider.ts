export type HairstyleProfile = {
  faceShape: string;
  hairLength: string;
  hairTexture: string;
  currentStyle: string;
  hairDensity: string;
  faceVisible?: boolean;
  hairVisible?: boolean;
  faceCount?: number;
};

export type HairstyleRecommendation = {
  styleId: string;
  name: string;
  description: string;
  reason: string;
  maintenance: string;
  serviceCategory: string;
  matchReasons: string[];
};

export interface HairstyleAnalysisProvider {
  readonly name: string;
  readonly model: string;
  analyze(
    imageBase64: string,
    mimeType: string,
    preferences: Record<string, unknown>,
  ): Promise<HairstyleProfile>;
  recommend(
    profile: HairstyleProfile,
    preferences: Record<string, unknown>,
  ): Promise<HairstyleRecommendation[]>;
}

export interface HairstyleImageGenerationProvider {
  readonly name: string;
  readonly model: string;
  generate(
    imageBase64: string,
    style: HairstyleRecommendation,
  ): Promise<{ bytes: Buffer; mimeType: string }>;
}
