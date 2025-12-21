/**
 * MVP AI Integration
 * 
 * Reuses OpenAI pattern from /api/oneStep
 */

export interface ClassificationResult {
  intent: string;
  domain: "health" | "money" | "career" | "relationships" | "learning" | "other";
  nodeName?: string; // Suggested sphere/node name
}

export async function classifyInput(
  text: string
): Promise<ClassificationResult> {
  try {
    const response = await fetch("/api/oneStep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userText: text,
        currentPath: [],
      }),
    });

    const data = await response.json();

    if (data.success && data.step) {
      return {
        intent: data.step.intent,
        domain: data.step.domain,
        nodeName: data.step.bubblePath?.[data.step.bubblePath.length - 1],
      };
    }
  } catch (error) {
    console.error("Classification error:", error);
  }

  // Fallback: simple keyword matching
  const lowerText = text.toLowerCase();
  let domain: ClassificationResult["domain"] = "other";
  
  if (lowerText.includes("health") || lowerText.includes("food") || lowerText.includes("exercise")) {
    domain = "health";
  } else if (lowerText.includes("money") || lowerText.includes("income") || lowerText.includes("expense")) {
    domain = "money";
  } else if (lowerText.includes("career") || lowerText.includes("work") || lowerText.includes("project")) {
    domain = "career";
  }

  return {
    intent: "log",
    domain,
  };
}

export async function generateInsight(nodeId: string, moments: string[]): Promise<string> {
  try {
    const response = await fetch("/api/oneStep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userText: `Generate one short insight based on these recent moments: ${moments.slice(-10).join(", ")}`,
        currentPath: [],
      }),
    });

    const data = await response.json();

    if (data.success && data.step?.assistantLine) {
      return data.step.assistantLine;
    }
  } catch (error) {
    console.error("Insight generation error:", error);
  }

  return "No insight available at this time.";
}

