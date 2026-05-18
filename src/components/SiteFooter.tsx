import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <div className="text-display text-2xl">Flow</div>
          <p className="mt-3 text-sm text-muted-foreground">The voice-to-text AI for every app.</p>
        </div>
        <div>
          <h4 className="text-sm font-medium">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/product">Features</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/business">Business</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-medium">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/individuals">Individuals</Link></li>
            <li><Link to="/business">Business</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-medium">Get started</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth">Sign up</Link></li>
            <li><Link to="/app">Open Flow</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Flow — A Wispr Flow-inspired clone.
      </div>
    </footer>
  );
}
