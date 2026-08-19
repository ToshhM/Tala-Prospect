import { OpportunityDetailContent } from "@/features/opportunities/opportunity-detail";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex-1 md:overflow-y-auto bg-background">
      <OpportunityDetailContent id={id} variant="page" />
    </div>
  );
}
