import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing — Flow" }, { name: "description", content: "Simple Flow pricing." }] }),
  component: PricingPage,
});

function PricingPage() {
  const plans = [
    { name: "Free", price: "$0", desc: "Get started speaking", feats: ["2,000 words / week", "All AI modes", "History saved"] },
    { name: "Pro", price: "$15", desc: "For everyday creators", feats: ["Unlimited words", "Personal dictionary", "Priority models"] },
    { name: "Team", price: "$25", desc: "Per seat, billed yearly", feats: ["Shared dictionary", "Admin controls", "SSO & audit logs"] },
  ];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="px-6 py-20 text-center">
        <h1 className="text-display text-6xl md:text-7xl">
          <span className="italic text-muted-foreground">Simple</span> pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Free forever. Upgrade when you need more.</p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className="flex flex-col rounded-3xl border border-border bg-card p-8">
            <h3 className="text-display text-3xl">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-6 text-display text-5xl">{p.price}<span className="text-base text-muted-foreground">/mo</span></div>
            <ul className="mt-6 space-y-2 text-sm">
              {p.feats.map((f) => <li key={f}>• {f}</li>)}
            </ul>
            <Button asChild className="mt-auto pt-6 rounded-full bg-lilac text-lilac-foreground hover:bg-lilac/90">
              <Link to="/auth">Choose {p.name}</Link>
            </Button>
          </div>
        ))}
      </section>
      <SiteFooter />
    </div>
  );
}
