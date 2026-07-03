import { requireAdminUser } from "@/lib/admin-auth";

import { getPendingClaims } from "./actions";
import { ClaimActions } from "./claim-actions";

export default async function AdminClaimsPage() {
  await requireAdminUser();
  const claims = await getPendingClaims();

  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-slate-950">Profile claims</h2>
          <p className="mt-1 text-sm text-slate-600">
            Approving links the profile to the claimant and makes it public. Rejecting clears the claim.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
          {claims.length} pending
        </span>
      </div>

      {claims.length === 0 ? (
        <p className="mt-6 text-base text-slate-600">No pending claims.</p>
      ) : (
        <ul className="mt-6 divide-y divide-(--color-sand-strong)">
          {claims.map((claim) => (
            <li key={claim.profileId} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="sm:pr-6">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-950">{claim.name}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {claim.visibility}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  Claimed by <span className="font-medium">{claim.claimerEmail}</span>
                </p>
                {claim.bioSnippet ? <p className="mt-1 text-sm text-slate-500">{claim.bioSnippet}…</p> : null}
              </div>
              <ClaimActions profileId={claim.profileId} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
