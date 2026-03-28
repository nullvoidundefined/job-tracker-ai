import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
    __mockCreate: mockCreate,
  };
});
vi.mock('app/utils/logs/logger.js', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Import after mocks are set up
const { callClaude } = await import('app/services/anthropic.service.js');
const { __mockCreate } = (await import('@anthropic-ai/sdk')) as unknown as {
  __mockCreate: ReturnType<typeof vi.fn>;
};

describe('anthropic service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns text content from Claude response', async () => {
    __mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"title":"Engineer"}' }],
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    const result = await callClaude('system prompt', 'user prompt');
    expect(result).toBe('{"title":"Engineer"}');
    expect(__mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-20250514',
        system: 'system prompt',
        messages: [{ role: 'user', content: 'user prompt' }],
      }),
    );
  });

  it('throws when no text content in response', async () => {
    __mockCreate.mockResolvedValueOnce({
      content: [],
      usage: { input_tokens: 10, output_tokens: 0 },
    });

    await expect(callClaude('sys', 'user')).rejects.toThrow(
      'No text content in Anthropic response',
    );
  });
});
