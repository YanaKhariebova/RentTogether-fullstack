import type { ReactNode } from 'react';

const paths = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="0.8" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="0.8" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="0.8" />
      <rect x="14" y="14" width="6.5" height="6.5" rx="0.8" />
    </>
  ),
  heart: (
    <path d="M20.5 4.9a5.3 5.3 0 0 0-7.5 0l-1 1-1-1a5.3 5.3 0 0 0-7.5 7.5L12 21l8.5-8.6a5.3 5.3 0 0 0 0-7.5Z" />
  ),
  chat: (
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 21l1.6-5.2A8.5 8.5 0 1 1 21 11.5Z" />
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M7.5 3v4M16.5 3v4M3.5 10h17" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 20v-1.5a7 7 0 0 1 14 0V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
    </>
  ),
} satisfies Record<string, ReactNode>;

// Contour symbols from the catalog reference; link text provides their names.
export function NavigationIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
