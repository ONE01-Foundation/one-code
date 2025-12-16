/**
 * Nobody Step API - First Real AI Integration
 * 
 * POST /api/nobody/step
 * Body: { "text": string }
 * 
 * Returns ONE next step as structured JSON.
 * No long answers. No essays. No chatty bot.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  return new OpenAI({ apiKey });
}

// One Next Step Schema
export interface OneNextStep {
  title: string; // short action title (max 6 words)
  why: string; // one short sentence (max 12 words)
  durationMinutes: 5 | 10 | 15 | 20 | 30;
  energy: "low" | "medium" | "high";
  domain: "life" | "health" | "career" | "money" | "relationships" | "learning";
  buttons: Array<{ id: "do" | "not_now" | "change"; label: string }>;
}

// Simple in-memory rate limit (per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

// Deterministic fallback step
function getFallbackStep(): OneNextStep {
  return {
    title: "Take one small step forward",
    why: "Start with something simple and clear.",
    durationMinutes: 10,
    energy: "low",
    domain: "life",
    buttons: [
      { id: "do", label: "Do it" },
      { id: "not_now", label: "Not now" },
      { id: "change", label: "Change" },
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { text, makeEasier } = body;

    // Validate input
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'text' field" }, { status: 400 });
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0 || trimmedText.length > 280) {
      return NextResponse.json(
        { error: "Text must be between 1 and 280 characters" },
        { status: 400 }
      );
    }

    // Call OpenAI
    const openai = getOpenAIClient();
    
    const systemPrompt = `You are Nobody, a calm system that helps people take one small step forward.

Your job: Compress the user's intent into ONE actionable next step.

Return ONLY valid JSON in this exact format:
{
  "title": "short action title (max 6 words, must be actionable)",
  "why": "one short sentence explaining why this matters (max 12 words, calm tone, no motivational hype)",
  "durationMinutes": 5 | 10 | 15 | 20 | 30,
  "energy": "low" | "medium" | "high",
  "domain": "life" | "health" | "career" | "money" | "relationships" | "learning",
  "buttons": [
    { "id": "do", "label": "Do it" },
    { "id": "not_now", "label": "Not now" },
    { "id": "change", "label": "Change" }
  ]
}

Strict rules:
- title: Must be a concrete action the user can do right now (e.g., "Write one email", "Take a 5-minute walk", "Review today's tasks")
- why: Keep it calm and practical, not motivational. Focus on the immediate benefit.
- durationMinutes: Must be realistic and short (5, 10, 15, 20, or 30)
- energy: Choose based on what the step requires (low = minimal effort, high = more effort)
- domain: Choose the most relevant category
- buttons: Always return these exact 3 buttons with these IDs

${makeEasier ? "IMPORTANT: The user asked to change this. Make the step EASIER, shorter, or lower energy." : ""}

Return ONLY the JSON object, no markdown, no code blocks, no explanation.`;

    const userMessage = makeEasier 
      ? `Previous request: "${trimmedText}". User wants an easier version.`
      : trimmedText;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "";
    
    // Parse JSON (handle markdown code blocks if present)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```\n?/g, "").trim();
    }

    let step: OneNextStep;
    try {
      const parsed = JSON.parse(jsonStr);
      
      // Validate and enforce constraints
      step = {
        title: parsed.title || "Take one small step forward",
        why: parsed.why || "Start with something simple and clear.",
        durationMinutes: [5, 10, 15, 20, 30].includes(parsed.durationMinutes) 
          ? parsed.durationMinutes 
          : 10,
        energy: ["low", "medium", "high"].includes(parsed.energy) 
          ? parsed.energy 
          : "low",
        domain: ["life", "health", "career", "money", "relationships", "learning"].includes(parsed.domain)
          ? parsed.domain
          : "life",
        buttons: [
          { id: "do", label: parsed.buttons?.[0]?.label || "Do it" },
          { id: "not_now", label: parsed.buttons?.[1]?.label || "Not now" },
          { id: "change", label: parsed.buttons?.[2]?.label || "Change" },
        ],
      };

      // Enforce word limits
      const titleWords = step.title.split(/\s+/).length;
      if (titleWords > 6) {
        step.title = step.title.split(/\s+/).slice(0, 6).join(" ");
      }

      const whyWords = step.why.split(/\s+/).length;
      if (whyWords > 12) {
        step.why = step.why.split(/\s+/).slice(0, 12).join(" ");
      }

    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      step = getFallbackStep();
    }

    // Dev logging
    if (process.env.NODE_ENV === "development") {
      console.log("[Nobody Step API] Input:", trimmedText);
      console.log("[Nobody Step API] Response:", JSON.stringify(step, null, 2));
    }

    return NextResponse.json(step);
  } catch (error: any) {
    console.error("Nobody Step API error:", error);
    
    // Return fallback on any error
    return NextResponse.json(getFallbackStep(), { status: 200 });
  }
}

