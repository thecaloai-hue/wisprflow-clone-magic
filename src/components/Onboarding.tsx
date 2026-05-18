import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Sparkles, ShieldCheck, X } from "lucide-react";

type Props = { onComplete: () => void };

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<0 | 1>(0);
  const [requesting, setRequesting] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    // Pre-check existing permission state (non-blocking)
    (async () => {
      try {
        if (navigator.permissions) {
          const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
          if (status.state === "granted") setGranted(true);
          if (status.state === "denied") setMicError("Microphone is blocked. Enable it in your browser settings to continue.");
        }
      } catch {
        /* Safari: permissions API may not support 'microphone' — ignore */
      }
    })();
  }, []);

  const requestMic = async () => {
    setMicError(null);
    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately release — we just needed permission.
      stream.getTracks().forEach((t) => t.stop());
      setGranted(true);
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name ?? "";
      if (name === "NotAllowedError") setMicError("Permission denied. Allow microphone access in your browser settings.");
      else if (name === "NotFoundError") setMicError("No microphone was detected on this device.");
      else if (name === "NotReadableError") setMicError("Your microphone is in use by another app.");
      else setMicError("Could not access the microphone. Please try again.");
    } finally {
      setRequesting(false);
    }
  };

  const finish = () => {
    try { localStorage.setItem("flow_onboarded", "1"); } catch { /* ignore */ }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-6 py-10 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <button
          onClick={finish}
          aria-label="Skip"
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        {step === 0 ? (
          <>
            <h2 className="text-display text-3xl">
              <span className="italic text-muted-foreground">Welcome to</span> Flow
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Speak naturally — Flow listens, transcribes, and polishes your words into clear writing.
            </p>

            <div className="mt-6 space-y-4">
              <Step icon={<Mic className="h-4 w-4" />} title="1. Press the mic" desc="Tap the lilac mic button and start talking. Live transcription appears as you speak." />
              <Step icon={<Sparkles className="h-4 w-4" />} title="2. Polish with AI" desc="Pick a mode (email, message, note, code) and let AI rewrite it cleanly in your voice." />
              <Step icon={<ShieldCheck className="h-4 w-4" />} title="3. Private by default" desc="Your transcripts are stored only in your account. You can delete them anytime." />
            </div>

            <Button
              onClick={() => setStep(1)}
              className="mt-8 h-11 w-full rounded-full bg-lilac text-lilac-foreground hover:bg-lilac/90"
            >
              Continue
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-display text-3xl">
              Enable your <span className="italic text-muted-foreground">microphone</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Flow needs access to your microphone to transcribe what you say. Audio is processed in your browser — nothing is uploaded unless you save a transcript.
            </p>

            <div className="mt-6 flex items-center justify-center rounded-2xl bg-background py-10">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full ${granted ? "bg-emerald-500/15 text-emerald-600" : "bg-lilac/20 text-lilac"}`}>
                <Mic className="h-9 w-9" />
              </div>
            </div>

            {micError && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {micError}
              </div>
            )}

            {!granted ? (
              <Button
                onClick={requestMic}
                disabled={requesting}
                className="mt-6 h-11 w-full rounded-full bg-lilac text-lilac-foreground hover:bg-lilac/90"
              >
                {requesting ? "Requesting…" : "Allow microphone"}
              </Button>
            ) : (
              <Button
                onClick={finish}
                className="mt-6 h-11 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
              >
                Start using Flow
              </Button>
            )}

            <button
              onClick={finish}
              className="mt-3 block w-full text-center text-xs text-muted-foreground underline underline-offset-4"
            >
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Step({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-background p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lilac/15 text-lilac">{icon}</div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
