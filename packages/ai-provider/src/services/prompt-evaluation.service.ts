/**
 * Prompt Evaluation Service - Gacha System
 * Evaluates user prompts and determines tier probabilities
 */

import { IAIProvider } from '../types';
import {
  PromptEvaluationRequest,
  PromptEvaluationResponse,
  PromptScore,
  TierProbability,
} from '../types';

const TIER_PROBABILITIES: Record<string, TierProbability> = {
  exceptional: {
    common: 5,
    rare: 30,
    epic: 45,
    legendary: 20,
  },
  high: {
    common: 25,
    rare: 40,
    epic: 28,
    legendary: 7,
  },
  medium: {
    common: 50,
    rare: 35,
    epic: 12,
    legendary: 3,
  },
  low: {
    common: 80,
    rare: 15,
    epic: 4,
    legendary: 1,
  },
};

const EVALUATION_PROMPT = `You are an expert evaluator of AI persona creation prompts.

EVALUATE THIS PROMPT:
"{userPrompt}"

SCORING CRITERIA (rate each 0-25):

1. SPECIFICITY (0-25): How detailed and specific is the prompt?
   - Generic (0-10): "Smart AI", "Helpful assistant"
   - Moderate (11-18): "Marketing expert with social media skills"
   - Specific (19-25): "B2B SaaS marketing strategist specializing in product-led growth, with expertise in SEO, content marketing, and conversion optimization for early-stage startups"

2. CREATIVITY (0-25): How unique and interesting are the traits?
   - Boring (0-10): Standard job description, no personality
   - Moderate (11-18): Some personality traits, basic background
   - Creative (19-25): Unique background story, memorable quirks, unexpected combinations

3. COHERENCE (0-25): Does the persona make logical sense?
   - Contradictory (0-10): Conflicting traits that don't work together
   - Moderate (11-18): Mostly consistent, minor contradictions
   - Coherent (19-25): Clear, consistent, well-integrated personality

4. COMPLEXITY (0-25): Is this a multi-dimensional character?
   - Flat (0-10): One-dimensional, single trait focus
   - Moderate (11-18): Multiple traits, some depth
   - Complex (19-25): Rich backstory, nuanced personality, multiple specialties

RESPOND WITH ONLY THIS JSON (no markdown, no explanation):
{
  "specificity": 0-25,
  "creativity": 0-25,
  "coherence": 0-25,
  "complexity": 0-25,
  "total": sum of above,
  "reasoning": "2-3 sentence explanation of the score"
}`;

export class PromptEvaluationService {
  constructor(private aiProvider: IAIProvider) {}

  /**
   * Evaluate prompt quality and determine tier probabilities
   */
  async evaluatePrompt(
    request: PromptEvaluationRequest
  ): Promise<PromptEvaluationResponse> {
    const { prompt } = request;

    // Generate evaluation using AI
    const evaluationPrompt = EVALUATION_PROMPT.replace('{userPrompt}', prompt);

    const response = await this.aiProvider.generateText({
      prompt: evaluationPrompt,
      maxTokens: 500,
      temperature: 0.3, // Lower temperature for consistent scoring
    });

    // Parse JSON response
    let score: PromptScore;
    try {
      const cleaned = response.text.replace(/```json\n?|\n?```/g, '').trim();
      score = JSON.parse(cleaned);
      
      // Validate scores
      this.validateScore(score);
    } catch (error) {
      throw new Error(`Failed to parse evaluation response: ${error}`);
    }

    // Determine quality level
    const qualityLevel = this.getQualityLevel(score.total);

    // Get tier probabilities
    const tierProbabilities = TIER_PROBABILITIES[qualityLevel];

    return {
      score,
      tierProbabilities,
      qualityLevel,
    };
  }

  /**
   * Validate score object
   */
  private validateScore(score: PromptScore): void {
    const { specificity, creativity, coherence, complexity, total } = score;

    if (
      typeof specificity !== 'number' ||
      typeof creativity !== 'number' ||
      typeof coherence !== 'number' ||
      typeof complexity !== 'number' ||
      typeof total !== 'number'
    ) {
      throw new Error('Invalid score format');
    }

    if (
      specificity < 0 || specificity > 25 ||
      creativity < 0 || creativity > 25 ||
      coherence < 0 || coherence > 25 ||
      complexity < 0 || complexity > 25
    ) {
      throw new Error('Scores must be between 0 and 25');
    }

    if (total < 0 || total > 100) {
      throw new Error('Total score must be between 0 and 100');
    }

    // Verify total is correct
    const calculatedTotal = specificity + creativity + coherence + complexity;
    if (Math.abs(calculatedTotal - total) > 1) {
      score.total = calculatedTotal;
    }
  }

  /**
   * Determine quality level from total score
   */
  private getQualityLevel(
    total: number
  ): 'low' | 'medium' | 'high' | 'exceptional' {
    if (total >= 86) return 'exceptional';
    if (total >= 71) return 'high';
    if (total >= 41) return 'medium';
    return 'low';
  }

  /**
   * Roll tier based on probabilities
   */
  rollTier(probabilities: TierProbability): 'common' | 'rare' | 'epic' | 'legendary' {
    const roll = Math.random() * 100;
    let cumulative = 0;

    for (const [tier, probability] of Object.entries(probabilities)) {
      cumulative += probability;
      if (roll < cumulative) {
        return tier as 'common' | 'rare' | 'epic' | 'legendary';
      }
    }

    return 'common'; // Fallback
  }

  /**
   * Get example prompts for each quality level
   */
  getExamplePrompts(): Record<string, string> {
    return {
      low: 'A smart AI assistant',
      medium: 'A marketing expert who helps with social media campaigns',
      high: 'A seasoned cybersecurity specialist with 15 years of experience in penetration testing, specializing in web application security and cloud infrastructure',
      exceptional: 'A former MI6 intelligence analyst turned cybersecurity consultant, specializing in nation-state threat hunting and APT detection. Known for their methodical approach combining OSINT techniques with behavioral psychology. Has a dry British wit and tendency to quote Sun Tzu. Particularly skilled at reverse engineering malware and conducting adversary emulation exercises.',
    };
  }
}
