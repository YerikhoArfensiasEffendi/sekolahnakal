import { Link } from 'react-router-dom';

interface SectionProps {
  title: React.ReactNode;
  href?: string;
  children: React.ReactNode;
}

/**
 * Section wrapper with title and optional "See All" link.
 * Used to wrap MovieRow and other content sections.
 */
export function Section({ title, href, children }: SectionProps) {
  return (
    <section className="py-5 md:py-7 border-b border-border/25 last:border-b-0">
      <div className="mb-3 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <h2 className="text-base font-bold text-white md:text-lg flex items-center gap-2">
          {title}
        </h2>
        {href && (
          <Link
            to={href}
            className="text-xs font-semibold text-text-muted transition-colors hover:text-brand"
          >
            Lihat Semua →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
