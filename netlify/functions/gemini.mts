import { GoogleGenAI, Type } from "@google/genai";
import type { Config } from "@netlify/functions";

// Soft origin gate: this endpoint spends real API quota, so only serve
// the app itself. Headers can be spoofed, but this blocks other sites
// embedding the endpoint and casual replay abuse.
const ALLOWED_ORIGINS = new Set([
  "https://vinyltracker.netlify.app",
  "capacitor://localhost",
  "https://localhost",
  "http://localhost:8888",
  "http://localhost:3000",
  "http://localhost:3210",
]);

function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin") ?? "";
  return ALLOWED_ORIGINS.has(origin) || origin.endsWith("--vinyltracker.netlify.app");
}

export default async (req: Request) => {
  if (!originAllowed(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = Netlify.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return Response.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "metadata") {
    const { title, artist } = await req.json();
    if (!title || !artist) {
      return Response.json({ error: "title and artist are required" }, { status: 400 });
    }

    try {
      const prompt = `Provide metadata for the vinyl album "${title}" by "${artist}".
      1. Identify the official canonical spelling and capitalization for the Artist and Album Title.
      2. Provide the primary genre.
      3. Provide the release year.
      4. Provide a short one-sentence description.
      5. Provide a hex color code for the spine based on the cover art.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correctArtist: { type: Type.STRING },
              correctTitle: { type: Type.STRING },
              genre: { type: Type.STRING },
              year: { type: Type.INTEGER },
              description: { type: Type.STRING },
              spineColor: { type: Type.STRING },
            },
            required: ["correctArtist", "correctTitle", "genre", "year", "description", "spineColor"],
          },
        },
      });

      return Response.json(JSON.parse(response.text ?? "null"));
    } catch (error) {
      console.error("Gemini metadata error:", error);
      return Response.json({ error: "Failed to fetch album metadata" }, { status: 500 });
    }
  }

  if (action === "recommendations") {
    const { albums } = await req.json();
    if (!albums || !Array.isArray(albums)) {
      return Response.json({ error: "albums array is required" }, { status: 400 });
    }

    try {
      const collectionSummary = albums.map((a: any) => `${a.title} by ${a.artist}`).join(", ");
      const prompt = `Based on my record collection: [${collectionSummary}], suggest 3 specific vinyl albums I should consider getting next. Focus on high-quality pressings and similar vibes.
      Include the genre, release year, and a suggested spine color (hex).
      Provide a "reason" field that is witty and related to my existing taste.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                reason: { type: Type.STRING },
                genre: { type: Type.STRING },
                year: { type: Type.INTEGER },
                spineColor: { type: Type.STRING },
              },
              required: ["title", "artist", "reason", "genre", "year", "spineColor"],
            },
          },
        },
      });

      return Response.json(JSON.parse(response.text ?? "[]"));
    } catch (error) {
      console.error("Gemini recommendations error:", error);
      return Response.json([], { status: 500 });
    }
  }

  return Response.json({ error: "Invalid action. Use ?action=metadata or ?action=recommendations" }, { status: 400 });
};

export const config: Config = {
  path: "/api/gemini",
  method: ["POST"],
};
