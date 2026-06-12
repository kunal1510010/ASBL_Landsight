import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, isAuthed, CREDENTIALS } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthed()) navigate("/discover");
  }, [navigate]);

  function onSubmit() {
    if (login(email, password)) navigate("/discover");
    else setError("Invalid credentials. Try the prefilled demo login.");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 20%, white, transparent 60%)" }} />
        <div className="relative flex items-center gap-2">
          <img src="/asbl-logo.svg" alt="ASBL" className="h-8 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
          <span className="text-base font-bold opacity-80 tracking-wide">LandSight</span>
        </div>
        <div className="relative space-y-4 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">Discover, analyse and underwrite land parcels in minutes.</h1>
          <p className="opacity-80">
            Satellite scan for open land, 9-point feasibility dashboards, and a project simulator wired to ASBL's real
            portfolio cashflow.
          </p>
        </div>
        <div className="relative text-sm opacity-70">(c) {new Date().getFullYear()} ASBL - Prototype</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2">
            <img src="/asbl-logo.svg" alt="ASBL" className="h-6 w-auto" style={{ filter: "brightness(0)" }} />
            <span className="text-sm font-medium text-muted-foreground tracking-wide">LandSight</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">Use your ASBL credentials to continue.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input id="email" type="email" placeholder={CREDENTIALS.email} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive flex items-center gap-2">
                <Lock className="h-4 w-4" /> {error}
              </div>
            )}
            <Button className="w-full" onClick={onSubmit}>Sign in</Button>
            
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Demo only - <Link to="/discover" className="underline">skip to app</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
