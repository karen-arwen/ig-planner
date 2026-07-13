import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/instagram";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/dashboard?ig_error=1", req.url));
  }

  try {
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/instagram/callback`;

    const { accessToken, userId } = await exchangeCodeForToken(code, redirectUri);

    // Save token in cookie (60 days)
    const cookieStore = await cookies();
    cookieStore.set("ig_token", accessToken, {
      httpOnly: true,
      secure: !host.includes("localhost"),
      maxAge: 60 * 24 * 60 * 60,
      path: "/",
    });
    cookieStore.set("ig_user_id", userId, {
      httpOnly: true,
      secure: !host.includes("localhost"),
      maxAge: 60 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.redirect(new URL("/dashboard?ig_connected=1", req.url));
  } catch (err) {
    console.error("Instagram callback error:", err);
    return NextResponse.redirect(new URL("/dashboard?ig_error=1", req.url));
  }
}
