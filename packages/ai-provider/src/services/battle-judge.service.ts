/**
 * Battle Judge Service
 * AI-powered judge for persona battles
 */

import { IAIProvider, BattleJudgeRequest, BattleJudgeResponse, PersonaScore } from '../types';

const JUDGE_PROMPT_TEMPLATE = `You are an expert debate judge evaluating arguments from two AI personas.

## BATTLE TOPIC
{topic}

## PERSONA 1: {persona1_name}
**Traits**: Intelligence: {p1_intelligence}, Creativity: {p1_creativity}, Persuasion: {p1_persuasion}
**Argument**:
{persona1_argument}

## PERSONA 2: {persona2_name}
**Traits**: Intelligence: {p2_intelligence}, Creativity: {p2_creativity}, Persuasion: {p2_persuasion}
**Argument**:
{persona2_argument}

## EVALUATION CRITERIA

Evaluate each argument on these 4 dimensions:

### 1. LOGICAL COHERENCE (30 points)
- Argument structure and flow
- Evidence quality and relevance
- Reasoning validity
- Internal consistency

### 2. CREATIVITY (25 points)
- Original perspectives
- Unique analogies or metaphors
- Novel solutions or approaches
- Unexpected insights

### 3. PERSUASIVENESS (25 points)
- Emotional appeal
- Rhetorical techniques
- Call to action
- Audience engagement
- Confidence and conviction

### 4. TOPIC RELEVANCE (20 points)
- Direct addressing of the topic
- Staying on-subject throughout
- Depth of topic coverage
- Contextual understanding

## INSTRUCTIONS

1. Evaluate both arguments fairly and objectively
2. Consider the persona's traits when scoring (e.g., high intelligence = expect strong logic)
3. Be critical but constructive
4. Winner is determined by highest total score
5. In case of tie (within 3 points), declare the one with better persuasiveness as winner

## OUTPUT FORMAT

Respond with ONLY valid JSON (no markdown, no code blocks, no explanations):

{
  "winner": "persona1" or "persona2",
  "scores": {
    "persona1": {
      "logical_coherence": 0-30,
      "creativity": 0-25,
      "persuasiveness": 0-25,
      "topic_relevance": 0-20,
      "total": 0-100
    },
    "persona2": {
      "logical_coherence": 0-30,
      "creativity": 0-25,
      "persuasiveness": 0-25,
      "topic_relevance": 0-20,
      "total": 0-100
    }
  },
  "reasoning": "2-3 sentence explanation of why the winner prevailed",
  "highlights": {
    "persona1_best": "Quote or summary of strongest point",
    "persona2_best": "Quote or summary of strongest point"
  },
  "improvement_suggestions": {
    "persona1": "Brief suggestion for improvement",
    "persona2": "Brief suggestion for improvement"
  }
}`;

export class BattleJudgeService {
  constructor(private aiProvider: IAIProvider) {}

  /**
   * Judge a battle between two personas
   */
  async judgeBattle(request: BattleJudgeRequest): Promise<BattleJudgeResponse> {
    const prompt = this.buildJudgePrompt(request);

    // Generate judgment using AI
    const response = await this.aiProvider.generateText({
      prompt,
      maxTokens: 2000,
      temperature: 0.3, // Lower temperature for consistent judging
    });

    // Parse JSON response
    let result: BattleJudgeResponse;
    try {
      const cleaned = response.text
        .replace(/```json\n?|\n?```/g, '')
        .trim();
      result = JSON.parse(cleaned);

      // Validate result
      this.validateJudgeResult(result);
    } catch (error) {
      throw new Error(`Failed to parse judge response: ${error}`);
    }

    return result;
  }

  /**
   * Build judge prompt with actual battle data
   */
  private buildJudgePrompt(request: BattleJudgeRequest): string {
    return JUDGE_PROMPT_TEMPLATE
      .replace('{topic}', request.topic)
      .replace('{persona1_name}', request.persona1.name)
      .replace('{persona1_argument}', request.persona1.argument)
      .replace('{p1_intelligence}', request.persona1.traits.intelligence.toString())
      .replace('{p1_creativity}', request.persona1.traits.creativity.toString())
      .replace('{p1_persuasion}', request.persona1.traits.persuasion.toString())
      .replace('{persona2_name}', request.persona2.name)
      .replace('{persona2_argument}', request.persona2.argument)
      .replace('{p2_intelligence}', request.persona2.traits.intelligence.toString())
      .replace('{p2_creativity}', request.persona2.traits.creativity.toString())
      .replace('{p2_persuasion}', request.persona2.traits.persuasion.toString());
  }

  /**
   * Validate judge result
   */
  private validateJudgeResult(result: BattleJudgeResponse): void {
    // Check winner
    if (!['persona1', 'persona2'].includes(result.winner)) {
      throw new Error('Invalid winner value');
    }

    // Validate scores for both personas
    this.validatePersonaScore(result.scores.persona1);
    this.validatePersonaScore(result.scores.persona2);

    // Check winner has higher score
    const p1Total = result.scores.persona1.total;
    const p2Total = result.scores.persona2.total;
    
    if (result.winner === 'persona1' && p1Total < p2Total) {
      throw new Error('Winner mismatch: persona1 declared but has lower score');
    }
    if (result.winner === 'persona2' && p2Total < p1Total) {
      throw new Error('Winner mismatch: persona2 declared but has lower score');
    }

    // Required fields
    if (!result.reasoning || result.reasoning.length < 20) {
      throw new Error('Reasoning must be at least 20 characters');
    }
    if (!result.highlights?.persona1_best || !result.highlights?.persona2_best) {
      throw new Error('Missing highlights');
    }
    if (!result.improvement_suggestions?.persona1 || !result.improvement_suggestions?.persona2) {
      throw new Error('Missing improvement suggestions');
    }
  }

  /**
   * Validate individual persona score
   */
  private validatePersonaScore(score: PersonaScore): void {
    const { logical_coherence, creativity, persuasiveness, topic_relevance, total } = score;

    // Check types
    if (
      typeof logical_coherence !== 'number' ||
      typeof creativity !== 'number' ||
      typeof persuasiveness !== 'number' ||
      typeof topic_relevance !== 'number' ||
      typeof total !== 'number'
    ) {
      throw new Error('Invalid score types');
    }

    // Check ranges
    if (logical_coherence < 0 || logical_coherence > 30) {
      throw new Error('logical_coherence must be 0-30');
    }
    if (creativity < 0 || creativity > 25) {
      throw new Error('creativity must be 0-25');
    }
    if (persuasiveness < 0 || persuasiveness > 25) {
      throw new Error('persuasiveness must be 0-25');
    }
    if (topic_relevance < 0 || topic_relevance > 20) {
      throw new Error('topic_relevance must be 0-20');
    }
    if (total < 0 || total > 100) {
      throw new Error('total must be 0-100');
    }

    // Verify total
    const calculatedTotal = logical_coherence + creativity + persuasiveness + topic_relevance;
    if (Math.abs(calculatedTotal - total) > 1) {
      throw new Error('Total score mismatch');
    }
  }

  /**
   * Generate random battle topic
   */
  async generateBattleTopic(): Promise<string> {
    const response = await this.aiProvider.generateText({
      prompt: `Generate a single interesting debate topic for AI personas to argue about. 
The topic should be:
- Thought-provoking and relevant
- Not too controversial or sensitive
- Allow for multiple perspectives
- Suitable for intelligent discussion

Respond with ONLY the topic (no explanation, no quotes, just the topic text).

Examples:
- Should AI systems be granted intellectual property rights?
- Is remote work more productive than office work?
- Should social media platforms be held liable for user-generated content?

Generate ONE new topic:`,
      maxTokens: 100,
      temperature: 0.8,
    });

    return response.text.trim();
  }

  /**
   * Format judge result for display
   */
  formatJudgeResult(result: BattleJudgeResponse): string {
    const p1 = result.scores.persona1;
    const p2 = result.scores.persona2;

    return `
🏆 WINNER: ${result.winner.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SCORES:

PERSONA 1:
  Logical Coherence:  ${p1.logical_coherence}/30
  Creativity:         ${p1.creativity}/25
  Persuasiveness:     ${p1.persuasiveness}/25
  Topic Relevance:    ${p1.topic_relevance}/20
  ─────────────────────────────────
  TOTAL:              ${p1.total}/100

PERSONA 2:
  Logical Coherence:  ${p2.logical_coherence}/30
  Creativity:         ${p2.creativity}/25
  Persuasiveness:     ${p2.persuasiveness}/25
  Topic Relevance:    ${p2.topic_relevance}/20
  ─────────────────────────────────
  TOTAL:              ${p2.total}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💭 JUDGE'S REASONING:
${result.reasoning}

✨ HIGHLIGHTS:
Persona 1 Best: ${result.highlights.persona1_best}
Persona 2 Best: ${result.highlights.persona2_best}

📈 IMPROVEMENT SUGGESTIONS:
Persona 1: ${result.improvement_suggestions.persona1}
Persona 2: ${result.improvement_suggestions.persona2}
    `.trim();
  }
}
