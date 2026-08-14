import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Consistent empty state for every list surface in the dashboard. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-mint-300 bg-mint-50 px-6 py-10 text-center dark:border-olive-400 dark:bg-olive-500">
      {Icon && (
        <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100 text-green-400 dark:bg-olive-400 dark:text-mint-200">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-display text-base font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-fg">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
