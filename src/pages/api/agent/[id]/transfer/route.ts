// app/api/agents/[id]/transfer/route.ts

import { NextRequest, NextResponse } from "next/server";
import dbConnect  from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import Manager from "@/models/Manager";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const agentId = params.id;
  const { newDistrictManagerId } = await req.json();

  // Fetch agent
  const agent = await Agent.findById(agentId);
  if (!agent) {
    return NextResponse.json({ message: "Agent not found" }, { status: 404 });
  }

  // Check if new DM exists
  const newDM = await Manager.findById(newDistrictManagerId);
  if (!newDM) {
    return NextResponse.json({ message: "New District Manager not found" }, { status: 404 });
  }

  // Step 1: Set old DM relation inactive (keep history)
  const previousDM = agent.assignedTo;
  agent.previousAssignments = agent.previousAssignments || [];
  agent.previousAssignments.push({
    districtManager: previousDM,
    active: false,
    transferredOn: new Date(),
  });

  // Step 2: Assign agent to new DM
  agent.assignedTo = newDistrictManagerId;
  agent.isActive = true;

  await agent.save();

  return NextResponse.json({
    message: `Agent ${agent.firstName} successfully transferred.`,
    from: previousDM,
    to: newDistrictManagerId,
  });
}
