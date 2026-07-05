import { API_BASE } from './apiBase';

interface AlbumMetadata {
  genre: string;
  year: number;
  description: string;
  spineColor: string;
  correctArtist: string;
  correctTitle: string;
}

export const fetchAlbumMetadata = async (title: string, artist: string): Promise<AlbumMetadata | null> => {
  try {
    const response = await fetch(`${API_BASE}/api/gemini?action=metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch album metadata:", error);
    return null;
  }
};

export const getAIRecommendations = async (ownedAlbums: {title: string, artist: string}[]): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/gemini?action=recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albums: ownedAlbums }),
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Failed to get AI recommendations:", error);
    return [];
  }
};
