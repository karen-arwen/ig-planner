import { NextRequest, NextResponse } from "next/server";
import { analyzePhoto } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { photos } = await req.json();
    // photos: Array<{ id: string, base64: string, mimeType: string }>

    const results = await Promise.all(
      photos.map(async (photo: { id: string; base64: string; mimeType: string }) => {
        try {
          const analysis = await analyzePhoto(photo.base64, photo.mimeType);
          return { id: photo.id, success: true, analysis };
        } catch (err) {
          console.error(`Failed to analyze photo ${photo.id}:`, err);
          return {
            id: photo.id,
            success: false,
            analysis: {
              category: "lifestyle",
              quality: "good",
              description: "Foto para o feed",
              suggestedCaption: "✨",
              hashtags: ["lifestyle"],
              editSuggestion: "Ajuste leve de brilho",
              colorPalette: ["#ffffff"],
              brightness: 5,
              contrast: 5,
              saturation: 5,
              warmth: 0,
              bestTimeToPost: "18:00",
            },
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Analyze photos error:", error);
    return NextResponse.json({ error: "Failed to analyze photos" }, { status: 500 });
  }
}
