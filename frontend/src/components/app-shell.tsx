import { type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ScanSearch, LayoutGrid, Calculator, LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import { cn } from "./ui";

const NAV = [
  { to: "/discover", label: "Discover", icon: ScanSearch },
  { to: "/analyze", label: "Analyse", icon: LayoutGrid },
  { to: "/simulate", label: "Simulate", icon: Calculator },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/discover" className="flex items-center gap-2.5">
            <img src="/asbl-logo.svg" alt="ASBL" className="h-6 w-auto" style={{ filter: "brightness(0)" }} />
            <span className="text-sm font-medium text-muted-foreground tracking-wide">LandSight</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm",
                    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                  )
                }
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </NavLink>
            ))}
          </nav>
          <button
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
