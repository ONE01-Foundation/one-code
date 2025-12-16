/**
 * Nobody Interaction API v0.1
 * 
 * Returns minimal guided dialog JSON:
 * { say: {title, subtitle}, choices: [{id,label}], card: {title,intent,scope,nextAt} }
 * 
 * Rules:
 * - Strict JSON parsing
 * - Fallback safely if invalid
 * - Max 2 choices
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "placeholder-key",
  });
}

interface NobodySay {
  title: string; // 1 line
  subtitle: string; // 1 line
}

interface NobodyChoice {
  id: string;
  label: string;
}

interface NobodyCard {
  title: string;
  intent: string;
  scope: "private" | "global" | "bridge";
  nextAt?: string; // ISO timestamp
}

interface NobodyResponse {
  say: NobodySay;
  choices: NobodyChoice[]; // Max 2
  card: NobodyCard;
}

export async function GET(req: Request) {
  try {
    const openai = getOpenAIClient();
    
    // Generate Nobody prompt with AI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Nobody, a calm guide. Generate a minimal prompt that helps users take one step forward.

Return ONLY valid JSON in this exact format:
{
  "say": {
    "title": "One short line question or statement",
    "subtitle": "One short line context or clarification"
  },
  "choices": [
    {"id": "choice1", "label": "First option (max 3 words)"},
    {"id": "choice2", "label": "Second option (max 3 words)"}
  ],
  "card": {
    "title": "Card title based on user's likely choice",
    "intent": "health|money|work|relationship|self|other",
    "scope": "private",
    "nextAt": null
  }
}

Rules:
- Max 2 choices
- Each choice label max 3 words
- Card title should be actionable
- Intent must be one of: health, money, work, relationship, self, other
- Scope is always "private" for now
- Return ONLY the JSON, no markdown, no code blocks`,
        },
        {
          role: "user",
          content: "Generate a Nobody prompt for a user who just opened the app.",
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content || "";
    
    // Parse JSON (handle markdown code blocks if present)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```\n?/g, "").trim();
    }
    
    let response: NobodyResponse;
    try {
      response = JSON.parse(jsonStr);
    } catch (parseError) {
      // Fallback to safe default
      response = {
        say: {
          title: "What matters for you right now?",
          subtitle: "Choose one direction to move forward.",
        },
        choices: [
          { id: "focus", label: "Focus" },
          { id: "explore", label: "Explore" },
        ],
        card: {
          title: "Take one step forward",
          intent: "other",
          scope: "private",
        },
      };
    }
    
    // Validate and enforce constraints
    if (!response.say || !response.say.title) {
      response.say = {
        title: "What matters for you right now?",
        subtitle: "Choose one direction to move forward.",
      };
    }
    
    if (!response.choices || response.choices.length === 0) {
      response.choices = [
        { id: "focus", label: "Focus" },
        { id: "explore", label: "Explore" },
      ];
    }
    
    // Limit to max 2 choices
    if (response.choices.length > 2) {
      response.choices = response.choices.slice(0, 2);
    }
    
    if (!response.card || !response.card.title) {
      response.card = {
        title: "Take one step forward",
        intent: "other",
        scope: "private",
      };
    }
    
    // Ensure intent is valid
    const validIntents = ["health", "money", "work", "relationship", "self", "other"];
    if (!validIntents.includes(response.card.intent)) {
      response.card.intent = "other";
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Nobody API error:", error);
    
    // Safe fallback
    return NextResponse.json({
      say: {
        title: "What matters for you right now?",
        subtitle: "Choose one direction to move forward.",
      },
      choices: [
        { id: "focus", label: "Focus" },
        { id: "explore", label: "Explore" },
      ],
      card: {
        title: "Take one step forward",
        intent: "other",
        scope: "private",
      },
    });
  }
}

