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
import { State } from "@/lib/types";

function getOpenAIClient() {
  // Allow build to pass even if key is not set, will fail at runtime if used
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "placeholder-key",
  });
}

type IntentCategory = "health" | "money" | "work" | "relationship" | "self" | "other";

interface DistillationResult {
  intent: string; // Single, reduced intent
  title: string; // Short card title
  action: string; // ONE short imperative sentence
  time?: number; // Estimated time in minutes
  category: IntentCategory;
  needs_clarification?: boolean;
  clarification_question?: string;
  isDesireOrRequest?: boolean; // For setting openThread
  shouldSetPendingQuestion?: boolean; // For setting pendingQuestion
  // Legacy field for backward compatibility
  action_text?: string; // @deprecated - use action
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userInput = body.input || body.text || "";
    const currentState: State | null = body.state || null;

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
        title: "Next step",
        action: `Complete: ${trimmedInput}`,
        time: 5,
        category: "other",
        needs_clarification: false,
      });
    }

    // Build context from state (quiet continuity only)
    // Only use privateContext if in private mode
    let contextNote = "";
    if (currentState && currentState.mode === "private" && currentState.privateContext) {
      const privateCtx = currentState.privateContext;
      if (privateCtx.pendingQuestion) {
        contextNote = `\n\nContext: There is a pending question: "${privateCtx.pendingQuestion}". If the user's input answers it, continue that thread. Otherwise, treat as new topic.`;
      } else if (privateCtx.openThread) {
        contextNote = `\n\nContext: There is an open thread about: "${privateCtx.openThread}". If the user's input relates to it, continue naturally. If it's a different topic, start fresh.`;
      }
    }

    const prompt = `You are the ONE01 distillation engine. Your job is to reduce user input into a single, clear intent and generate ONE actionable step.

User input: "${trimmedInput}"${contextNote}

Rules:
1. Reduce the input to a single, clear intent (one sentence max)
2. Generate a short card title (2-4 words, e.g., "Lower friction", "Clear space", "Move forward")
3. Generate ONE action only (short imperative sentence, max 10 words, e.g., "Prepare clothes for tomorrow")
4. Estimate time in minutes (1-60, optional)
5. Classify into ONE category: health, money, work, relationship, self, or other
6. Prefer physical, real-world actions when possible
7. If the input is unclear or ambiguous, set needs_clarification to true and provide a short clarifying question (one sentence max)
8. If continuing a thread, maintain continuity naturally but don't reference past explicitly

Return ONLY valid JSON in this exact format:
{
  "intent": "single clear intent sentence",
  "title": "short card title (2-4 words, e.g., 'Lower friction', 'Clear space')",
  "action": "ONE short imperative sentence (e.g., 'Prepare clothes for tomorrow')",
  "time": 5, // Estimated time in minutes (optional, 1-60)
  "category": "health|money|work|relationship|self|other",
  "needs_clarification": false,
  "clarification_question": null,
  "isDesireOrRequest": false,
  "shouldSetPendingQuestion": false
}

If clarification is needed:
{
  "intent": "user's input as-is",
  "category": "other",
  "action_text": "",
  "needs_clarification": true,
  "clarification_question": "one clarifying question",
  "isDesireOrRequest": false,
  "shouldSetPendingQuestion": true
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
        title: "Next step",
        action: `Complete: ${trimmedInput}`,
        time: 5,
        category: "other",
        needs_clarification: false,
      };
    }

    // Validate result structure
    if (!result.intent || !result.category || !result.action) {
      result = {
        intent: trimmedInput,
        title: "Next step",
        action: `Complete: ${trimmedInput}`,
        time: 5,
        category: "other",
        needs_clarification: false,
        isDesireOrRequest: false,
        shouldSetPendingQuestion: false,
      };
    }
    
    // Ensure title exists
    if (!result.title) {
      result.title = result.intent.split(' ').slice(0, 3).join(' ') || "Next step";
    }

    // Ensure required fields exist
    if (!result.action && result.action_text) {
      result.action = result.action_text; // Backward compatibility
    }
    if (!result.action) {
      result.action = `Complete: ${trimmedInput}`;
    }
    if (!result.title) {
      result.title = result.intent.split(' ').slice(0, 3).join(' ') || "Next step";
    }
    if (!result.time) {
      result.time = 5; // Default 5 minutes
    }
    
    // Ensure flags are set
    if (result.needs_clarification === undefined) result.needs_clarification = false;
    if (result.isDesireOrRequest === undefined) {
      // Simple heuristic: check if input contains desire/request keywords
      const lower = trimmedInput.toLowerCase();
      result.isDesireOrRequest = /(want|need|wish|desire|request|can you|could you|would you|please)/.test(lower);
    }
    if (result.shouldSetPendingQuestion === undefined) {
      result.shouldSetPendingQuestion = result.needs_clarification || false;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Distillation API error:", error);
    
    // Fallback response
    const body = await req.json().catch(() => ({}));
    const userInput = (body.input || body.text || "").trim().slice(0, 120);
    
    return NextResponse.json({
      intent: userInput || "Unknown intent",
      title: "Next step",
      action: userInput ? `Complete: ${userInput}` : "Start a new task",
      time: 5,
      category: "other",
      needs_clarification: false,
    });
  }
}

