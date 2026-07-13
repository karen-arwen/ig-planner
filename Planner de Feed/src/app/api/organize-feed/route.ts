import { NextRequest, NextResponse } from "next/server";
import { organizeFeed } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { photoDescriptions } = await req.json();
    const result = await organizeFeed(photoDescriptions);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Organize feed error:", error);
    return NextResponse.json({ error: "Failed to organize feed" }, { status: 500 });
  }
}
