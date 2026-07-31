import type { SVGProps } from "react";
import type { Platform } from "@/lib/mockData";

function Twitter(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 2.5h3.3l-7.2 8.2 8.5 11.3h-6.7l-5.2-6.9-6 6.9H2.3l7.7-8.8L1.9 2.5h6.9l4.7 6.3 5.4-6.3Zm-1.2 17.6h1.8L7.4 4.3H5.4l12.3 15.8Z" />
    </svg>
  );
}
function Reddit(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 11.8a2.3 2.3 0 0 0-3.9-1.6 11.3 11.3 0 0 0-5.6-1.7l1-4.4 3.1.7a1.8 1.8 0 1 0 .2-1.4l-3.8-.8a.7.7 0 0 0-.8.5l-1.2 5.4a11.3 11.3 0 0 0-5.6 1.7A2.3 2.3 0 1 0 3 15.4v.5C3 19 7 21.5 12 21.5s9-2.5 9-5.6v-.5a2.3 2.3 0 0 0 1-3.6ZM7.6 13.9a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm8.2 4.3c-1 1-2.5 1.2-3.8 1.2s-2.8-.2-3.8-1.2a.5.5 0 0 1 .7-.7c.7.7 2 1 3.1 1s2.4-.3 3.1-1a.5.5 0 1 1 .7.7Zm-.4-2.8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
  );
}
function WhatsApp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.2-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.2a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.2 5.3 5.3 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.5.6 2.1.7 2.9.6a2.5 2.5 0 0 0 1.6-1.2 2 2 0 0 0 .2-1.1c-.1-.2-.3-.2-.5-.3Z" />
    </svg>
  );
}
function LinkedIn(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0 0-5ZM3 9.5h4v11H3v-11Zm6.5 0h3.8v1.5h.05a4.2 4.2 0 0 1 3.75-2c4 0 4.75 2.5 4.75 5.8v5.7h-4v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7v5.1h-4v-11Z" />
    </svg>
  );
}

const map: Record<Platform, (p: SVGProps<SVGSVGElement>) => JSX.Element> = {
  Twitter,
  Reddit,
  WhatsApp,
  LinkedIn,
};

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const Icon = map[platform];
  return <Icon className={className ?? "h-4 w-4"} />;
}
