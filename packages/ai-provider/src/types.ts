/**
 * AI Provider Types for AI_XANDRIA
 * Supports: AWS Bedrock (primary), OpenAI (fallback), Gemini (fallback)
 */

// ==========================================
// Provider Types
// ==========================================

export enum AIProvider {
  BEDROCK = 'bedrock',
  OPENAI = 'openai',
  GEMINI = 'gemini',
  MOCK = 'mock',
}

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  region?: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}

// ==========================================
// Text Generation Types
// ==========================================

export interface TextGenerationRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  systemPrompt?: string;
}

export interface TextGenerationResponse {
  text: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter';
  metadata?: Record<string, any>;
}

// ==========================================
// Image Generation Types
// ==========================================

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  style?: 'photographic' | 'digital-art' | 'anime' | 'fantasy';
}

export interface ImageGenerationResponse {
  imageUrl: string;
  base64?: string;
  seed: number;
  model: string;
  metadata?: Record<string, any>;
}

// ==========================================
// Prompt Evaluation Types (Gacha System)
// ==========================================

export interface PromptEvaluationRequest {
  prompt: string;
}

export interface PromptScore {
  specificity: number;    // 0-25
  creativity: number;     // 0-25
  coherence: number;      // 0-25
  complexity: number;     // 0-25
  total: number;          // 0-100
  reasoning: string;
}

export interface TierProbability {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

export interface PromptEvaluationResponse {
  score: PromptScore;
  tierProbabilities: TierProbability;
  qualityLevel: 'low' | 'medium' | 'high' | 'exceptional';
}

// ==========================================
// Battle Judge Types
// ==========================================

export interface BattleJudgeRequest {
  topic: string;
  persona1: {
    name: string;
    traits: {
      intelligence: number;
      creativity: number;
      persuasion: number;
    };
    argument: string;
  };
  persona2: {
    name: string;
    traits: {
      intelligence: number;
      creativity: number;
      persuasion: number;
    };
    argument: string;
  };
}

export interface PersonaScore {
  logical_coherence: number;    // 0-30
  creativity: number;            // 0-25
  persuasiveness: number;        // 0-25
  topic_relevance: number;       // 0-20
  total: number;                 // 0-100
}

export interface BattleJudgeResponse {
  winner: 'persona1' | 'persona2';
  scores: {
    persona1: PersonaScore;
    persona2: PersonaScore;
  };
  reasoning: string;
  highlights: {
    persona1_best: string;
    persona2_best: string;
  };
  improvement_suggestions: {
    persona1: string;
    persona2: string;
  };
}

// ==========================================
// Persona Generation Types
// ==========================================

export interface PersonaGenerationRequest {
  userPrompt: string;
  tier: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PersonaDetails {
  name: string;
  category: string;
  tagline: string;
  description: string;
  traits: {
    intelligence: number;
    creativity: number;
    persuasion: number;
    empathy: number;
    technical: number;
  };
  skills: string[];
  backstory: string;
  personality: string;
  specialties: string[];
}

export interface PersonaGenerationResponse {
  persona: PersonaDetails;
  avatarPrompt: string;  // For image generation
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ==========================================
// Battle Argument Generation Types
// ==========================================

export interface ArgumentGenerationRequest {
  topic: string;
  persona: {
    name: string;
    description: string;
    traits: {
      intelligence: number;
      creativity: number;
      persuasion: number;
    };
    specialties: string[];
  };
  position?: 'pro' | 'con' | 'neutral';
  maxWords?: number;
}

export interface ArgumentGenerationResponse {
  argument: string;
  wordCount: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ==========================================
// Cost Calculation Types
// ==========================================

export interface AIServiceCost {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;   // USD
  outputCost: number;  // USD
  totalCost: number;   // USD
  model: string;
}

export interface ImageGenerationCost {
  imageCount: number;
  costPerImage: number;  // USD
  totalCost: number;     // USD
  model: string;
}

// ==========================================
// Error Types
// ==========================================

export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: AIProvider,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class RateLimitError extends AIProviderError {
  constructor(provider: AIProvider, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, provider);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
  retryAfter?: number;
}

export class ContentFilterError extends AIProviderError {
  constructor(provider: AIProvider, reason: string) {
    super(`Content filtered: ${reason}`, provider);
    this.name = 'ContentFilterError';
  }
}

// ==========================================
// Abstract Provider Interface
// ==========================================

export interface IAIProvider {
  generateText(request: TextGenerationRequest): Promise<TextGenerationResponse>;
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
  countTokens(text: string): Promise<number>;
}
