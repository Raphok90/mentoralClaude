import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { BadgeCheck, Loader2, Star } from "lucide-react";
import type { ApplicationStatus, BookingStatus, GuideType } from "../lib/types";
import { GUIDE_TYPES } from "../lib/constants";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "ghost" | "soft" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accentfg hover:brightness-110",
  ghost: "border border-line bg-transparent hover:bg-surface2",
  soft: "bg-accentsoft text-accent hover:brightness-105",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; loading?: boolean }) {
  const sizes = { sm: "px-3 py-1.5 text-[13px]", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-[15px]" };
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export const buttonClass = (variant: Variant = "primary", size: "sm" | "md" | "lg" = "md") =>
  cx(
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition",
    variants[variant],
    { sm: "px-3 py-1.5 text-[13px]", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-[15px]" }[size],
  );

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("min-w-0 rounded-xl border border-line bg-surface p-5", className)}>{children}</div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx("input", p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea rows={3} {...p} className={cx("input min-h-[84px] resize-y", p.className)} />
);
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx("input", p.className)} />;

/** Multi-select chips. */
export function ChipPicker({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cx(
              "rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
              on ? "border-accent bg-accent text-accentfg" : "border-line bg-surface hover:bg-surface2",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export const Chip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-surface2 px-2.5 py-1 text-[12.5px] font-medium">{children}</span>
);

const statusStyles: Record<string, string> = {
  pending: "text-warn bg-warn/15",
  accepted: "text-info bg-info/15",
  completed: "text-accent bg-accentsoft",
  approved: "text-accent bg-accentsoft",
  declined: "text-muted bg-surface2",
  cancelled: "text-muted bg-surface2",
  rejected: "text-muted bg-surface2",
};
export function StatusPill({ status }: { status: BookingStatus | ApplicationStatus }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", statusStyles[status])}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export const TypeTag = ({ type }: { type: GuideType }) => (
  <span className="rounded-md bg-surface2 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">{GUIDE_TYPES[type].label}</span>
);

export const Verified = () => (
  <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent">
    <BadgeCheck className="size-4" /> Verified
  </span>
);

export function Rating({ avg, count }: { avg: number; count: number }) {
  if (!count) return <span className="text-[13px] text-muted">New guide</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[13px]">
      <Star className="size-4 fill-gold text-gold" />
      <b className="tabular-nums">{Number(avg).toFixed(1)}</b>
      <span className="text-muted">({count})</span>
    </span>
  );
}

export function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = [...(name || "?")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  if (url) return <img src={url} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-display font-semibold text-fg"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${hue} 40% 50% / 0.28)` }}
    >
      {initials}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line p-8 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  );
}

export const Spinner = () => (
  <div className="grid place-items-center p-10 text-muted">
    <Loader2 className="size-6 animate-spin" />
  </div>
);

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export { cx };
