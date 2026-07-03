// Minimal Resend sender via the REST API — no npm dependency (mirrors the
// dependency-free fetch pattern used for Telegram in lib/report-action.ts).
// RESEND_API_KEY is the same key configured as Supabase SMTP.

const FROM = "CI Treasure Hunt <hello@citreasurehunt.com>";

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: params.to,
        subject: params.subject,
        text: params.text,
      }),
    });
    if (!response.ok) {
      const payload = await response.text().catch(() => "");
      return { ok: false, error: `Resend ${response.status}: ${payload}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "send failed" };
  }
}
