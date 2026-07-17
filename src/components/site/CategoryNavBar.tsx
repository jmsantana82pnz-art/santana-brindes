export function CategoryNavBar({ categories }: { categories: Array<{ id: string; name: string; slug: string }> }) {
  if (!categories || categories.length === 0) return null;
  return (
    <nav className="border-b bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <ul className="flex items-center justify-center gap-6 overflow-x-auto h-12 text-sm font-medium [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <li key={c.id} className="shrink-0">
              <a href={`/?cat=${c.slug}`} className="hover:text-[color:var(--brand-primary)] transition-colors whitespace-nowrap">
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
