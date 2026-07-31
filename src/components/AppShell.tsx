import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutGrid, Radio, BookOpen, Menu, X, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apps } from "@/lib/mockData";

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active" ? "bg-green-300" : status === "idle" ? "bg-olive-200" : "bg-amber-200";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} aria-hidden="true" />;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-6">
      <div>
        <p className="px-3 text-[11px] font-semibold tracking-wide text-olive-300 uppercase dark:text-olive-200">
          Workspace
        </p>
        <ul className="mt-2 space-y-0.5">
          <li>
            <Link
              to="/apps"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-mint-100 dark:hover:bg-olive-500"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-mint-100 font-medium dark:bg-olive-500" }}
            >
              <LayoutGrid className="h-4 w-4" />
              All apps
            </Link>
          </li>
          <li>
            <Link
              to="/docs"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-mint-100 dark:hover:bg-olive-500"
              activeProps={{ className: "bg-mint-100 font-medium dark:bg-olive-500" }}
            >
              <BookOpen className="h-4 w-4" />
              Integration docs
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <p className="px-3 text-[11px] font-semibold tracking-wide text-olive-300 uppercase dark:text-olive-200">
          Connected apps
        </p>
        <ul className="mt-2 space-y-0.5">
          {apps.map((a) => {
            const active = pathname.startsWith(`/apps/${a.id}`);
            return (
              <li key={a.id}>
                <Link
                  to="/apps/$appId"
                  params={{ appId: a.id }}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-mint-100 dark:hover:bg-olive-500 ${
                    active ? "bg-mint-100 font-medium dark:bg-olive-500" : ""
                  }`}
                >
                  <StatusDot status={a.status} />
                  <span className="truncate">{a.name}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              to="/apps"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-green-500 hover:bg-mint-100 dark:text-mint-200 dark:hover:bg-olive-500"
            >
              <Plus className="h-4 w-4" />
              Connect an app
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={open}
            className="ap-press inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-surface lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link to="/" className="font-display text-sm font-bold tracking-tight">
            AutoPromo<span className="text-green-400 dark:text-mint-300"> SDK</span>
          </Link>

          {title && (
            <span className="hidden truncate text-sm text-muted-fg sm:inline">· {title}</span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {liveAppId && (
              <Link
                to="/live/$appId"
                params={{ appId: liveAppId }}
                className="ap-press inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-green-500 hover:bg-mint-100 dark:text-mint-200 dark:hover:bg-olive-500"
              >
                <Radio className="h-4 w-4" />
                <span className="hidden sm:inline">Live feed</span>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20">
            <NavLinks />
          </div>
        </aside>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-olive-600/50"
              onClick={() => setOpen(false)}
            />
            <div className="ap-enter absolute top-0 left-0 h-full w-64 overflow-y-auto border-r bg-background p-4">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
