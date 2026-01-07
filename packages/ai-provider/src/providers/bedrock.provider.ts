/**
 * AWS Bedrock Provider - Primary AI Provider for AI_XANDRIA
 * Uses: Claude 3.5 Sonnet (text), Titan Image Generator (images)
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import {
  IAIProvider,
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  AIProviderError,
  RateLimitError,
  ContentFilterError,
} from '../types';

export class BedrockProvider implements IAIProvider {
  private client: BedrockRuntimeClient;
  private textModel: string;
  private imageModel: string;
  private region: string;

  constructor(config: {
    region?: string;
    textModel?: string;
    imageModel?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  } = {}) {
    this.region = config.region || process.env.AWS_REGION || 'us-east-1';
    this.textModel = config.textModel || 
      process.env.BEDROCK_TEXT_MODEL || 
      'anthropic.claude-3-5-sonnet-20240620-v1:0';
    this.imageModel = config.imageModel || 
      process.env.BEDROCK_IMAGE_MODEL || 
      'amazon.titan-image-generator-v1';

    this.client = new BedrockRuntimeClient({
      region: this.region,
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      } : undefined,
    });
  }

  /**
   * Generate text using Claude 3.5 Sonnet
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    try {
      // Prepare Bedrock request payload for Claude
      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP ?? 0.9,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        ...(request.systemPrompt && {
          system: request.systemPrompt,
        }),
        ...(request.stopSequences && {
          stop_sequences: request.stopSequences,
        }),
      };

      const input: InvokeModelCommandInput = {
        modelId: this.textModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      };

      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);

      // Parse response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Check for content filtering
      if (responseBody.stop_reason === 'content_filtered') {
        throw new ContentFilterError('bedrock', 'Content was filtered by safety policies');
      }

      // Extract text content
      const textContent = responseBody.content?.find((c: any) => c.type === 'text');
      if (!textContent) {
        throw new AIProviderError('No text content in response', 'bedrock');
      }

      return {
        text: textContent.text,
        model: this.textModel,
        usage: {
          inputTokens: responseBody.usage?.input_tokens || 0,
          outputTokens: responseBody.usage?.output_tokens || 0,
          totalTokens: (responseBody.usage?.input_tokens || 0) + (responseBody.usage?.output_tokens || 0),
        },
        finishReason: this.mapStopReason(responseBody.stop_reason),
        metadata: {
          id: responseBody.id,
          model: responseBody.model,
        },
      };
    } catch (error: any) {
      // Handle specific errors
      if (error.name === 'ThrottlingException') {
        throw new RateLimitError('bedrock', 60);
      }
      
      if (error instanceof ContentFilterError || error instanceof RateLimitError) {
        throw error;
      }

      throw new AIProviderError(
        `Bedrock text generation failed: ${error.message}`,
        'bedrock',
        error
      );
    }
  }

  /**
   * Generate image using Titan Image Generator
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const width = request.width || 1024;
      const height = request.height || 1024;

      // Validate dimensions (Titan supports: 512x512, 1024x1024)
      if (![512, 1024].includes(width) || ![512, 1024].includes(height)) {
        throw new AIProviderError(
          'Invalid dimensions. Titan supports 512x512 or 1024x1024',
          'bedrock'
        );
      }

      const payload = {
        taskType: 'TEXT_IMAGE',
        textToImageParams: {
          text: request.prompt,
          ...(request.negativePrompt && {
            negativeText: request.negativePrompt,
          }),
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          quality: 'premium',
          height,
          width,
          cfgScale: 8.0,
          ...(request.seed && { seed: request.seed }),
        },
      };

      const input: InvokeModelCommandInput = {
        modelId: this.imageModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      };

      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      if (!responseBody.images || responseBody.images.length === 0) {
        throw new AIProviderError('No images generated', 'bedrock');
      }

      const base64Image = responseBody.images[0];

      // In production, upload to S3 and return URL
      // For now, we return base64
      const imageUrl = `data:image/png;base64,${base64Image}`;

      return {
        imageUrl,
        base64: base64Image,
        seed: responseBody.seed || request.seed || 0,
        model: this.imageModel,
        metadata: {
          dimensions: { width, height },
        },
      };
    } catch (error: any) {
      if (error.name === 'ThrottlingException') {
        throw new RateLimitError('bedrock', 60);
      }

      if (error instanceof RateLimitError) {
        throw error;
      }

      throw new AIProviderError(
        `Bedrock image generation failed: ${error.message}`,
        'bedrock',
        error
      );
    }
  }

  /**
   * Count tokens (approximate for Claude)
   * Claude uses ~1.3 chars per token on average
   */
  async countTokens(text: string): Promise<number> {
    // Approximate token count
    // For production, use official tokenizer
    return Math.ceil(text.length / 3.5);
  }

  /**
   * Map Bedrock stop reasons to standard finish reasons
   */
  private mapStopReason(stopReason: string): 'stop' | 'length' | 'content_filter' {
    switch (stopReason) {
      case 'end_turn':
      case 'stop_sequence':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'content_filtered':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.generateText({
        prompt: 'Hello',
        maxTokens: 10,
      });
      return !!response.text;
    } catch {
      return false;
    }
  }
}
