import { NextRequest, NextResponse } from "next/server";

// Temporary in-memory store for images to be published
// In production, use R2/S3 for scalability
const tempImages = new Map<string, { data: Buffer; type: string; expires: number }>();

// Clean up old images every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of tempImages.entries()) {
    if (val.expires < now) tempImages.delete(key);
  }
}, 10 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType, id } = await req.json();
    const buffer = Buffer.from(base64, "base64");

    // Store for 1 hour
    tempImages.set(id, {
      data: buffer,
      type: mimeType || "image/jpeg",
      expires: Date.now() + 60 * 60 * 1000,
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const imageUrl = `${protocol}://${host}/api/instagram/upload-image?id=${id}`;

    return NextResponse.json({ imageUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return new NextResponse("Not found", { status: 404 });

  const img = tempImages.get(id);
  if (!img) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(img.data, {
    headers: {
      "Content-Type": img.type,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
