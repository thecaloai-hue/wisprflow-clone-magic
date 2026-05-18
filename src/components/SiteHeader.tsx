import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-border bg-background/80 px-6 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex items-end gap-[2px] text-foreground">
            <span className="block h-3 w-[3px] rounded-sm bg-current" />
            <span className="block h-5 w-[3px] rounded-sm bg-current" />
            <span className="block h-2 w-[3px] rounded-sm bg-current" />
            <span className="block h-4 w-[3px] rounded-sm bg-current" />
          </span>
          <span className="text-display text-xl">Flow</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link to="/product" className="text-muted-foreground hover:text-foreground">Product</Link>
          <Link to="/individuals" className="text-muted-foreground hover:text-foreground">Individuals</Link>
          <Link to="/business" className="text-muted-foreground hover:text-foreground">Business</Link>
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/app">Open Flow</Link>
              </Button>
              <Button onClick={onSignOut} size="sm" className="rounded-full bg-lilac text-lilac-foreground hover:bg-lilac/90">
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-lilac text-lilac-foreground hover:bg-lilac/90">
                <Link to="/auth">Download for free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
