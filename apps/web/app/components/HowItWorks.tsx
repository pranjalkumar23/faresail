const STEPS = [
  {
    title: "We scan thousands of fares and sailings daily",
    body: "You don't have to waste hours across flight search engines and cruise sites. We already did it.",
  },
  {
    title: "Every deal is checked against its price history",
    body: "We only surface a deal once it's genuinely ≥40% below what that route or sailing normally costs.",
  },
  {
    title: "Hot deals don't last, so we catch them fast",
    body: "We're watching prices continuously, so when something big drops, you're one of the first to know.",
  },
  {
    title: "We find the deal, you book it however you like",
    body: "We're not a booking platform — you book directly with the airline, cruise line, or your preferred OTA.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-50">
        How we find you the best deal
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="rounded-2xl border border-black/[.08] p-6 dark:border-white/[.12]"
          >
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
              0{i + 1}
            </span>
            <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">{step.title}</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
