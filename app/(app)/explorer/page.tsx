import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { SortSelect } from "./sort-select";
import {
  Search,
  MapPin,
  Clock,
  Briefcase,
  AlertCircle,
  Zap,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  User as UserIcon,
  Sparkles,
  Heart,
} from "lucide-react";
import { toggleFavorite } from "@/features/opportunities/actions";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    minScore?: string;
    source?: string;
    remote?: string;
    direct?: string;
    urgent?: string;
    status?: string;
    sort?: string;
    favorite?: string;
    page?: string;
  }>;
}

export default async function ExplorerPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  // Resolve search parameters
  const params = await searchParams;
  const query = params.q || "";
  const categoryFilter = params.category || "";
  const locationFilter = params.location || "";
  const minScore = params.minScore ? parseInt(params.minScore) : 0;
  const sourceFilter = params.source || "";
  const remoteFilter = params.remote === "true";
  const directFilter = params.direct === "true";
  const urgentFilter = params.urgent === "true";
  const statusFilter = params.status || "";
  const sort = params.sort || "date_desc";
  const favoriteFilter = params.favorite === "true";
  const currentPage = params.page ? parseInt(params.page) : 1;
  const PAGE_SIZE = 15;
  const skip = (currentPage - 1) * PAGE_SIZE;

  // Build prisma search conditions
  const where: any = {};

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { companyName: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (categoryFilter) {
    where.category = categoryFilter;
  }

  if (locationFilter) {
    where.location = { contains: locationFilter, mode: "insensitive" };
  }

  if (minScore > 0) {
    where.score = { gte: minScore };
  }

  if (sourceFilter) {
    where.source = sourceFilter;
  }

  if (remoteFilter) {
    where.isRemote = true;
  }

  if (directFilter) {
    where.isDirectClient = true;
  }

  if (urgentFilter) {
    where.isUrgent = true;
  }

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (favoriteFilter && userId) {
    where.favorites = {
      some: {
        userId,
      },
    };
  }

  // Define sorting
  let orderBy: any = { publishedAt: "desc" };
  if (sort === "score_desc") {
    orderBy = { score: "desc" };
  } else if (sort === "budget_desc") {
    orderBy = { budgetMax: "desc" };
  } else if (sort === "urgency_desc") {
    orderBy = { isUrgent: "desc" };
  }

  // Fetch total matching count
  const totalCount = await prisma.opportunity.count({ where });
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Fetch opportunities
  const opportunities = await prisma.opportunity.findMany({
    where,
    orderBy,
    skip,
    take: PAGE_SIZE,
    include: {
      assignedUser: {
        select: { name: true, email: true },
      },
      favorites: userId
        ? {
            where: { userId },
          }
        : false,
    },
  });

  const categories = [
    "PHOTO",
    "VIDEO",
    "EVENT",
    "SOCIAL_MEDIA",
    "DESIGN",
    "WEB",
    "PODCAST",
    "FORMATION",
    "COMMERCIAL",
    "MARKETING",
    "COMMUNICATION",
    "INFLUENCE",
  ];

  // Helper function to build dynamic filter URLs
  const getFilterUrl = (newParams: Record<string, string | null>) => {
    const updated = { ...params, ...newParams };
    if (!newParams.hasOwnProperty("page")) {
      delete updated.page;
    }
    const queryParts = Object.entries(updated)
      .filter(([_, val]) => val !== null && val !== "")
      .map(([key, val]) => `${key}=${encodeURIComponent(val!)}`);
    return `/explorer${queryParts.length > 0 ? `?${queryParts.join("&")}` : ""}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/30 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {favoriteFilter ? "Mes opportunités favorites" : "Explorer les opportunités"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {opportunities.length} missions détectées sur le radar.
          </p>
        </div>

        {/* Quick Sync trigger */}
        <div className="flex items-center gap-3">
          <Link
            href="/sources"
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold hover:bg-zinc-800 transition-colors"
          >
            Gérer les Sources & Synchroniser
          </Link>
          <Link
            href="/sources?import=true"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold hover:bg-blue-500 transition-colors"
          >
            Ajout Manuel
          </Link>
        </div>
      </div>

      {/* Advanced search controls */}
      <div className="border-b border-zinc-800 bg-zinc-900/10 p-4 space-y-4">
        <form method="GET" action="/explorer" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Text search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Rechercher un métier, une entreprise..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Location filter */}
          <div>
            <input
              type="text"
              name="location"
              defaultValue={locationFilter}
              placeholder="Localisation (ex: Paris)"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Submit button */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold py-2.5 rounded-lg border border-zinc-750 transition-colors"
            >
              Rechercher
            </button>
            <Link
              href="/explorer"
              className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white px-3 py-2.5 rounded-lg flex items-center justify-center"
              title="Réinitialiser"
            >
              ×
            </Link>
          </div>
        </form>

        {/* Quick tags for category filtering */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-zinc-500 font-medium">Métiers:</span>
          <Link
            href={getFilterUrl({ category: null })}
            className={`rounded-full px-3 py-1 font-semibold transition-colors ${
              !categoryFilter
                ? "bg-blue-600 text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            Tous
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={getFilterUrl({ category: cat })}
              className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                categoryFilter === cat
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Additional flags / filters */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-semibold text-zinc-500">Filtres rapides:</span>
          </div>

          {/* Remote */}
          <Link
            href={getFilterUrl({ remote: remoteFilter ? null : "true" })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
              remoteFilter
                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                : "border-zinc-800 hover:text-white hover:border-zinc-700"
            }`}
          >
            Remote
          </Link>

          {/* Client Direct */}
          <Link
            href={getFilterUrl({ direct: directFilter ? null : "true" })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
              directFilter
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "border-zinc-800 hover:text-white hover:border-zinc-700"
            }`}
          >
            Client Direct
          </Link>

          {/* Urgent */}
          <Link
            href={getFilterUrl({ urgent: urgentFilter ? null : "true" })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
              urgentFilter
                ? "bg-red-500/10 text-red-400 border-red-500/30"
                : "border-zinc-800 hover:text-white hover:border-zinc-700"
            }`}
          >
            Urgent
          </Link>

          {/* Sorting */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-zinc-500">Trier par:</span>
            <SortSelect defaultValue={sort} />
          </div>
        </div>
      </div>

      {/* Main Opportunities list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {opportunities.map((opp) => {
          const isFavorited = opp.favorites && opp.favorites.length > 0;
          return (
            <div
              key={opp.id}
              className="group relative rounded-xl border border-zinc-800 bg-zinc-900/20 p-5 hover:border-zinc-750 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
            <div className="space-y-2 max-w-3xl">
              {/* Header: Title, company, category */}
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/opportunities/${opp.id}`}>
                  <h3 className="text-base font-bold text-white hover:text-blue-400 group-hover:text-blue-400 transition-colors">
                    {opp.title}
                  </h3>
                </Link>
                <span className="text-xs text-zinc-400 font-semibold">•</span>
                <span className="text-sm font-semibold text-zinc-300">{opp.companyName}</span>
                <span className="rounded-full bg-zinc-800/80 border border-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                  {opp.category}
                </span>
                {opp.subCategory && (
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    {opp.subCategory}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {opp.description}
              </p>

              {/* Badges / metadata */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-zinc-500 pt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-zinc-500" />
                  {opp.location}
                </div>
                <div>•</div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-zinc-500" />
                  {new Date(opp.publishedAt).toLocaleDateString("fr-FR")}
                </div>
                <div>•</div>
                <div className="uppercase text-zinc-400">{opp.source}</div>

                {/* Flags */}
                {opp.isDirectClient && (
                  <span className="ml-2 rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle className="h-2.5 w-2.5" />
                    Direct Client
                  </span>
                )}
                {opp.isUrgent && (
                  <span className="rounded bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-[9px] text-red-400 flex items-center gap-0.5 animate-pulse">
                    <Zap className="h-2.5 w-2.5" />
                    Urgent
                  </span>
                )}
                {opp.isRemote && (
                  <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[9px] text-indigo-400">
                    Télétravail
                  </span>
                )}
                {(opp.budgetMax || opp.salaryMax) && (
                  <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-400 font-bold">
                    {opp.budgetMax ? `${opp.budgetMax} €` : `${opp.salaryMax} €`}
                  </span>
                )}

                {opp.assignedUser && (
                  <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-300 flex items-center gap-1 font-medium">
                    <UserIcon className="h-2.5 w-2.5 text-zinc-400" />
                    Assigné: {opp.assignedUser.name}
                  </span>
                )}
              </div>
            </div>

            {/* Score & CTA Actions */}
            <div className="flex items-center gap-4 border-t border-zinc-850 md:border-t-0 pt-4 md:pt-0 justify-between md:justify-end flex-shrink-0">
              {/* Score circle / box */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center border font-extrabold text-sm ${
                    opp.score >= 80
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : opp.score >= 50
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : "bg-zinc-800/40 text-zinc-400 border-zinc-800"
                  }`}
                  title={opp.scoreReasons.join("\n")}
                >
                  {opp.score}
                </div>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                  Pertinence
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <form action={async () => {
                  "use server";
                  await toggleFavorite(opp.id);
                }}>
                  <button
                    type="submit"
                    className={`rounded-lg border p-2 transition-colors cursor-pointer ${
                      isFavorited
                        ? "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
                        : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-350 hover:border-zinc-700"
                    }`}
                    title={isFavorited ? "Retirer du Pipeline CRM" : "Ajouter au Pipeline CRM (Favori)"}
                  >
                    <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500" : ""}`} />
                  </button>
                </form>

                {opp.sourceUrl && (
                  <a
                    href={opp.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-zinc-900 border border-zinc-850 px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors flex items-center gap-1.5"
                    title="Voir l'annonce d'origine"
                  >
                    Voir l'offre
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <Link
                  href={`/opportunities/${opp.id}`}
                  className="rounded-lg bg-zinc-800 border border-zinc-750 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-750 transition-colors flex items-center gap-1.5"
                >
                  Qualifier
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
          );
        })}

        {opportunities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/5">
            <Briefcase className="h-10 w-10 text-zinc-650 mb-3" />
            <h3 className="text-white font-bold text-sm">Aucune opportunité</h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-sm">
              Aucun résultat ne correspond aux filtres appliqués. Essayez d'ajuster ou réinitialiser vos critères de recherche.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-800 pt-6 mt-6 gap-4">
            <div className="text-xs text-zinc-500">
              Affichage de <span className="font-bold text-zinc-400">{skip + 1}</span> à{" "}
              <span className="font-bold text-zinc-400">
                {Math.min(skip + PAGE_SIZE, totalCount)}
              </span>{" "}
              sur <span className="font-bold text-zinc-400">{totalCount}</span> opportunités
            </div>
            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={getFilterUrl({ page: String(currentPage - 1) })}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
                >
                  Précédent
                </Link>
              ) : (
                <span className="rounded-lg border border-zinc-850 bg-zinc-900/40 px-3 py-1.5 text-xs font-semibold text-zinc-600 cursor-not-allowed">
                  Précédent
                </span>
              )}

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                  .map((p, idx, arr) => {
                    const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="text-zinc-600 px-1 text-xs">...</span>}
                        <Link
                          href={getFilterUrl({ page: String(p) })}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            currentPage === p
                              ? "bg-blue-600 text-white shadow-sm"
                              : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700"
                          }`}
                        >
                          {p}
                        </Link>
                      </React.Fragment>
                    );
                  })}
              </div>

              {currentPage < totalPages ? (
                <Link
                  href={getFilterUrl({ page: String(currentPage + 1) })}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
                >
                  Suivant
                </Link>
              ) : (
                <span className="rounded-lg border border-zinc-850 bg-zinc-900/40 px-3 py-1.5 text-xs font-semibold text-zinc-600 cursor-not-allowed">
                  Suivant
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
