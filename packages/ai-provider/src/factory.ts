/**
 * AI Provider Factory
 * Creates appropriate AI provider based on configuration
 */

import { IAIProvider, AIProvider, AIProviderConfig } from './types';
import { BedrockProvider } from './providers/bedrock.provider';

/**
 * Create AI provider instance
 */
export function createAIProvider(config?: AIProviderConfig): IAIProvider {
  const provider = config?.provider || AIProvider.BEDROCK;

  switch (provider) {
    case AIProvider.BEDROCK:
      return new BedrockProvider({
        region: config?.region,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

    case AIProvider.MOCK:
      return new MockProvider();

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * Mock Provider for testing
 */
class MockProvider implements IAIProvider {
  async generateText(request: any) {
    return {
      text: 'Mock response',
      model: 'mock-model',
      usage: {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
      },
      finishReason: 'stop' as const,
    };
  }

  async generateImage(request: any) {
    return {
      imageUrl: 'https://via.placeholder.com/1024',
      base64: '',
      seed: 12345,
      model: 'mock-image-model',
    };
  }

  async countTokens(text: string) {
    return Math.ceil(text.length / 4);
  }
}

/**
 * Get default AI provider (Bedrock)
 */
export function getDefaultProvider(): IAIProvider {
  return createAIProvider();
}
