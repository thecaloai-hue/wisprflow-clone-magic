import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen">
      <Toaster richColors position="top-center" />
      {/* Promo bar */}
      <div className="bg-promo px-4 py-2 text-center text-sm text-promo-foreground">
        How Clay's GTM team made 20% more customer calls a day.{" "}
        <Link to="/business" className="underline underline-offset-4">Read the case study →</Link>
      </div>

      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 text-center">
        <p className="mb-10 text-xs uppercase tracking-widest text-muted-foreground">Promo</p>
        <h1 className="text-display mx-auto max-w-5xl text-6xl md:text-8xl">
          <span className="italic text-muted-foreground">Don't type,</span>{" "}
          <span>just speak</span>
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground">
          The voice-to-text AI that turns speech into clear, polished writing in every app.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3">
          <Button asChild size="lg" className="h-12 rounded-full bg-lilac px-8 text-base text-lilac-foreground hover:bg-lilac/90">
            <Link to="/auth">Download for free</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Available on Mac, Windows, iPhone, and Android</p>
        </div>

        {/* Waveform pill */}
        <div className="mx-auto mt-20 inline-flex items-center justify-center gap-1 rounded-full border border-foreground/20 bg-background px-10 py-5">
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className="waveform-bar"
              style={{ animationDelay: `${i * 0.05}s`, height: `${6 + (i % 5) * 4}px` }}
            />
          ))}
        </div>
      </section>

      {/* What if section */}
      <section className="px-6 py-24 text-center">
        <h2 className="text-display mx-auto max-w-4xl text-5xl md:text-7xl">
          <span className="italic">What if</span> speaking was enough?
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground">
          Now, it is. Speak into any app you're already in, on any device you're already on.
          Your voice becomes the action. Everything else follows.
        </p>
        <div className="mt-10">
          <Button asChild size="lg" className="h-12 rounded-full bg-lilac px-8 text-lilac-foreground hover:bg-lilac/90">
            <Link to="/auth">Get started free</Link>
          </Button>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            { title: "4× faster than typing", body: "Speak at 220 words per minute. Flow keeps up." },
            { title: "AI-polished, instantly", body: "Removes ums, fixes grammar, adapts to tone — email, chat, notes, or code." },
            { title: "Works in every app", body: "Browser, docs, email, Slack, your IDE. If you can type there, Flow works there." },
            { title: "100+ languages", body: "Dictate in one language, get output in another." },
            { title: "Personal dictionary", body: "Names, brands, jargon — Flow learns them once." },
            { title: "Private by default", body: "Audio is processed securely and never sold." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-display text-2xl">{f.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl bg-promo px-8 py-20 text-center text-promo-foreground">
          <h2 className="text-display text-5xl md:text-6xl">
            <span className="italic">Speak.</span> Ship.
          </h2>
          <p className="mt-6 text-lg opacity-80">
            Stop typing in 2026. Start the conversation.
          </p>
          <Button asChild size="lg" className="mt-8 h-12 rounded-full bg-lilac px-8 text-lilac-foreground hover:bg-lilac/90">
            <Link to="/auth">Try Flow free</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
