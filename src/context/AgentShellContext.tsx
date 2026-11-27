import { createContext, useContext } from "react";

// True while a website page is rendered inside the agent portal shell
// (agent selling from the Buy Insurance tab). The website's own chrome —
// Navbar, Footer, UserDetails strip — hides itself so the agent portal's
// header and sidebar stay the only navigation.
export const AgentShellContext = createContext(false);

export const useInAgentShell = () => useContext(AgentShellContext);
