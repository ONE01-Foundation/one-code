/**
 * AI Distillation API
 * 
 * Takes user input and returns:
 * - Single intent (reduced from input)
 * - Classification (health / money / work / relationship / self / other)
 * - ONE action text (short imperative sentence)
 * 
 * Rules:
 * - Never give advice lists
 * - Never suggest more than one action
 * - Prefer physical, real-world actions
 * - If uncertain, ask clarifying question instead of guessing
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient() {
  // Allow build to pass even if key is not set, will fail at runtime if used
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "placeholder-key",
  });
}

type IntentCategory = "health" | "money" | "work" | "relationship" | "self" | "other";

interface DistillationResult {
  intent: string; // Single, reduced intent
  category: IntentCategory;
  action_text: string; // ONE short imperative sentence
  needs_clarification?: boolean;
  clarification_question?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userInput = body.input || body.text || "";

    if (!userInput || typeof userInput !== "string" || userInput.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'input' in request body" },
        { status: 400 }
      );
    }

    // Limit input length
    const trimmedInput = userInput.trim().slice(0, 120);

    const client = getOpenAIClient();

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "placeholder-key") {
      // Fallback for development without API key
      return NextResponse.json({
        intent: trimmedInput,
        category: "other",
        action_text: `Complete: ${trimmedInput}`,
        needs_clarification: false,
      });
    }

    const prompt = `You are the ONE01 distillation engine. Your job is to reduce user input into a single, clear intent and generate ONE actionable step.

User input: "${trimmedInput}"

Rules:
1. Reduce the input to a single, clear intent (one sentence max)
2. Classify into ONE category: health, money, work, relationship, self, or other
3. Generate ONE action only (short imperative sentence, max 10 words)
4. Prefer physical, real-world actions when possible
5. If the input is unclear or ambiguous, set needs_clarification to true and provide a short clarifying question (one sentence max)

Return ONLY valid JSON in this exact format:
{
  "intent": "single clear intent sentence",
  "category": "health|money|work|relationship|self|other",
  "action_text": "ONE short imperative sentence",
  "needs_clarification": false,
  "clarification_question": null
}

If clarification is needed:
{
  "intent": "user's input as-is",
  "category": "other",
  "action_text": "",
  "needs_clarification": true,
  "clarification_question": "one clarifying question"
}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a precise distillation engine. Return only valid JSON, no explanations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content || "";
    
    // Try to parse JSON from response
    let result: DistillationResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      // Fallback: try to extract structured data or use simple parsing
      console.error("Failed to parse AI response:", content);
      result = {
        intent: trimmedInput,
        category: "other",
        action_text: `Complete: ${trimmedInput}`,
        needs_clarification: false,
      };
    }

    // Validate result structure
    if (!result.intent || !result.category || !result.action_text) {
      result = {
        intent: trimmedInput,
        category: "other",
        action_text: `Complete: ${trimmedInput}`,
        needs_clarification: false,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Distillation API error:", error);
    
    // Fallback response
    const body = await req.json().catch(() => ({}));
    const userInput = (body.input || body.text || "").trim().slice(0, 120);
    
    return NextResponse.json({
      intent: userInput || "Unknown intent",
      category: "other",
      action_text: userInput ? `Complete: ${userInput}` : "Start a new task",
      needs_clarification: false,
    });
  }
}

