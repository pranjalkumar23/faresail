"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Are you a travel agency or booking agent?",
    a: "No. We don't sell tickets or cabins, handle reservations, or take a booking fee. We track prices and alert you to genuine drops; you book directly with the airline, cruise line, or an OTA you trust.",
  },
  {
    q: "How do you decide what counts as a deal?",
    a: "We track price history for each route and sailing over time. A deal has to be at least 40% below that route's normal price, and for flights, non-stop or one-stop only with checked baggage included.",
  },
  {
    q: "Why did the price change when I tried to book?",
    a: "Fares and cabin prices are dynamic and can sell out within minutes or hours, especially on the best deals. If a deal disappears, try flexible dates or check directly with the airline or cruise line.",
  },
  {
    q: "Which markets do you currently cover?",
    a: "We're launching multi-market, starting with a handful of major departure hubs and expanding coverage over time based on demand.",
  },
];

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-50">
        Frequently asked questions
      </h2>
      <div className="mt-6 divide-y divide-black/[.08] dark:divide-white/[.12]">
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={faq.q} className="py-4">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center justify-between text-left"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{faq.q}</span>
                <span className="ml-4 text-zinc-400">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{faq.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
