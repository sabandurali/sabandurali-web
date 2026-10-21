import Link from "next/link";

export default function EnglishNotFound() {
  return (
    <main className="flex min-h-screen items-center px-4 py-14 sm:px-6">
      <section className="mx-auto max-w-xl rounded-sm border border-border bg-surface/80 p-7 sm:p-10">
        <p className="text-xs font-semibold tracking-[0.22em] text-accent-soft">
          404
        </p>
        <h1 className="mt-4 text-4xl leading-tight text-ivory sm:text-5xl">
          The content you requested was not found.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted">
          It may be unpublished, removed, or available at a different address.
        </p>
        <Link
          href="/en"
          className="mt-7 inline-flex min-h-11 items-center rounded-sm border border-border px-5 py-3 text-sm font-semibold text-ivory transition-colors hover:border-accent hover:text-accent-soft motion-reduce:transition-none"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
