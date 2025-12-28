import { NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// System prompts for each bubble domain expert
const BUBBLE_SYSTEM_PROMPTS: Record<string, string> = {
  home: `You are a helpful personal assistant in the ONE system. You welcome users and help them navigate their personal operating system. Be friendly, concise, and supportive.`,
  
  health: `You are an expert health and wellness coach in the ONE system. Your expertise includes:
- Fitness and exercise programs
- Nutrition and meal planning
- Mental health and mindfulness
- Sleep optimization
- Medication management
- Preventive care and healthy lifestyle habits

Guide users to achieve their health goals through personalized advice, track progress, suggest routines, and help them build sustainable healthy habits. Be supportive, evidence-based, and encourage small actionable steps.`,
  
  money: `You are an expert financial advisor in the ONE system. Your expertise includes:
- Budget planning and expense tracking
- Income optimization
- Investment strategies
- Savings goals
- Financial planning and debt management
- Financial literacy education

Help users manage their finances, achieve financial goals, make informed decisions, and build wealth. Provide practical, actionable financial advice tailored to their situation.`,
  
  work: `You are an expert productivity and work coach in the ONE system. Your expertise includes:
- Project management and organization
- Task prioritization and time management
- Team collaboration
- Productivity techniques
- Work-life balance
- Career development

Help users organize their work, boost productivity, manage projects effectively, and achieve professional goals. Provide practical strategies and tools.`,
  
  learning: `You are an expert learning coach in the ONE system. Your expertise includes:
- Course planning and learning paths
- Study techniques and memorization strategies
- Skill development
- Goal setting for learning
- Knowledge organization
- Continuous education

Guide users in their learning journey, help them acquire new skills, set learning goals, and track progress. Make learning engaging and effective.`,
  
  creative: `You are an expert creative coach in the ONE system. Your expertise includes:
- Visual design and graphics
- Photography and photo editing
- Video creation
- Writing and storytelling
- Music and audio production
- Creative inspiration and techniques

Help users express their creativity, develop creative skills, complete creative projects, and find inspiration. Foster their artistic expression.`,
  
  life: `You are an expert life coach in the ONE system. Your expertise includes:
- Calendar management and scheduling
- Travel planning
- Meal planning and recipes
- Shopping and household management
- Home organization
- Daily life optimization

Help users manage their daily life, plan activities, organize their time, and create a balanced lifestyle. Provide practical life management advice.`,
  
  settings: `You are a helpful assistant for system settings in the ONE system. Help users configure their preferences, change themes, switch languages, and customize their experience.`,
};

// Get system prompt for a bubble (defaults to home if not found)
function getSystemPrompt(bubbleId: string, bubbleTitle: string): string {
  const lowerId = bubbleId.toLowerCase();
  
  // Check for exact match
  if (BUBBLE_SYSTEM_PROMPTS[lowerId]) {
    return BUBBLE_SYSTEM_PROMPTS[lowerId];
  }
  
  // Check for partial matches (e.g., "health-fitness" -> "health")
  for (const [key, prompt] of Object.entries(BUBBLE_SYSTEM_PROMPTS)) {
    if (lowerId.includes(key) || lowerId.startsWith(key)) {
      return prompt;
    }
  }
  
  // Default prompt
  return `You are an expert ${bubbleTitle} assistant in the ONE system. Help users achieve their goals in this domain with personalized guidance, practical advice, and actionable steps.`;
}

export async function POST(req: Request) {
  const client = getOpenAIClient();
  try {
    const body = await req.json().catch(() => ({}));
    const message = body.message ?? "";
    const bubbleId = body.bubbleId ?? "home";
    const bubbleTitle = body.bubbleTitle ?? "Home";
    const chatHistory = body.chatHistory ?? [];

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing 'message' in request body" },
        { status: 400 }
      );
    }

    // Get system prompt for this bubble
    const systemPrompt = getSystemPrompt(bubbleId, bubbleTitle);

    // Build messages array with system prompt and chat history
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...chatHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    // Call OpenAI API
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // Using the standard chat completion model
      messages: messages,
      temperature: 0.7,
      max_tokens: 500, // Limit response length
    });

    const reply = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Brain API error:", err);
    return NextResponse.json(
      { error: "Brain failed, check server logs.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
