export default function Footer() {
  return (
    <footer className="border-t border-black/[.06] px-6 py-10 dark:border-white/[.08]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-500 sm:flex-row dark:text-zinc-400">
        <span>© 2026 TravelDeals</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Contact
          </a>
          <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Terms
          </a>
          <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
