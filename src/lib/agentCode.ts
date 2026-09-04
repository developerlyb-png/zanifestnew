import Agent from "@/models/Agent";

// Shared IRDAI POSP-code (= "agentCode") generator — previously duplicated
// separately in updateStatus.ts and uploadCertificate.ts, both only running
// at admin-approval time. Now also called right after exam pass so the
// certificate is never generated with "POS Code: N/A" baked into it.
//
// Prefix switched from the old "ZIP####" to "ZNIB####" per the new
// certificate template (sample showed "IRDAI POSP Code: ZNIB13098") — this
// is an assumed default (continue the existing counter, just with the new
// prefix) since the exact numbering scheme wasn't confirmed; adjust here if
// a different starting number or scheme is needed. Old ZIP#### codes on
// existing agents are left as-is — only new codes use the new prefix.
// Retries on a rare concurrent-duplicate (two agents passing at the same
// instant) since agentCode is a unique/sparse index.
export async function ensureAgentCode(agent: any): Promise<string> {
  if (agent.agentCode) return agent.agentCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const [lastZnib, lastZip] = await Promise.all([
      Agent.findOne({ agentCode: { $regex: /^ZNIB\d+$/ } })
        .sort({ createdAt: -1 })
        .select("agentCode"),
      Agent.findOne({ agentCode: { $regex: /^ZIP\d+$/ } })
        .sort({ createdAt: -1 })
        .select("agentCode"),
    ]);

    let nextNumber = 1310; // default start (continues on from the old ZIP1309 baseline)
    if (lastZnib?.agentCode) {
      const num = parseInt(lastZnib.agentCode.replace("ZNIB", ""), 10);
      if (!isNaN(num)) nextNumber = num + 1;
    } else if (lastZip?.agentCode) {
      const num = parseInt(lastZip.agentCode.replace("ZIP", ""), 10);
      if (!isNaN(num)) nextNumber = num + 1;
    }
    nextNumber += attempt;

    const candidate = `ZNIB${nextNumber}`;
    try {
      agent.agentCode = candidate;
      await agent.save();
      return candidate;
    } catch (err: any) {
      if (err?.code === 11000) continue; // duplicate key — retry with the next number
      throw err;
    }
  }

  throw new Error("Could not generate a unique agent code");
}
