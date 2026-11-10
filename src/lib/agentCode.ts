import Agent from "@/models/Agent";

// Shared IRDAI POSP-code (= "agentCode") generator — previously duplicated
// separately in updateStatus.ts and uploadCertificate.ts, both only running
// at admin-approval time. Now also called right after exam pass so the
// certificate is never generated with "POS Code: N/A" baked into it.
//
// Confirmed numbering scheme: ZNIB13102, ZNIB13103, ZNIB13104, ... — fixed
// 5-digit sequence. The lookup is anchored to exactly 5 digits so it can't
// be thrown off by an old/malformed code of a different length; a plain
// `/^ZNIB\d+$/` would happily "continue" from a stray 4-digit code instead
// of the real sequence. Retries on a rare concurrent-duplicate (two agents
// passing at the same instant) since agentCode is a unique/sparse index.
const AGENT_CODE_PREFIX = "ZNIB";
const AGENT_CODE_START = 13102;

export async function ensureAgentCode(agent: any): Promise<string> {
  if (agent.agentCode) return agent.agentCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const lastCode = await Agent.findOne({ agentCode: { $regex: /^ZNIB\d{5}$/ } })
      .sort({ agentCode: -1 }) // safe lexicographic order — every match is the same digit length
      .select("agentCode");

    let nextNumber = AGENT_CODE_START;
    if (lastCode?.agentCode) {
      const num = parseInt(lastCode.agentCode.slice(AGENT_CODE_PREFIX.length), 10);
      if (!isNaN(num) && num + 1 > nextNumber) nextNumber = num + 1;
    }
    nextNumber += attempt;

    const candidate = `${AGENT_CODE_PREFIX}${nextNumber}`;
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
