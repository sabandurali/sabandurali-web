"use client";

import ErrorScreen from "@/components/layout/ErrorScreen";

type PublicErrorProps = {
  error: unknown;
  /** Re-fetches and re-renders the segment (stable since Next.js 16.3). */
  retry: () => void;
};

export default function EnglishError({ error, retry }: PublicErrorProps) {
  return <ErrorScreen locale="en" error={error} retry={retry} />;
}
