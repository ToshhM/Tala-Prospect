"use client";

import React, { startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sort", val);
      router.push(`/explorer?${params.toString()}`);
    });
  };

  return (
    <select
      value={defaultValue}
      onChange={handleSortChange}
      className="bg-zinc-900 border border-zinc-850 text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs cursor-pointer"
    >
      <option value="date_desc">Plus récentes</option>
      <option value="score_desc">Meilleur score</option>
      <option value="budget_desc">Budget max</option>
      <option value="urgency_desc">Urgence</option>
    </select>
  );
}
