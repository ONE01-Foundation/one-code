/**
 * OneStep API - Returns ONE actionable step
 * 
 * PRINCIPLES:
 * - ONE step only, no lists
 * - Strict JSON schema enforced
 * - Fallback if unclear
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Minimal OneStep schema (keeping API structure but removing OneView dependencies)
const OneStepSchema = z.object({
  assistantLine: z.string(),
  intent: z.enum(["create_card", "log", "plan", "import_global", "clarify"]),
  domain: z.enum(["health", "money", "career", "relationships", "learning", "other"]),
  bubblePath: z.array(z.string()),
  card: z.object({
    title: z.string(),
    summary: z.string(),
    estimatedMinutes: z.number(),
    energyLevel: z.enum(["low", "medium", "high"]),
    type: z.enum(["task", "log"]),
  }).nullable(),
  metricsHint: z.string().nullable(),
  needsClarification: z.boolean(),
  clarifyingQuestion: z.string().nullable(),
});

type OneStepRequest = {
  userText: string;
  currentPath?: string[];
};

type OneStepResponse = {
  success: boolean;
  step?: z.infer<typeof OneStepSchema>;
  error?: string;
};

// System prompt for AI
const SYSTEM_PROMPT = `You are a calm assistant that returns ONE actionable step only. Never return multiple steps or lists.

Rules:
- Return JSON matching ONE_STEP schema exactly
- assistantLine: one short sentence (max 100 chars)
- intent: one of create_card, log, plan, import_global, clarify
- domain: one of health, money, career, relationships, learning, other
- bubblePath: array of strings representing hierarchy (e.g., ["Health", "Nutrition"])
- card: if intent is create_card or log, provide card object. Otherwise null.
- If unclear what user wants, set intent="clarify" and provide one short clarifyingQuestion

Example response:
{
  "assistantLine": "Got it. Let's start with one small step.",
  "intent": "create_card",
  "domain": "health",
  "bubblePath": ["Health", "Nutrition"],
  "card": {
    "title": "Log breakfast",
    "summary": "Quick note: what you ate + estimate",
    "estimatedMinutes": 2,
    "energyLevel": "low",
    "type": "log"
  },
  "metricsHint": null,
  "needsClarification": false,
  "clarifyingQuestion": null
}

Return JSON only. No markdown, no explanation.`;

export async function POST(request: NextRequest) {
  try {
    const body: OneStepRequest = await request.json();
    
    // Validate input
    if (!body.userText || body.userText.trim().length === 0) {
      return NextResponse.json<OneStepResponse>({
        success: false,
        error: "userText is required",
      }, { status: 400 });
    }
    
    if (body.userText.length > 500) {
      return NextResponse.json<OneStepResponse>({
        success: false,
        error: "userText too long (max 500 chars)",
      }, { status: 400 });
    }
    
    // Check for OpenAI key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback: return deterministic step based on keywords
      return NextResponse.json<OneStepResponse>({
        success: true,
        step: generateFallbackStep(body.userText, body.currentPath || []),
      });
    }
    
    // Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: body.userText },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 300,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI error:", error);
      return NextResponse.json<OneStepResponse>({
        success: true,
        step: generateFallbackStep(body.userText, body.currentPath || []),
      });
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json<OneStepResponse>({
        success: true,
        step: generateFallbackStep(body.userText, body.currentPath || []),
      });
    }
    
    // Parse and validate JSON
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json<OneStepResponse>({
        success: true,
        step: generateFallbackStep(body.userText, body.currentPath || []),
      });
    }
    
    // Validate with zod
    const validation = OneStepSchema.safeParse(parsed);
    
    if (!validation.success) {
      console.error("Schema validation error:", validation.error);
      return NextResponse.json<OneStepResponse>({
        success: true,
        step: generateFallbackStep(body.userText, body.currentPath || []),
      });
    }
    
    return NextResponse.json<OneStepResponse>({
      success: true,
      step: validation.data,
    });
    
  } catch (error) {
    console.error("OneStep API error:", error);
    return NextResponse.json<OneStepResponse>({
      success: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}

/**
 * Generate fallback step when AI is unavailable
 */
function generateFallbackStep(userText: string, currentPath: string[]): z.infer<typeof OneStepSchema> {
  const lowerText = userText.toLowerCase();
  
  // Detect domain
  let domain: "health" | "money" | "career" | "relationships" | "learning" | "other" = "other";
  if (lowerText.includes("health") || lowerText.includes("בריאות") || lowerText.includes("אוכל") || lowerText.includes("sport")) {
    domain = "health";
  } else if (lowerText.includes("money") || lowerText.includes("כסף") || lowerText.includes("budget") || lowerText.includes("save")) {
    domain = "money";
  } else if (lowerText.includes("career") || lowerText.includes("קריירה") || lowerText.includes("work") || lowerText.includes("job")) {
    domain = "career";
  } else if (lowerText.includes("relationship") || lowerText.includes("מערכת") || lowerText.includes("friend")) {
    domain = "relationships";
  } else if (lowerText.includes("learn") || lowerText.includes("ללמוד") || lowerText.includes("study")) {
    domain = "learning";
  }
  
  // Detect intent
  let intent: "create_card" | "log" | "plan" | "import_global" | "clarify" = "create_card";
  if (lowerText.includes("log") || lowerText.includes("רישום") || lowerText.includes("note")) {
    intent = "log";
  } else if (lowerText.length < 10) {
    intent = "clarify";
  }
  
  // Generate bubble path
  const bubblePath = currentPath.length > 0 ? currentPath : [domain.charAt(0).toUpperCase() + domain.slice(1)];
  
  // Generate card
  const card = intent === "create_card" || intent === "log" ? {
    title: userText.substring(0, 30).trim() || "New item",
    summary: userText.substring(0, 100).trim() || "Quick note",
    estimatedMinutes: 5,
    energyLevel: "low" as const,
    type: intent === "log" ? "log" as const : "task" as const,
  } : null;
  
  return {
    assistantLine: "Got it. Let's start with one small step.",
    intent,
    domain,
    bubblePath,
    card,
    metricsHint: null,
    needsClarification: intent === "clarify",
    clarifyingQuestion: intent === "clarify" ? "What would you like to focus on?" : null,
  };
}
