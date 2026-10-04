export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/[.06] bg-white/80 backdrop-blur dark:border-white/[.08] dark:bg-black/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          TRAVELDEALS
        </span>
        <nav className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            Get the app
          </button>
          <button
            type="button"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Sign up
          </button>
        </nav>
      </div>
    </header>
  );
}
