"use client";

import Link from "next/link";

type PublicErrorProps = {
  unstable_retry: () => void;
};

export default function EnglishError({
  unstable_retry: retry,
}: PublicErrorProps) {
  return (
    <main className="flex min-h-screen items-center px-4 py-14 sm:px-6">
      <section className="mx-auto max-w-xl rounded-sm border border-border bg-surface/80 p-7 sm:p-10">
        <p className="text-xs font-semibold tracking-[0.22em] text-accent-soft">
          SOMETHING WENT WRONG
        </p>
        <h1 className="mt-4 text-4xl leading-tight text-ivory sm:text-5xl">
          This page cannot be shown right now.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted">
          Please try again or return to the home page.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-11 items-center rounded-sm bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-strong motion-reduce:transition-none"
          >
            Try again
          </button>
          <Link
            href="/en"
            className="inline-flex min-h-11 items-center rounded-sm border border-border px-5 py-3 text-sm font-semibold text-ivory transition-colors hover:border-accent hover:text-accent-soft motion-reduce:transition-none"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
