"use client";

import React, { useTransition } from "react";
import { OpportunityStatus } from "@prisma/client";
import { updateOpportunityStatus, assignOpportunity } from "@/features/opportunities/actions";

interface StatusAssigneeFormProps {
  opportunityId: string;
  currentStatus: OpportunityStatus;
  currentAssignedUserId: string | null;
  users: { id: string; name: string | null; email: string; role: string }[];
  statusLabels: Record<OpportunityStatus, string>;
}

export function StatusAssigneeForm({
  opportunityId,
  currentStatus,
  currentAssignedUserId,
  users,
  statusLabels,
}: StatusAssigneeFormProps) {
  const [isPendingStatus, startStatusTransition] = useTransition();
  const [isPendingAssign, startAssignTransition] = useTransition();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as OpportunityStatus;
    startStatusTransition(async () => {
      try {
        await updateOpportunityStatus(opportunityId, status);
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    });
  };

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const assignedUserId = val === "unassigned" ? null : val;
    startAssignTransition(async () => {
      try {
        await assignOpportunity(opportunityId, assignedUserId);
      } catch (err) {
        console.error("Failed to update assignment:", err);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Select */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-zinc-400">Statut du pipeline</label>
          {isPendingStatus && (
            <span className="text-[10px] text-blue-500 animate-pulse font-semibold">Mise à jour...</span>
          )}
        </div>
        <select
          value={currentStatus}
          onChange={handleStatusChange}
          disabled={isPendingStatus}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
        >
          {Object.entries(statusLabels).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* User Assignment Select */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-zinc-400">Assigner à</label>
          {isPendingAssign && (
            <span className="text-[10px] text-blue-500 animate-pulse font-semibold">Mise à jour...</span>
          )}
        </div>
        <select
          value={currentAssignedUserId || "unassigned"}
          onChange={handleAssignmentChange}
          disabled={isPendingAssign}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
        >
          <option value="unassigned">Non assigné</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email} ({u.role})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
