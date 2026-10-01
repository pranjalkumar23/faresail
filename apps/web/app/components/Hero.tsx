export default function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-20 text-center">
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
        Handpicked flight &amp; cruise deals that save you a fortune
      </h1>
      <p className="mt-4 max-w-xl text-lg text-zinc-500 dark:text-zinc-400">
        We watch prices around the clock across airlines and cruise lines, and only surface the
        ones worth booking.
      </p>
      <a
        href="#deals"
        className="mt-8 rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700"
      >
        View deals
      </a>
    </section>
  );
}
