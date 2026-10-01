"use client";

import { Fragment, useMemo, useState } from "react";
import { Deal, DealMode, monthLabel } from "@travel-deals/shared";
import DealCard, { formatPrice } from "./DealCard";
import DealDetail from "./DealDetail";

const ALL = "ALL";

type ModeFilter = typeof ALL | DealMode;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

const selectClass =
  "rounded-lg border border-black/[.12] bg-white px-3 py-2 text-sm text-zinc-900 " +
  "focus:border-teal-500 focus:outline-none dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function DealsFeed({
  deals,
  usingRealData = false,
}: {
  deals: Deal[];
  usingRealData?: boolean;
}) {
  const [mode, setMode] = useState<ModeFilter>(ALL);
  const [country, setCountry] = useState<string>(ALL);
  const [city, setCity] = useState<string>(ALL);
  const [month, setMonth] = useState<string>(ALL);
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const countries = useMemo(
    () => unique(deals.map((d) => d.originCountry)).sort(),
    [deals],
  );

  // Cities are scoped to the chosen country, so picking "India" narrows the
  // city list to Indian origins rather than offering every city we track.
  const cities = useMemo(
    () =>
      unique(
        deals
          .filter((d) => country === ALL || d.originCountry === country)
          .map((d) => d.originCity),
      ).sort(),
    [deals, country],
  );

  // Deals matching only the origin filters. Used to derive which months are
  // worth offering and whether a single currency applies to the budget field.
  const originScoped = useMemo(
    () =>
      deals.filter(
        (d) =>
          (country === ALL || d.originCountry === country) &&
          (city === ALL || d.originCity === city),
      ),
    [deals, country, city],
  );

  const months = useMemo(
    () =>
      unique(
        originScoped
          .map((d) => d.departureMonth)
          .filter((m): m is string => Boolean(m)),
      ).sort(),
    [originScoped],
  );

  // Prices are stored in each market's own currency, so a budget is only
  // meaningful once the origin filters pin us to a single currency.
  const currencies = useMemo(
    () => unique(originScoped.map((d) => d.currency)),
    [originScoped],
  );
  const budgetCurrency = currencies.length === 1 ? currencies[0] : null;

  const priceRange = useMemo(() => {
    if (!budgetCurrency || originScoped.length === 0) return null;
    const prices = originScoped.map((d) => d.dealPrice);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [budgetCurrency, originScoped]);

  const maxPriceValue = maxPrice.trim() === "" ? null : Number(maxPrice);
  const budgetActive =
    budgetCurrency !== null && maxPriceValue !== null && Number.isFinite(maxPriceValue);

  const visible = useMemo(
    () =>
      deals.filter((deal) => {
        if (mode !== ALL && deal.mode !== mode) return false;
        if (country !== ALL && deal.originCountry !== country) return false;
        if (city !== ALL && deal.originCity !== city) return false;
        if (month !== ALL && deal.departureMonth !== month) return false;
        if (budgetActive && deal.dealPrice > (maxPriceValue as number)) return false;
        return true;
      }),
    [deals, mode, country, city, month, budgetActive, maxPriceValue],
  );

  // Only offer a mode tab we actually have listings for, so the feed never
  // advertises a category that is guaranteed to be empty.
  const availableModes = useMemo(() => unique(deals.map((d) => d.mode)), [deals]);
  const tabs: { key: ModeFilter; label: string }[] = [
    { key: ALL, label: "All deals" },
    ...(availableModes.includes("FLIGHT")
      ? [{ key: "FLIGHT" as ModeFilter, label: "Flights" }]
      : []),
    ...(availableModes.includes("CRUISE")
      ? [{ key: "CRUISE" as ModeFilter, label: "Cruises" }]
      : []),
  ];

  // Changing country invalidates both the city list and the currency the
  // budget was typed in, so reset those rather than silently mis-filtering.
  function handleCountryChange(value: string) {
    setCountry(value);
    setCity(ALL);
    setMaxPrice("");
  }

  function handleCityChange(value: string) {
    setCity(value);
    setMaxPrice("");
  }

  const filtersActive =
    mode !== ALL || country !== ALL || city !== ALL || month !== ALL || maxPrice !== "";

  function clearFilters() {
    setMode(ALL);
    setCountry(ALL);
    setCity(ALL);
    setMonth(ALL);
    setMaxPrice("");
  }

  return (
    <section id="deals" className="mx-auto w-full max-w-6xl px-6 py-16">
      <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-50">
        {usingRealData ? "Fares we're tracking right now" : "Live deals right now"}
      </h2>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
        {usingRealData ? (
          <>
            Real fares pulled from our own daily price tracking. Anything marked with a
            discount has dropped below the typical price for that route and month.
          </>
        ) : (
          <>Every deal here cleared our discount bar and quality filters before it went live.</>
        )}
      </p>

      <div className="mt-6 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              mode === tab.key
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-black/[.08] bg-zinc-50 p-5 dark:border-white/[.12] dark:bg-zinc-900/60">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Travelling in">
            <select
              className={selectClass}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value={ALL}>Any month</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m) ?? m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Flying from (country)">
            <select
              className={selectClass}
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              <option value={ALL}>Any country</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Flying from (city)">
            <select
              className={selectClass}
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              <option value={ALL}>Any city</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label={budgetCurrency ? `Max budget (${budgetCurrency})` : "Max budget"}>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-50`}
              value={maxPrice}
              disabled={!budgetCurrency}
              placeholder={
                priceRange
                  ? `${Math.floor(priceRange.min)} – ${Math.ceil(priceRange.max)}`
                  : "Pick a country first"
              }
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {budgetCurrency ? (
              <>
                Budget is in {budgetCurrency} — the currency of the origin you selected.
                {priceRange && (
                  <>
                    {" "}
                    Deals here run {formatPrice(priceRange.min, budgetCurrency)} to{" "}
                    {formatPrice(priceRange.max, budgetCurrency)}.
                  </>
                )}
              </>
            ) : (
              <>
                Choose a source country or city to set a budget — deals are priced in{" "}
                {currencies.sort().join(", ")}, so there is no single currency to compare
                against yet.
              </>
            )}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        {visible.length} {visible.length === 1 ? "deal" : "deals"} match
        {month !== ALL && <> departing {monthLabel(month) ?? month}</>}
        {city !== ALL && <> from {city}</>}
        {city === ALL && country !== ALL && <> from {country}</>}
        {budgetActive && (
          <> under {formatPrice(maxPriceValue as number, budgetCurrency as string)}</>
        )}
        .
      </p>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-zinc-500 dark:text-zinc-400">
          No deals match these filters yet — try widening the month or budget.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((deal) => {
            const detailId = `deal-detail-${deal.id}`;
            const isSelected = selectedId === deal.id;
            return (
              <Fragment key={deal.id}>
                <DealCard
                  deal={deal}
                  isSelected={isSelected}
                  detailId={detailId}
                  onSelect={() => setSelectedId(isSelected ? null : deal.id)}
                />
                {isSelected && (
                  <DealDetail deal={deal} id={detailId} onClose={() => setSelectedId(null)} />
                )}
              </Fragment>
            );
          })}
        </div>
      )}
    </section>
  );
}
