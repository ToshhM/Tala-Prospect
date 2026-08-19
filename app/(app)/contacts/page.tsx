import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Contact, Mail, Phone, Building2, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  // Query all opportunities where contact details are available
  const opportunities = await prisma.opportunity.findMany({
    where: {
      OR: [
        { contactName: { not: null } },
        { contactEmail: { not: null } },
        { contactPhone: { not: null } },
      ],
    },
    orderBy: { companyName: "asc" },
  });

  // Unique contact lists by email/phone/name combination
  const contactsMap = new Map<string, {
    name: string;
    email: string | null;
    phone: string | null;
    company: string;
    opportunityId: string;
    opportunityTitle: string;
  }>();

  for (const opp of opportunities) {
    const name = opp.contactName || "Contact Inconnu";
    const email = opp.contactEmail;
    const phone = opp.contactPhone;
    const key = `${name}-${email}-${phone}`;

    if (!contactsMap.has(key)) {
      contactsMap.set(key, {
        name,
        email,
        phone,
        company: opp.companyName,
        opportunityId: opp.id,
        opportunityTitle: opp.title,
      });
    }
  }

  const contactsList = Array.from(contactsMap.values());

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Annuaire des Contacts</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Liste centralisée des contacts identifiés lors de la qualification d'opportunités.
        </p>
      </div>

      {/* Directory Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-semibold">
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Entreprise</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4">Opportunité associée</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {contactsList.map((contact, idx) => (
                <tr
                  key={idx}
                  className="border-b border-zinc-800 hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="py-4 px-4 font-semibold text-white flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs">
                      {contact.name.substring(0, 2).toUpperCase()}
                    </div>
                    {contact.name}
                  </td>
                  <td className="py-4 px-4 text-zinc-300">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                      {contact.company}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-zinc-300">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1.5 hover:text-blue-400 transition-colors text-xs"
                      >
                        <Mail className="h-3.5 w-3.5 text-zinc-500" />
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-zinc-650 italic text-xs">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-zinc-350">
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1.5 hover:text-blue-400 transition-colors text-xs"
                      >
                        <Phone className="h-3.5 w-3.5 text-zinc-500" />
                        {contact.phone}
                      </a>
                    ) : (
                      <span className="text-zinc-650 italic text-xs">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-zinc-400 text-xs truncate max-w-xs">
                    {contact.opportunityTitle}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/opportunities/${contact.opportunityId}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-400"
                    >
                      Détails
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {contactsList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                    Aucun contact identifié dans le radar d'opportunités.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
