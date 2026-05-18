import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/individuals")({
  head: () => ({ meta: [{ title: "Individuals — Flow" }, { name: "description", content: "Flow for writers, students, founders." }] }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="px-6 py-24 text-center">
        <h1 className="text-display text-6xl md:text-7xl">
          <span className="italic text-muted-foreground">Your second</span> brain, out loud
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Writers, students, founders, and creators use Flow to think faster than they can type.
        </p>
        <Button asChild size="lg" className="mt-8 h-12 rounded-full bg-lilac px-8 text-lilac-foreground hover:bg-lilac/90">
          <Link to="/auth">Start free</Link>
        </Button>
      </section>
      <SiteFooter />
    </div>
  ),
});
