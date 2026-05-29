import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, Square, Loader2, X, Sparkles } from "lucide-react";
import { polishTranscript } from "@/lib/transcribe.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SR = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

type State = "idle" | "listening" | "polishing";

const LS_POS = "flow_mic_pos";

function getDefaultPos() {
  if (typeof window === "undefined") return { x: 20, y: 400 };
  return { x: window.innerWidth - 80, y: window.innerHeight - 120 };
}

function getActiveEditable(): HTMLInputElement | HTMLTextAreaElement | HTMLElement | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return null;
  if (el.tagName === "TEXTAREA") return el as HTMLTextAreaElement;
  if (el.tagName === "INPUT") {
    const type = (el as HTMLInputElement).type;
    if (["text", "search", "email", "url", "tel", "password", ""].includes(type)) {
      return el as HTMLInputElement;
    }
  }
  if (el.isContentEditable) return el;
  return null;
}

function insertIntoTarget(target: HTMLElement, text: string) {
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
    const input = target as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    const sep = before && !/\s$/.test(before) ? " " : "";
    const next = before + sep + text + after;
    const proto = target.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter?.call(input, next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const pos = (before + sep + text).length;
    input.setSelectionRange?.(pos, pos);
    input.focus();
  } else if (target.isContentEditable) {
    target.focus();
    document.execCommand("insertText", false, text);
  }
}

export function FloatingMic() {
  const polish = useServerFn(polishTranscript);
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<State>("idle");
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(getDefaultPos);
  const [transcript, setTranscript] = useState("");
  const [polished, setPolished] = useState("");

  const recRef = useRef<SR | null>(null);
  const draggingRef = useRef(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(LS_POS);
      if (raw) setPos(JSON.parse(raw));
    } catch { /* ignore */ }
    try {
      setHidden(localStorage.getItem("flow_mic_hidden") === "1");
    } catch { /* ignore */ }

    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setAuthed(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const w = window as unknown as {
      SpeechRecognition?: new () => SR;
      webkitSpeechRecognition?: new () => SR;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0].transcript;
        if (res.isFinal) finalText += txt + " ";
        else interim += txt;
      }
      setTranscript((finalText + interim).replace(/\s+/g, " ").trim());
    };
    rec.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        toast.error("Mic: " + e.error);
      }
    };
    rec.onend = () => {
      const text = finalText.trim();
      finalText = "";
      if (text) {
        handlePolish(text);
      } else {
        setState("idle");
      }
    };
    recRef.current = rec;
  }, [mounted]);

  const handlePolish = useCallback(
    async (raw: string) => {
      setState("polishing");
      try {
        const { polished: out } = await polish({ data: { text: raw, mode: "default" } });
        setPolished(out);
        const target = targetRef.current;
        if (target && document.body.contains(target)) {
          insertIntoTarget(target, out);
          toast.success("Pasted into field");
          setTimeout(() => {
            setOpen(false);
            setTranscript("");
            setPolished("");
            setState("idle");
          }, 800);
          return;
        }
        try {
          await navigator.clipboard.writeText(out);
          toast.success("Copied to clipboard");
        } catch {
          /* ignore */
        }
        setState("idle");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Polish failed");
        setState("idle");
      }
    },
    [polish],
  );

  const startListening = () => {
    if (!recRef.current) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    targetRef.current = getActiveEditable();
    setTranscript("");
    setPolished("");
    setOpen(true);
    try {
      recRef.current.start();
      setState("listening");
    } catch {
      /* already started */
    }
  };

  const stopListening = () => {
    recRef.current?.stop();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    movedRef.current = false;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    const nx = Math.max(8, Math.min(window.innerWidth - 64, e.clientX - dragOffset.current.x));
    const ny = Math.max(8, Math.min(window.innerHeight - 64, e.clientY - dragOffset.current.y));
    if (Math.abs(nx - pos.x) > 3 || Math.abs(ny - pos.y) > 3) movedRef.current = true;
    setPos({ x: nx, y: ny });
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    try { localStorage.setItem(LS_POS, JSON.stringify(pos)); } catch { /* ignore */ }
    if (!movedRef.current) {
      if (state === "listening") stopListening();
      else if (state === "idle") startListening();
    }
  };

  if (!mounted || !authed || hidden) return null;

  return (
    <>
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ left: pos.x, top: pos.y, touchAction: "none" }}
        aria-label="Flow voice input"
        className={`fixed z-[9998] flex h-14 w-14 items-center justify-center rounded-full shadow-lg ring-1 ring-black/10 transition-transform active:scale-95 ${
          state === "listening"
            ? "bg-destructive text-destructive-foreground animate-pulse"
            : state === "polishing"
              ? "bg-foreground text-background"
              : "bg-lilac text-lilac-foreground hover:scale-105"
        }`}
      >
        {state === "polishing" ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : state === "listening" ? (
          <Square className="h-5 w-5" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>

      {open && (
        <div
          style={{
            left: Math.min(pos.x, window.innerWidth - 312),
            top: Math.max(8, pos.y - 200),
          }}
          className="fixed z-[9999] w-[300px] rounded-2xl border border-border bg-card p-4 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              {state === "listening" ? (
                <>
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
                  Listening…
                </>
              ) : state === "polishing" ? (
                <>
                  <Sparkles className="h-4 w-4" /> Polishing with AI…
                </>
              ) : (
                <>Flow</>
              )}
            </div>
            <button
              onClick={() => {
                if (state === "listening") recRef.current?.stop();
                setOpen(false);
                setTranscript("");
                setPolished("");
                setState("idle");
              }}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-[60px] rounded-md bg-background p-2 text-sm">
            {polished || transcript || (
              <span className="text-muted-foreground">
                Speak now — Flow will clean it up and paste it into your focused field.
              </span>
            )}
          </div>

          {!targetRef.current && polished && (
            <p className="mt-2 text-xs text-muted-foreground">
              No input was focused — text copied to clipboard.
            </p>
          )}

          <div className="mt-3 flex justify-between text-xs">
            <button
              onClick={() => {
                try { localStorage.setItem("flow_mic_hidden", "1"); } catch { /* ignore */ }
                setHidden(true);
                setOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Hide button
            </button>
            {state === "listening" && (
              <button
                onClick={stopListening}
                className="rounded-full bg-foreground px-3 py-1 text-background"
              >
                Stop & polish
              </button>
            )}
          </div>
        </div>
      )}

      {!supported && open && (
        <div className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground">
          Voice input not supported in this browser. Use Chrome on Android.
        </div>
      )}
    </>
  );
}
