import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAccountInfo } from "@/lib/instagram";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ig_token")?.value;
    const userId = cookieStore.get("ig_user_id")?.value;

    if (!token || !userId) {
      return NextResponse.json({ connected: false });
    }

    const info = await getAccountInfo(userId, token);
    return NextResponse.json({ connected: true, ...info });
  } catch {
    return NextResponse.json({ connected: false });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("ig_token");
  cookieStore.delete("ig_user_id");
  return NextResponse.json({ ok: true });
}
