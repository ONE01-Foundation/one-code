import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Missing 'text' field in body" },
        { status: 400 }
      );
    }

    const result = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `You are the One01 brain. Answer shortly.\nUser: ${text}`,
    });

    // מגרד טקסט פשוט מהתשובה
    const output = result.output[0].content[0];
    const reply =
      output.type === "output_text" ? output.text : "Got response, but no text.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Brain error:", err);
    return NextResponse.json(
      { error: "Brain failed, check server logs." },
      { status: 500 }
    );
  }
}
