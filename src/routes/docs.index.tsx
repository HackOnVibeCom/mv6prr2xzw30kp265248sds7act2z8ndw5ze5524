import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { snippets } from "@/lib/mockData";

export const Route = createFileRoute("/docs/")({
  head: () => ({
    meta: [
      { title: "SDK integration guide — AutoPromo SDK" },
      {
        name: "description",
        content:
          "Install AutoPromo, initialise it with your API key, emit product events and open native share sheets in four short steps.",
      },
      { property: "og:title", content: "SDK integration guide — AutoPromo SDK" },
      {
        property: "og:description",
        content: "Copy-paste snippets to wire AutoPromo into your mobile app.",
      },
    ],
  }),
  component: DocsPage,
});

function DocsPage() {
  const [active, setActive] = useState(snippets[0]?.id ?? "");
  const snippet = snippets.find((s) => s.id === active) ?? snippets[0];

  return (
    <AppShell title="Integration docs">
      <h1 className="font-display text-3xl font-bold">Integration guide</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-fg">
        Four steps from install to your first ranked post. Every snippet is copy-paste ready.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {snippets.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={`ap-press rounded-lg border px-3 py-2 text-sm font-medium ${
              s.id === active
                ? "border-mint-400 bg-mint-100 dark:bg-olive-500"
                : "hover:bg-mint-100 dark:hover:bg-olive-500"
            }`}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {snippet && (
        <div className="mt-4 overflow-hidden rounded-xl border bg-surface">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="font-mono text-[11px] text-olive-300 dark:text-olive-200">
              {snippet.language}
            </span>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(snippet.code);
                toast.success("Snippet copied");
              }}
              className="rounded-lg border px-2 py-1 text-xs hover:bg-mint-100 dark:hover:bg-olive-500"
            >
              Copy
            </button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed">
            <code>{snippet.code}</code>
          </pre>
        </div>
      )}
    </AppShell>
  );
}
