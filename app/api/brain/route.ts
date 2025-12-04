import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = body.text ?? body.message ?? "";

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' in request body" },
        { status: 400 }
      );
    }

    const result = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `You are the One01 brain. Reply shortly.\nUser: ${text}`,
    });

    // לעקוף את הטייפים בעדינות
    const anyResult = result as any;
    const firstOutput = anyResult.output?.[0];
    const firstContent = firstOutput?.content?.[0];

    let reply = "No text in response";

    if (firstContent?.type === "output_text") {
      // ספרייה חדשה של OpenAI – לפעמים זה תחת text / value
      reply = firstContent.text?.value ?? firstContent.text ?? reply;
    } else if (firstContent) {
      reply = JSON.stringify(firstContent);
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Brain API error:", err);
    return NextResponse.json(
      { error: "Brain failed, check server logs." },
      { status: 500 }
    );
  }
}
