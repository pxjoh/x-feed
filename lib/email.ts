import { Resend } from 'resend';
import type { Tweet } from './twitter';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// NOTE: The 'from' address must use a domain verified in your Resend dashboard.
// Verify prophetexchange.com at resend.com/domains, or use onboarding@resend.dev for testing.
const FROM_EMAIL = 'X Feed <noreply@prophetexchange.com>';
const TO_EMAIL = 'john.abbey@prophetexchange.com';

export async function sendTweetEmail(original: Tweet, rephrased: string): Promise<void> {
  const resend = getResend();
  const time = new Date(original.created_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: `New tweet from @${original.author.handle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          ${original.author.avatar_url ? `<img src="${original.author.avatar_url}" style="width:48px;height:48px;border-radius:50%" />` : ''}
          <div>
            <strong style="font-size:16px">${original.author.name}</strong>
            <div style="color:#666;font-size:14px">@${original.author.handle} &middot; ${time}</div>
          </div>
        </div>

        <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:16px">
          <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Original</div>
          <p style="margin:0;font-size:15px;line-height:1.5;color:#18181b">${original.text}</p>
        </div>

        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px">
          <div style="font-size:11px;font-weight:600;color:#3b82f6;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Rephrased</div>
          <p style="margin:0;font-size:15px;line-height:1.5;color:#18181b">${rephrased}</p>
        </div>

        <div style="margin-top:16px;font-size:12px;color:#a1a1aa;text-align:center">
          ${original.metrics.likes.toLocaleString()} likes &middot; ${original.metrics.retweets.toLocaleString()} retweets &middot; ${original.metrics.replies.toLocaleString()} replies
        </div>
      </div>
    `,
  });
}
