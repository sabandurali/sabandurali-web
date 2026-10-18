import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Istanbul Research Assistant | Şaban Durali",
  robots: { index: false, follow: false },
};
export default function ProductPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link href="/istanbul-asistani" className="text-accent">
        ← Try the Turkish prototype
      </Link>
      <p className="mt-16 text-xs tracking-[0.25em] text-accent">
        ŞABAN DURALI / RESEARCH & TECHNOLOGY
      </p>
      <h1 className="mt-5 text-5xl leading-tight">
        Istanbul knowledge.
        <br />
        Traceable to its sources.
      </h1>
      <p className="mt-8 max-w-2xl text-lg leading-8 text-muted">
        Istanbul Research Assistant is an early prototype for exploring and
        comparing Istanbul’s 39 districts using published, source-linked
        editorial guides.
      </p>
      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <section>
          <h2 className="text-2xl">The problem</h2>
          <p className="mt-4 text-muted">
            Local information is fragmented. Readers need to understand where a
            statement comes from, when it was reviewed, and where the evidence
            ends.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">The prototype</h2>
          <p className="mt-4 text-muted">
            Ask a question in Turkish, select one or two districts, and explore
            attributed excerpts with source links and editorial dates. Source-based
            demo mode is free and does not call Claude.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Claude integration</h2>
          <p className="mt-4 text-muted">
            A server-side Messages API adapter is prepared for opt-in testing.
            Claude selects relevant evidence IDs; the application validates them
            and renders original excerpts. Live Claude evaluation has not yet
            been performed.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Responsible scope</h2>
          <p className="mt-4 text-muted">
            No invented prices, investment promises, live statistics or building
            safety assessments. No private CMS data, autonomous actions or
            database access. Source metadata is not a claim of independent
            fact-checking.
          </p>
        </section>
      </div>
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-2xl">Next milestone</h2>
        <p className="mt-4 text-muted">
          Evaluate retrieval and citation quality with a small, budget-capped
          Claude pilot, then user-test the Turkish experience. This is a
          prototype; no customer, revenue, funding or usage claims are made.
        </p>
      </section>
      <footer className="mt-14 text-sm">
        <a className="text-accent" href="mailto:saban@sabandurali.com">
          saban@sabandurali.com
        </a>
      </footer>
    </main>
  );
}
