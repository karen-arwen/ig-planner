import { NextRequest, NextResponse } from "next/server";
import { chatWithAI } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { messages, feedContext } = await req.json();
    const result = await chatWithAI(messages, feedContext);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to chat with AI" }, { status: 500 });
  }
}
