import Anthropic from '@anthropic-ai/sdk';
import type { Tweet } from './twitter';

const client = new Anthropic();

export async function rephraseWithClaude(tweet: Tweet): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Rephrase this tweet from @${tweet.author.handle} using fresh language while keeping all key facts and information intact. Keep it under 280 characters. Return only the rephrased text, nothing else.

Original:
"${tweet.text}"`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== 'text') return tweet.text;
  return block.text.trim();
}
