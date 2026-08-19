-- Simplify OpportunityStatus from 9 stages to 5 (+ DETECTED) to match the
-- Candidature / Rendez-vous / Proposition / Gagné / Perdu pipeline model.
-- Existing rows are remapped, not dropped:
--   TO_QUALIFY, TO_CONTACT, CONTACTED, FOLLOW_UP -> CANDIDATURE
--   MEETING                                      -> RENDEZ_VOUS
--   QUOTE_SENT                                   -> PROPOSITION
--   DETECTED, WON, LOST                          -> unchanged

CREATE TYPE "OpportunityStatus_new" AS ENUM ('DETECTED', 'CANDIDATURE', 'RENDEZ_VOUS', 'PROPOSITION', 'WON', 'LOST');

ALTER TABLE "Opportunity" ADD COLUMN "status_new" "OpportunityStatus_new";

UPDATE "Opportunity" SET "status_new" = (
  CASE "status"::text
    WHEN 'DETECTED' THEN 'DETECTED'
    WHEN 'TO_QUALIFY' THEN 'CANDIDATURE'
    WHEN 'TO_CONTACT' THEN 'CANDIDATURE'
    WHEN 'CONTACTED' THEN 'CANDIDATURE'
    WHEN 'FOLLOW_UP' THEN 'CANDIDATURE'
    WHEN 'MEETING' THEN 'RENDEZ_VOUS'
    WHEN 'QUOTE_SENT' THEN 'PROPOSITION'
    WHEN 'WON' THEN 'WON'
    WHEN 'LOST' THEN 'LOST'
  END
)::"OpportunityStatus_new";

ALTER TABLE "Opportunity" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "Opportunity" ALTER COLUMN "status_new" SET DEFAULT 'DETECTED';

ALTER TABLE "Opportunity" DROP COLUMN "status";
ALTER TABLE "Opportunity" RENAME COLUMN "status_new" TO "status";

DROP TYPE "OpportunityStatus";
ALTER TYPE "OpportunityStatus_new" RENAME TO "OpportunityStatus";

CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");
