import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { polishTranscript } from "@/lib/transcribe.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Mic, Square, Copy, Trash2, Sparkles, LogOut } from "lucide-react";
import { Onboarding } from "@/components/Onboarding";

export const Route = createFileRoute("/app")({ component: AppPage });

type Mode = "default" | "email" | "message" | "note" | "code";
type TxRow = {
  id: string;
  raw_text: string;
  polished_text: string | null;
  mode: Mode;
  word_count: number | null;
  created_at: string;
};

// Browser SpeechRecognition typings (minimal)
type SR = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string; }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

function AppPage() {
  const router = useRouter();
  const polish = useServerFn(polishTranscript);

  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [raw, setRaw] = useState("");
  const [polished, setPolished] = useState("");
  const [mode, setMode] = useState<Mode>("default");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<TxRow[]>([]);
  const [supported, setSupported] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem("flow_onboarded")) setShowOnboarding(true);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.navigate({ to: "/auth" });
      } else {
        setEmail(data.session.user.email ?? "");
        setAuthChecked(true);
        loadHistory();
      }
    });
  }, [router]);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) { setSupported(false); return; }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0].transcript;
        if (res.isFinal) finalChunk += txt + " "; else interimChunk += txt;
      }
      if (finalChunk) setRaw((p) => (p + finalChunk).replace(/\s+/g, " ").trimStart());
      setInterim(interimChunk);
    };
    rec.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") toast.error("Mic error: " + e.error);
    };
    rec.onend = () => setRecording(false);
    recRef.current = rec;
  }, []);

  async function loadHistory() {
    const { data, error } = await supabase
      .from("transcriptions")
      .select("id, raw_text, polished_text, mode, word_count, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) { console.error(error); return; }
    setHistory((data ?? []) as TxRow[]);
  }

  const start = () => {
    if (!recRef.current) return;
    setInterim("");
    try { recRef.current.start(); setRecording(true); } catch { /* already started */ }
  };
  const stop = () => { recRef.current?.stop(); setRecording(false); };

  const onPolish = async () => {
    const text = (raw + " " + interim).trim();
    if (!text) { toast.error("Nothing to polish yet"); return; }
    setBusy(true);
    try {
      const result = await polish({ data: { text, mode } });
      setPolished(result.polished);
      toast.success("Polished with AI");
      loadHistory();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Polish failed");
    } finally {
      setBusy(false);
    }
  };

  const clear = () => { setRaw(""); setInterim(""); setPolished(""); };

  const copy = async (txt: string) => {
    await navigator.clipboard.writeText(txt);
    toast.success("Copied to clipboard");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("transcriptions").delete().eq("id", id);
    if (error) { toast.error("Could not delete"); return; }
    setHistory((h) => h.filter((r) => r.id !== id));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  if (!authChecked) return null;

  const liveText = (raw + " " + interim).trim();
  const wordCount = liveText ? liveText.split(/\s+/).length : 0;

  return (
    <div className="min-h-screen">
      <Toaster richColors position="top-center" />
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex items-end gap-[2px]">
              <span className="block h-3 w-[3px] rounded-sm bg-foreground" />
              <span className="block h-5 w-[3px] rounded-sm bg-foreground" />
              <span className="block h-2 w-[3px] rounded-sm bg-foreground" />
              <span className="block h-4 w-[3px] rounded-sm bg-foreground" />
            </span>
            <span className="text-display text-xl">Flow</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-display text-4xl md:text-5xl">
          <span className="italic text-muted-foreground">Hold the mic.</span> Speak freely.
        </h1>
        <p className="mt-2 text-muted-foreground">Flow turns your voice into polished text — instantly.</p>

        {!supported && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            Your browser does not support live voice input. Use Chrome, Edge, or Safari, or paste text below and polish with AI.
          </div>
        )}

        {/* Recorder */}
        <div className="mt-8 rounded-3xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(["default", "email", "message", "note", "code"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-full border px-3 py-1 text-sm capitalize transition ${
                    mode === m ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">{wordCount} words</div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 rounded-2xl bg-background py-8">
            {!recording ? (
              <Button onClick={start} className="h-14 w-14 rounded-full bg-lilac p-0 text-lilac-foreground hover:bg-lilac/90">
                <Mic className="h-6 w-6" />
              </Button>
            ) : (
              <Button onClick={stop} className="h-14 w-14 rounded-full bg-destructive p-0 text-destructive-foreground hover:bg-destructive/90">
                <Square className="h-5 w-5" />
              </Button>
            )}
            <div className="flex h-12 items-center gap-[3px] text-foreground/60">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className={recording ? "waveform-bar" : "inline-block w-[3px] rounded-sm bg-current"}
                  style={recording ? { animationDelay: `${i * 0.06}s`, height: `${6 + (i % 5) * 4}px` } : { height: "6px" }}
                />
              ))}
            </div>
          </div>

          <Textarea
            value={(raw + (interim ? " " + interim : "")).trim()}
            onChange={(e) => { setRaw(e.target.value); setInterim(""); }}
            placeholder="Press the mic and start speaking, or type/paste text here…"
            rows={5}
            className="mt-4 resize-none rounded-xl border-border bg-background"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={onPolish} disabled={busy || !(raw + interim).trim()} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              <Sparkles className="mr-2 h-4 w-4" />
              {busy ? "Polishing…" : "Polish with AI"}
            </Button>
            <Button variant="outline" onClick={() => copy((raw + " " + interim).trim())} disabled={!(raw + interim).trim()} className="rounded-full">
              <Copy className="mr-2 h-4 w-4" /> Copy raw
            </Button>
            <Button variant="ghost" onClick={clear} disabled={!(raw + interim + polished)} className="rounded-full">
              <Trash2 className="mr-2 h-4 w-4" /> Clear
            </Button>
          </div>

          {polished && (
            <div className="mt-6 rounded-2xl border border-accent bg-accent/30 p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium">AI-polished ({mode})</div>
                <Button size="sm" variant="ghost" onClick={() => copy(polished)} className="rounded-full">
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
              </div>
              <div className="whitespace-pre-wrap text-sm">{polished}</div>
            </div>
          )}
        </div>

        {/* History */}
        <section className="mt-12">
          <h2 className="text-display text-3xl">History</h2>
          {history.length === 0 ? (
            <p className="mt-4 text-muted-foreground">No transcriptions yet. Press the mic to start.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {history.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(r.created_at).toLocaleString()} · {r.mode} · {r.word_count ?? 0} words
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => copy(r.polished_text || r.raw_text)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {r.polished_text && (
                    <div className="whitespace-pre-wrap text-sm">{r.polished_text}</div>
                  )}
                  <details className="mt-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Show raw transcript</summary>
                    <div className="mt-2 whitespace-pre-wrap">{r.raw_text}</div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
