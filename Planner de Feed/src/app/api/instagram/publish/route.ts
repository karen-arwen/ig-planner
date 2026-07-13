import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { publishPhoto } from "@/lib/instagram";
import { fileToBase64 } from "@/lib/imageUtils";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ig_token")?.value;
    const userId = cookieStore.get("ig_user_id")?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Instagram não conectado" }, { status: 401 });
    }

    const { photoId, base64, mimeType, caption } = await req.json();
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    if (host.includes("localhost")) {
      return NextResponse.json({
        error: "Publicação direta não funciona em localhost. Deploy no Vercel primeiro! 🚀",
        code: "LOCALHOST_NOT_SUPPORTED",
      }, { status: 400 });
    }

    // 1. Upload image to get public URL
    const uploadRes = await fetch(`${protocol}://${host}/api/instagram/upload-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, mimeType, id: photoId }),
    });
    const { imageUrl } = await uploadRes.json();

    // 2. Publish to Instagram
    const result = await publishPhoto(userId, token, imageUrl, caption);

    return NextResponse.json({ success: true, igPostId: result.id });
  } catch (err) {
    console.error("Publish error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
