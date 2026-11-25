import Link from 'next/link';
import { Container } from '@/shared/ui/container';

export default function NotFoundPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center bg-canvas text-ink"
    >
      <Container size="narrow" className="py-24">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">
          404 · Route Not Found
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          Diese Route existiert nicht.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-secondary">
          Die angeforderte Seite konnte im App Router nicht aufgelöst werden.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-border bg-elevated px-4 py-2 font-mono text-xs text-ink transition-colors hover:border-border-strong"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </Container>
    </main>
  );
}
