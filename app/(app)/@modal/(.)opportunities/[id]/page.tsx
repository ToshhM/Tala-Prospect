import { Modal } from "@/components/ui/modal";
import { OpportunityDetailContent } from "@/features/opportunities/opportunity-detail";

export default async function OpportunityModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Modal>
      <OpportunityDetailContent id={id} variant="modal" />
    </Modal>
  );
}
