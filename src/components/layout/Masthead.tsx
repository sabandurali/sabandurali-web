import Container from "@/components/ui/Container";
import type { HeaderLocale } from "./header-content";
import Wordmark from "./Wordmark";

/**
 * The header row without navigation, for screens that cannot load the
 * navigation: the error boundary (a client component) and the global 404,
 * which renders outside every layout. The wordmark still leads home.
 */
export default function Masthead({ locale }: { locale: HeaderLocale }) {
  return (
    <header className="border-b-2 border-ink bg-paper text-ink">
      <Container className="flex min-h-18 items-center py-2.5">
        <Wordmark locale={locale} />
      </Container>
    </header>
  );
}
