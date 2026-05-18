import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/business")({
  head: () => ({ meta: [{ title: "Business — Flow" }, { name: "description", content: "Flow for teams and enterprises." }] }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="px-6 py-24 text-center">
        <h1 className="text-display text-6xl md:text-7xl">
          <span className="italic text-muted-foreground">Talk less,</span> ship more
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          GTM, support, and engineering teams use Flow to move at the speed of thought.
        </p>
        <Button asChild size="lg" className="mt-8 h-12 rounded-full bg-lilac px-8 text-lilac-foreground hover:bg-lilac/90">
          <Link to="/auth">Talk to us</Link>
        </Button>
      </section>
      <SiteFooter />
    </div>
  ),
});
