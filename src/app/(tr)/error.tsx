"use client";

import ErrorScreen from "@/components/layout/ErrorScreen";

type PublicErrorProps = {
  error: unknown;
  /** Re-fetches and re-renders the segment (stable since Next.js 16.3). */
  retry: () => void;
};

export default function TurkishError({ error, retry }: PublicErrorProps) {
  return <ErrorScreen locale="tr" error={error} retry={retry} />;
}
