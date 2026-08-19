const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// French phone formats: 01 23 45 67 89 / 01.23.45.67.89 / +33 1 23 45 67 89 / 0123456789
const PHONE_REGEX = /(?:\+33[\s.-]?|0)[1-9](?:[\s.-]?\d{2}){4}/;

export interface ExtractedContact {
  email: string | null;
  phone: string | null;
}

/**
 * Pulls an email address and/or phone number directly out of free-text job
 * descriptions. Many France Travail / HelloWork postings include a direct
 * contact even when the source's structured contact field is empty.
 * Best-effort only — returns null for whatever it can't find.
 */
export function extractContactFromText(...texts: (string | null | undefined)[]): ExtractedContact {
  const combined = texts.filter(Boolean).join(" \n ");

  const emailMatch = EMAIL_REGEX.exec(combined);
  const phoneMatch = PHONE_REGEX.exec(combined);

  return {
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? normalizePhone(phoneMatch[0]) : null,
  };
}

function normalizePhone(raw: string): string {
  return raw.replace(/[\s.-]/g, " ").trim();
}
