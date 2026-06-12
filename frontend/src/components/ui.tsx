/** Minimal styled primitives (no Radix) to keep the build lean. */
import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border bg-card shadow-sm", className)}>{children}</div>;
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-4 pt-4 pb-2", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("font-semibold text-sm", className)}>{children}</div>;
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-4 pb-4", className)}>{children}</div>;
}

type BtnVariant = "default" | "secondary" | "outline" | "ghost";
export function Button({
  variant = "default",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const styles: Record<BtnVariant, string> = {
    default: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-card border hover:bg-muted",
    outline: "border bg-transparent hover:bg-muted",
    ghost: "hover:bg-muted",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium px-4 py-2 transition-colors disabled:opacity-50 disabled:pointer-events-none",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  tone = "muted",
  children,
}: {
  tone?: "success" | "warning" | "muted" | "destructive";
  children: ReactNode;
}) {
  const styles = {
    success: "bg-success text-white",
    warning: "bg-warning text-foreground",
    muted: "bg-muted text-muted-foreground",
    destructive: "bg-destructive text-white",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", styles[tone])}>
      {children}
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium capitalize">{value}</div>
    </div>
  );
}

export function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {icon}
          </span>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
