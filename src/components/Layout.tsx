import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bookmark, CalendarDays, Compass, LayoutDashboard, LogOut, MessageSquare, Settings2, Shield, Sparkles, Target, UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar, buttonClass, cx } from "./ui";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-fg">
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-base text-accentfg">M</span>
      Mentoral
    </Link>
  );
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof Compass;
}

function useNavItems(): NavItem[] {
  const { isGuide, isAdmin } = useAuth();
  const items: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/browse", label: "Discover", icon: Compass },
    { to: "/bookings", label: "Sessions", icon: CalendarDays },
    { to: "/messages", label: "Messages", icon: MessageSquare },
  ];
  if (isGuide) items.push({ to: "/guide-settings", label: "My guide profile", icon: Settings2 });
  items.push({ to: "/goals", label: "Goals", icon: Target }, { to: "/saved", label: "Saved", icon: Bookmark });
  if (!isGuide) items.push({ to: "/become-guide", label: "Become a guide", icon: Sparkles });
  if (isAdmin) items.push({ to: "/admin", label: "Admin", icon: Shield });
  return items;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const items = useNavItems();
  const name = profile?.full_name || user?.email || "You";
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
      isActive ? "bg-accentsoft font-bold text-accent" : "font-medium hover:bg-surface2",
    );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside
        className="sticky top-0 hidden h-screen flex-col gap-2 border-r border-line bg-surface py-5 pr-3 md:flex"
        style={{ paddingLeft: "max(16px, env(safe-area-inset-left, 0px))" }}
      >
        <Logo />
        <nav className="mt-6 flex flex-col gap-0.5">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon className="size-[18px]" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 border-t border-line pt-3">
          <Link to="/account" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 hover:bg-surface2">
            <Avatar name={name} url={profile?.avatar_url} size={36} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{name}</span>
              <span className="block text-xs capitalize text-muted">{roles.includes("guide") ? "Guide" : "Learner"}</span>
            </span>
          </Link>
          <button
            aria-label="Sign out"
            className="rounded-lg p-2 hover:bg-surface2"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header
          className="gutter sticky z-20 flex items-center justify-between border-b border-line bg-surface py-2.5 md:hidden"
          style={{ top: "env(safe-area-inset-top, 0px)" }}
        >
          <Logo />
          <Link to="/account" aria-label="Account">
            <Avatar name={name} url={profile?.avatar_url} size={32} />
          </Link>
        </header>
        <main className="gutter pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">{children}</div>
        </main>
      </div>

      <nav
        className="gutter fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-surface pt-1.5 md:hidden"
        style={{ paddingBottom: "calc(6px + env(safe-area-inset-bottom, 0px))" }}
      >
        {[...items.slice(0, 4), { to: "/account", label: "More", icon: UserRound }].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cx("flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold", isActive ? "text-accent" : "text-muted")
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function PublicHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="gutter mx-auto flex max-w-6xl items-center justify-between gap-3 py-3">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/browse" className="hidden px-3 text-sm font-semibold hover:text-accent sm:block">
            Find a guide
          </Link>
          {user ? (
            <Link to="/dashboard" className={buttonClass("primary", "sm")}>Dashboard</Link>
          ) : (
            <>
              <Link to="/auth" className={buttonClass("ghost", "sm")}>Sign in</Link>
              <Link to="/auth?mode=signup" className={buttonClass("primary", "sm")}>Join free</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line">
      <div className="gutter mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 py-8 text-sm text-muted">
        <span>© {new Date().getFullYear()} Mentoral</span>
        <nav className="flex flex-wrap gap-4">
          <Link to="/about" className="hover:text-fg">About</Link>
          <Link to="/guidelines" className="hover:text-fg">Community guidelines</Link>
          <Link to="/privacy" className="hover:text-fg">Privacy</Link>
          <Link to="/terms" className="hover:text-fg">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}

/** Public pages (discover, guide profile) use the app shell when signed in. */
export function AdaptiveShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user) return <AppShell>{children}</AppShell>;
  return (
    <>
      <PublicHeader />
      <main className="gutter mx-auto flex max-w-6xl flex-col gap-6 py-8">{children}</main>
      <PublicFooter />
    </>
  );
}
