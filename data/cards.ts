/**
 * Data layer for Global ↔ Private Mirror
 * 
 * Provides cards based on scope (private | global)
 */

import { ActionCard, Scope, ActionCardStatus } from "@/lib/types";
import { loadCards } from "@/lib/card-engine";

// Get private cards (user/session-specific data)
export function getPrivateCards(): ActionCard[] {
  if (typeof window === "undefined") return [];
  
  // Load from existing card system
  const cards = loadCards("private");
  
  // Convert to ActionCard format
  return cards
    .filter((c) => c.state !== "archived")
    .map((c) => {
      let status: ActionCardStatus = "active";
      if (c.state === "done") {
        status = "completed";
      } else if (c.state === "active" || c.state === "progressing") {
        status = "active";
      }
      
      return {
        id: c.id,
        title: c.content.split(":")[0] || c.content,
        subtitle: c.content.split(":")[1]?.trim() || "",
        status,
        createdAt: c.createdAt,
        scope: "private" as Scope,
      };
    })
    .slice(0, 4); // Limit to 4 for side bubbles
}

// Get global cards (aggregated anonymous data)
export function getGlobalCards(): ActionCard[] {
  if (typeof window === "undefined") return [];
  
  // Placeholder: aggregated/trends data
  // In real implementation, this would come from server/aggregated data
  const globalCards: ActionCard[] = [
    {
      id: "global_1",
      title: "Collective focus",
      subtitle: "What matters to many",
      status: "active",
      createdAt: new Date().toISOString(),
      scope: "global",
    },
    {
      id: "global_2",
      title: "Shared progress",
      subtitle: "Steps taken together",
      status: "active",
      createdAt: new Date().toISOString(),
      scope: "global",
    },
    {
      id: "global_3",
      title: "Common patterns",
      subtitle: "Emerging themes",
      status: "active",
      createdAt: new Date().toISOString(),
      scope: "global",
    },
    {
      id: "global_4",
      title: "Collective action",
      subtitle: "Moving forward",
      status: "active",
      createdAt: new Date().toISOString(),
      scope: "global",
    },
  ];
  
  return globalCards;
}

// Get cards by scope
export function getCardsByScope(scope: Scope): ActionCard[] {
  return scope === "private" ? getPrivateCards() : getGlobalCards();
}

