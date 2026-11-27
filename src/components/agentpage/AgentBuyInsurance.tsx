"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { FiArrowRight, FiInfo } from "react-icons/fi";
import { INSURANCELIST } from "@/components/home/CarInsuraceSection";
import s from "@/styles/components/agentpage/AgentBuyInsurance.module.css";

// Agent portal "Buy Insurance" tab: the same products as the website's
// "Click to buy an Insurance" section. Picking one turns on agent-selling
// mode (agentSellMode cookie, read by src/lib/agentAttribution.ts) and opens
// that product's normal page, so every policy issued / enquiry raised there
// is stored under this agent. AgentPortalShell (in _app) keeps the agent
// header + sidebar around those pages while selling.

export const AGENT_SELL_MODE_COOKIE = "agentSellMode";

export function startAgentSelling(agentName?: string) {
  // Session cookie (no expiry): ends when the browser closes, on agent
  // logout, or via "Exit agent mode" on the banner.
  document.cookie = `${AGENT_SELL_MODE_COOKIE}=1; path=/; SameSite=Lax`;
  try {
    if (agentName) sessionStorage.setItem("agentSellName", agentName);
  } catch {
    /* storage blocked — banner just won't show the name */
  }
}

const QUOTE_FLOWS = new Set(["car insurance", "2 wheeler insurance", "commercial vehicle"]);
const clean = (n: string) => n.replace(/[​-‍⁠﻿]/g, "").trim();

export default function AgentBuyInsurance({ agentName }: { agentName?: string }) {
  const router = useRouter();

  const open = (link: string) => {
    startAgentSelling(agentName);
    router.push("/" + link.replace(/^\.?\//, ""));
  };

  return (
    <div className={s.wrap}>
      <div className={s.head}>
        <h2 className={s.title}>Buy Insurance</h2>
        <p className={s.sub}>Sell a policy to your customer — pick a product to get quotes and issue it.</p>
      </div>

      <div className={s.note}>
        <FiInfo size={16} />
        <span className={s.noteText}>
          Policies you issue here are saved under your account automatically and appear in{" "}
          <b>List of Policy</b>. Enquiries for other products appear in your <b>Lead</b> tab.
        </span>
      </div>

      <div className={s.grid}>
        {INSURANCELIST.map((item) => {
          const name = clean(item.name);
          const instant = QUOTE_FLOWS.has(name.toLowerCase());
          return (
            <button key={name} type="button" className={s.card} onClick={() => open(item.link)}>
              <span className={s.imgBox}>
                <Image src={item.image} alt={name} width={150} height={100} className={s.img} />
              </span>
              <span className={s.name}>{name}</span>
              <span className={instant ? s.badgeQuote : s.badgeLead}>
                {instant ? "Instant quote & issue" : "Request quote"}
              </span>
              <span className={s.go}>
                Start <FiArrowRight size={13} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
