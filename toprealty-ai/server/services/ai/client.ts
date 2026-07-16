import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const provider = createOpenAICompatible({
  name: 'opencode-go',
  baseURL: 'https://opencode.ai/zen/go/v1',
  apiKey: process.env.OPENCODE_GO_API_KEY,
});

export const models = {
  flash: provider.chatModel('deepseek-v4-flash'),
  pro: provider.chatModel('deepseek-v4-pro'),
} as const;
