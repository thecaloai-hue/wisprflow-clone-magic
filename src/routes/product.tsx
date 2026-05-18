import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/product")({
  head: () => ({ meta: [{ title: "Product — Flow" }, { name: "description", content: "Flow's voice-to-text features." }] }),
  component: ProductPage,
});

function ProductPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="px-6 py-24 text-center">
        <h1 className="text-display text-6xl md:text-7xl">
          <span className="italic text-muted-foreground">A voice</span> for every app
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Flow lives in the background. Hold a shortcut, speak, release — your words appear, polished, wherever your cursor is.
        </p>
        <Button asChild size="lg" className="mt-8 h-12 rounded-full bg-lilac px-8 text-lilac-foreground hover:bg-lilac/90">
          <Link to="/auth">Get Flow free</Link>
        </Button>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-2">
        {[
          { t: "Smart formatting", b: "Bullets, paragraphs, code fences — formatted as you speak." },
          { t: "Tone-aware modes", b: "Switch between Email, Message, Note, and Code in a click." },
          { t: "Auto-edit", b: "Removes filler words, repetitions, and grammar slips automatically." },
          { t: "Multilingual", b: "Dictate in any of 100+ languages and translate on the fly." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-display text-2xl">{f.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.b}</p>
          </div>
        ))}
      </section>
      <SiteFooter />
    </div>
  );
}
