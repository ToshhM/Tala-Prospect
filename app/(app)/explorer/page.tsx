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
  Zap,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  User as UserIcon,
  Heart,
} from "lucide-react";
import { toggleFavorite } from "@/features/opportunities/actions";
import { ScoreBadge } from "@/components/ui/score-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { getPriorityFromScore } from "@/services/scoring/scoring";

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

  const where: any = {};

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { companyName: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }
  if (categoryFilter) where.category = categoryFilter;
  if (locationFilter) where.location = { contains: locationFilter, mode: "insensitive" };
  if (minScore > 0) where.score = { gte: minScore };
  if (sourceFilter) where.source = sourceFilter;
  if (remoteFilter) where.isRemote = true;
  if (directFilter) where.isDirectClient = true;
  if (urgentFilter) where.isUrgent = true;
  if (statusFilter) where.status = statusFilter;
  if (favoriteFilter && userId) where.favorites = { some: { userId } };

  let orderBy: any = { publishedAt: "desc" };
  if (sort === "score_desc") orderBy = { score: "desc" };
  else if (sort === "budget_desc") orderBy = { budgetMax: "desc" };
  else if (sort === "urgency_desc") orderBy = { isUrgent: "desc" };

  const totalCount = await prisma.opportunity.count({ where });
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const opportunities = await prisma.opportunity.findMany({
    where,
    orderBy,
    skip,
    take: PAGE_SIZE,
    include: {
      assignedUser: { select: { name: true, email: true } },
      favorites: userId ? { where: { userId } } : false,
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

  const getFilterUrl = (newParams: Record<string, string | null>) => {
    const updated = { ...params, ...newParams };
    if (!newParams.hasOwnProperty("page")) delete updated.page;
    const queryParts = Object.entries(updated)
      .filter(([_, val]) => val !== null && val !== "")
      .map(([key, val]) => `${key}=${encodeURIComponent(val!)}`);
    return `/explorer${queryParts.length > 0 ? `?${queryParts.join("&")}` : ""}`;
  };

  return (
    <div className="flex-1 flex flex-col md:h-full md:overflow-hidden">
      <div className="border-b border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {favoriteFilter ? "Mes opportunités favorites" : "Explorer les opportunités"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {opportunities.length} missions détectées sur le radar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sources"
            className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground/80 hover:bg-muted transition-colors"
          >
            Gérer les Sources & Synchroniser
          </Link>
          <Link
            href="/sources?import=true"
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Ajout Manuel
          </Link>
        </div>
      </div>

      <div className="border-b border-border bg-muted/30 p-4 space-y-4">
        <form method="GET" action="/explorer" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Rechercher un métier, une entreprise..."
              className="w-full rounded-lg border border-input bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <input
              type="text"
              name="location"
              defaultValue={locationFilter}
              placeholder="Localisation (ex: Paris)"
              className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-secondary hover:bg-muted text-foreground text-xs font-semibold py-2.5 rounded-lg border border-border transition-colors"
            >
              Rechercher
            </button>
            <Link
              href="/explorer"
              className="bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground px-3 py-2.5 rounded-lg flex items-center justify-center"
              title="Réinitialiser"
            >
              ×
            </Link>
          </div>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground font-medium">Métiers:</span>
          <Link
            href={getFilterUrl({ category: null })}
            className={`rounded-full px-3 py-1 font-semibold transition-colors ${
              !categoryFilter
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
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
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-semibold">Filtres rapides:</span>
          </div>

          <Link
            href={getFilterUrl({ remote: remoteFilter ? null : "true" })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
              remoteFilter
                ? "bg-blue-500/10 text-blue-600 border-blue-500/25"
                : "border-border hover:text-foreground hover:border-foreground/20"
            }`}
          >
            Remote
          </Link>

          <Link
            href={getFilterUrl({ direct: directFilter ? null : "true" })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
              directFilter
                ? "bg-success/10 text-success border-success/25"
                : "border-border hover:text-foreground hover:border-foreground/20"
            }`}
          >
            Client Direct
          </Link>

          <Link
            href={getFilterUrl({ urgent: urgentFilter ? null : "true" })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
              urgentFilter
                ? "bg-destructive/10 text-destructive border-destructive/25"
                : "border-border hover:text-foreground hover:border-foreground/20"
            }`}
          >
            Urgent
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <span>Trier par:</span>
            <SortSelect defaultValue={sort} />
          </div>
        </div>
      </div>

      <div className="flex-1 md:overflow-y-auto p-6 space-y-3">
        {opportunities.map((opp) => {
          const isFavorited = opp.favorites && opp.favorites.length > 0;
          const priority = getPriorityFromScore(opp.score, opp.isUrgent);
          return (
            <div
              key={opp.id}
              className="group relative rounded-xl border border-border bg-card p-5 hover:border-foreground/15 hover:shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/opportunities/${opp.id}`}>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {opp.title}
                    </h3>
                  </Link>
                  <span className="text-xs text-muted-foreground font-semibold">•</span>
                  <span className="text-sm font-semibold text-foreground/70">{opp.companyName}</span>
                  <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                    {opp.category}
                  </span>
                  {opp.subCategory && (
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {opp.subCategory}
                    </span>
                  )}
                  <PriorityBadge priority={priority} />
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{opp.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-muted-foreground pt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {opp.location}
                  </div>
                  <div>•</div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(opp.publishedAt).toLocaleDateString("fr-FR")}
                  </div>
                  <div>•</div>
                  <div className="uppercase">{opp.source}</div>

                  {opp.isDirectClient && (
                    <span className="ml-2 rounded bg-success/10 border border-success/20 px-1.5 py-0.5 text-[9px] text-success flex items-center gap-0.5">
                      <CheckCircle className="h-2.5 w-2.5" />
                      Direct Client
                    </span>
                  )}
                  {opp.isUrgent && (
                    <span className="rounded bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 text-[9px] text-destructive flex items-center gap-0.5">
                      <Zap className="h-2.5 w-2.5" />
                      Urgent
                    </span>
                  )}
                  {opp.isRemote && (
                    <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[9px] text-blue-600">
                      Télétravail
                    </span>
                  )}
                  {(opp.budgetMax || opp.salaryMax) && (
                    <span className="rounded bg-warning/10 border border-warning/20 px-1.5 py-0.5 text-[9px] text-warning font-bold">
                      {opp.budgetMax ? `${opp.budgetMax} €` : `${opp.salaryMax} €`}
                    </span>
                  )}

                  {opp.assignedUser && (
                    <span className="rounded bg-muted border border-border px-1.5 py-0.5 text-[9px] text-foreground/70 flex items-center gap-1 font-medium">
                      <UserIcon className="h-2.5 w-2.5" />
                      Assigné: {opp.assignedUser.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-border lg:border-t-0 pt-4 lg:pt-0 justify-between lg:justify-end flex-shrink-0">
                <div className="flex flex-col items-center justify-center">
                  <ScoreBadge score={opp.score} />
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                    Pertinence
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await toggleFavorite(opp.id);
                    }}
                  >
                    <button
                      type="submit"
                      className={`rounded-lg border p-2 transition-colors cursor-pointer ${
                        isFavorited
                          ? "bg-destructive/10 text-destructive border-destructive/25 hover:bg-destructive/20"
                          : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20"
                      }`}
                      title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Heart className={`h-4 w-4 ${isFavorited ? "fill-destructive" : ""}`} />
                    </button>
                  </form>

                  {opp.sourceUrl && (
                    <a
                      href={opp.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-card border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors flex items-center gap-1.5"
                      title="Voir l'annonce d'origine"
                    >
                      Voir l&apos;offre
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <Link
                    href={`/opportunities/${opp.id}`}
                    className="rounded-lg bg-secondary border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
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
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card">
            <Briefcase className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-foreground font-bold text-sm">Aucune opportunité</h3>
            <p className="text-muted-foreground text-xs mt-1 max-w-sm">
              Aucun résultat ne correspond aux filtres appliqués. Essayez d&apos;ajuster ou réinitialiser vos critères de recherche.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-6 mt-6 gap-4">
            <div className="text-xs text-muted-foreground">
              Affichage de <span className="font-bold text-foreground/80">{skip + 1}</span> à{" "}
              <span className="font-bold text-foreground/80">{Math.min(skip + PAGE_SIZE, totalCount)}</span> sur{" "}
              <span className="font-bold text-foreground/80">{totalCount}</span> opportunités
            </div>
            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={getFilterUrl({ page: String(currentPage - 1) })}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:text-foreground hover:border-foreground/20 transition-colors"
                >
                  Précédent
                </Link>
              ) : (
                <span className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground cursor-not-allowed">
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
                        {showEllipsis && <span className="text-muted-foreground px-1 text-xs">...</span>}
                        <Link
                          href={getFilterUrl({ page: String(p) })}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            currentPage === p
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "border border-border bg-card text-foreground/70 hover:text-foreground hover:border-foreground/20"
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
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:text-foreground hover:border-foreground/20 transition-colors"
                >
                  Suivant
                </Link>
              ) : (
                <span className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground cursor-not-allowed">
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
