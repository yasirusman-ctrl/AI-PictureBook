import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-mc-bg">
      <header className="sticky top-0 z-40 border-b-2 border-mc-border bg-mc-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="font-pixel-heading text-sm text-mc-accent hover:text-mc-accent-hover">
            StoryForge
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className={`font-pixel-heading text-[10px] ${
                isActive('/') ? 'text-mc-gold' : 'text-mc-text-muted hover:text-mc-text'
              }`}
            >
              Stories
            </Link>
            <Link
              to="/stories/new"
              className="pixel-btn bg-mc-accent px-3 py-1.5 text-white"
            >
              + New
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
