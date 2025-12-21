/**
 * Quick Commands Parser
 * 
 * Supports power-user commands:
 * - "card: <title>" => create card
 * - "tag: <tagname>" => attach to node
 * - "magic" => trigger insight
 */

export type ParsedCommand =
  | { type: "card"; title: string }
  | { type: "tag"; tagName: string }
  | { type: "magic" }
  | { type: "none" };

export function parseInputCommand(text: string): ParsedCommand {
  const trimmed = text.trim();
  
  // "card: <title>"
  if (trimmed.toLowerCase().startsWith("card:")) {
    const title = trimmed.substring(5).trim();
    if (title) {
      return { type: "card", title };
    }
  }
  
  // "tag: <tagname>"
  if (trimmed.toLowerCase().startsWith("tag:")) {
    const tagName = trimmed.substring(4).trim();
    if (tagName) {
      return { type: "tag", tagName };
    }
  }
  
  // "magic"
  if (trimmed.toLowerCase() === "magic") {
    return { type: "magic" };
  }
  
  return { type: "none" };
}

