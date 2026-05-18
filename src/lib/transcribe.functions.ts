import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PolishInput = { text: string; mode: "default" | "email" | "message" | "note" | "code" };

const SYSTEM_BY_MODE: Record<PolishInput["mode"], string> = {
  default:
    "You polish raw voice-to-text dictation into clear, natural written text. Fix grammar, punctuation, capitalization, remove filler words (um, uh, like, you know), and remove repetitions. Preserve the speaker's meaning, voice, and tone. Respond with ONLY the polished text, no preamble.",
  email:
    "You convert raw voice dictation into a polished email. Use appropriate greeting and sign-off only if implied. Clear paragraphs, professional tone. Respond with ONLY the email body.",
  message:
    "You convert raw voice dictation into a concise chat message. Casual but clean. Remove fillers. Respond with ONLY the message.",
  note:
    "You convert raw voice dictation into clean bulleted notes. Group related thoughts. Respond with ONLY the notes in markdown.",
  code:
    "You convert raw voice dictation describing code into a clean technical description or code snippet. Use markdown code blocks where appropriate. Respond with ONLY the result.",
};

export const polishTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PolishInput) => {
    if (!input || typeof input.text !== "string") throw new Error("text required");
    if (input.text.length > 20000) throw new Error("text too long");
    const mode = (["default", "email", "message", "note", "code"] as const).includes(input.mode)
      ? input.mode
      : "default";
    return { text: input.text, mode };
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_BY_MODE[data.mode] },
          { role: "user", content: data.text },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      throw new Error("AI request failed");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const polished = json.choices?.[0]?.message?.content?.trim() ?? "";

    const word_count = data.text.trim().split(/\s+/).filter(Boolean).length;

    const { data: row, error } = await context.supabase
      .from("transcriptions")
      .insert({
        user_id: context.userId,
        raw_text: data.text,
        polished_text: polished,
        mode: data.mode,
        word_count,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      throw new Error("Failed to save transcription");
    }

    return { polished, transcription: row };
  });
