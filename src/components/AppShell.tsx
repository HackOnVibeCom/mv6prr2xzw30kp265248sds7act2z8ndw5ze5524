import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutGrid,
  Radio,
  BookOpen,
  Menu,
  X,
  Plus,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { CreateAdModal } from "@/components/CreateAdModal";
import { PaymentSandboxModal } from "@/components/PaymentSandboxModal";
import { getStoredSandboxPlan, PLANS, type PlanTier } from "@/lib/sandboxPlan";
import { useApps } from "@/lib/queries";
import type { App } from "@/lib/mockData";

const SIDEBAR_STORAGE_KEY = "ap-sidebar-collapsed";

function StatusDot({ status }: { status: App["status"] }) {
  const color =
    status === "active" ? "bg-green-300" : status === "idle" ? "bg-olive-200" : "bg-amber-200";
  const label = status === "active" ? "Active" : status === "idle" ? "Idle" : "Onboarding";
  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${color}`}
      role="img"
      aria-label={label}
      title={label}
    />
  );
}

/* ------------------------------------------------------------------- nav */

const NAV_BASE =
  "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-mint-100 dark:hover:bg-olive-500";
const NAV_ACTIVE = {
  className:
    "bg-mint-100 font-medium text-green-500 dark:bg-olive-500 dark:text-mint-200 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-green-400 dark:before:bg-mint-300",
};

const WORKSPACE_LINKS = [
  { to: "/apps", icon: LayoutGrid, label: "All apps", exact: true },
  { to: "/analytics", icon: BarChart3, label: "Analytics", exact: false },
  { to: "/docs", icon: BookOpen, label: "Integration docs", exact: false },
  { to: "/settings", icon: Settings, label: "Settings", exact: false },
] as const;

function NavLinks({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: appsResult } = useApps();
  const apps = appsResult?.data ?? [];

  // Apps the user created come first, under their own heading; the bundled
  // showcase apps sit below so the two are never confused for each other.
  const realApps = apps.filter((a) => !a.isDemo);
  const demoAppList = apps.filter((a) => a.isDemo);

  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      <div>
        {!collapsed && (
          <p className="px-3 text-[11px] font-semibold tracking-wide text-olive-300 uppercase dark:text-olive-200">
            Workspace
          </p>
        )}
        <ul className="mt-2 space-y-0.5">
          {WORKSPACE_LINKS.map(({ to, icon: Icon, label, exact }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                className={`${NAV_BASE} ${collapsed ? "justify-center px-2" : ""}`}
                activeOptions={{ exact }}
                activeProps={NAV_ACTIVE}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {collapsed ? <span className="sr-only">{label}</span> : label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {!collapsed && (
          <p className="px-3 text-[11px] font-semibold tracking-wide text-olive-300 uppercase dark:text-olive-200">
            Your apps
          </p>
        )}
        <ul className="mt-2 space-y-0.5">
          {realApps.map((a) => (
            <AppNavItem
              key={a.id}
              app={a}
              collapsed={collapsed}
              active={pathname.startsWith(`/apps/${a.id}`)}
              onNavigate={onNavigate}
            />
          ))}

          {realApps.length === 0 && !collapsed && (
            <li className="px-3 py-1.5 text-xs text-muted-fg">None yet</li>
          )}

          <li>
            <Link
              to="/apps"
              search={{ add: "true" }}
              onClick={onNavigate}
              title={collapsed ? "Connect an app" : undefined}
              className={`${NAV_BASE} text-green-500 dark:text-mint-200 ${
                collapsed ? "justify-center px-2" : ""
              }`}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {collapsed ? <span className="sr-only">Connect an app</span> : "Connect an app"}
            </Link>
          </li>
        </ul>
      </div>

      {demoAppList.length > 0 && (
        <div>
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold tracking-wide text-olive-300 uppercase dark:text-olive-200">
              Demo apps
            </p>
          )}
          <ul className="mt-2 space-y-0.5">
            {demoAppList.map((a) => (
              <AppNavItem
                key={a.id}
                app={a}
                collapsed={collapsed}
                active={pathname.startsWith(`/apps/${a.id}`)}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

function AppNavItem({
  app,
  collapsed,
  active,
  onNavigate,
}: {
  app: App;
  collapsed: boolean;
  active: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  return (
    <li>
      <Link
        to="/apps/$appId"
        params={{ appId: app.id }}
        onClick={onNavigate}
        title={collapsed ? app.name : undefined}
        aria-current={active ? "page" : undefined}
        className={`${NAV_BASE} ${collapsed ? "justify-center px-2" : ""} ${
          active ? NAV_ACTIVE.className : ""
        }`}
      >
        <StatusDot status={app.status} />
        {collapsed ? (
          <span className="sr-only">{app.name}</span>
        ) : (
          <span className="truncate">{app.name}</span>
        )}
      </Link>
    </li>
  );
}

/* -------------------------------------------------------------- app shell */

export function AppShell({
  children,
  title,
  liveAppId,
}: {
  children: ReactNode;
  title?: string;
  liveAppId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [sandboxPlan, setSandboxPlan] = useState<PlanTier>("builder");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setSandboxPlan(getStoredSandboxPlan());
  }, []);

  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Restore the desktop collapse preference. Read in an effect rather than in
  // useState so server and client render the same markup.
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the drawer and returns focus to the button that opened it.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Lock background scrolling while the drawer covers the screen.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Move focus into the drawer when it opens, so keyboard and screen-reader
  // users land on the navigation instead of staying behind the overlay.
  useEffect(() => {
    if (open) drawerRef.current?.focus();
  }, [open]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-2 px-4">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="ap-press inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-surface transition-colors hover:bg-mint-100 lg:hidden dark:hover:bg-olive-500"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          {/* Desktop sidebar collapse */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ap-press hidden h-9 w-9 items-center justify-center rounded-lg border bg-surface text-muted-fg transition-colors hover:bg-mint-100 lg:inline-flex dark:hover:bg-olive-500"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>

          <Link
            to="/"
            className="ml-1 rounded font-display text-sm font-bold tracking-tight transition-opacity hover:opacity-80"
          >
            AutoPromo<span className="text-green-400 dark:text-mint-300"> SDK</span>
          </Link>

          {title && (
            <span className="hidden min-w-0 truncate text-sm text-muted-fg sm:inline">
              · {title}
            </span>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="ap-press inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20"
              title="Click to manage Sandbox Subscription Plan"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{PLANS[sandboxPlan].badge}</span>
            </button>
            {liveAppId && (
              <Link
                to="/live/$appId"
                params={{ appId: liveAppId }}
                className="ap-press inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-green-500 transition-colors hover:bg-mint-100 dark:text-mint-200 dark:hover:bg-olive-500"
              >
                <Radio className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Live feed</span>
              </Link>
            )}
            <ConnectionBadge />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6">
        <aside
          className={`hidden shrink-0 transition-[width] duration-200 lg:block ${
            collapsed ? "w-14" : "w-56"
          }`}
        >
          <div className="sticky top-20">
            <NavLinks collapsed={collapsed} />
          </div>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              tabIndex={-1}
              className="absolute inset-0 bg-olive-600/50 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
            <div
              id="mobile-nav"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              tabIndex={-1}
              className="ap-enter absolute top-0 left-0 h-full w-64 overflow-y-auto border-r bg-background p-4 outline-none"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-sm font-bold">Menu</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="ap-press inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-mint-100 dark:hover:bg-olive-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
      <CreateAdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        defaultAppId={liveAppId}
      />
      <PaymentSandboxModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={sandboxPlan}
        onPlanChanged={(newPlan) => setSandboxPlan(newPlan)}
      />
    </div>
  );
}
