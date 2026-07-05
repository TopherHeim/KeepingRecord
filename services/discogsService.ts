import { supabase } from '../supabaseClient';
import { API_BASE } from './apiBase';

async function fetchCoverFromDiscogs(artist: string, title: string): Promise<string | null> {
    try {
        const q = `${artist} ${title}`;
        const res = await fetch(
            `${API_BASE}/.netlify/functions/discogs-proxy?q=${encodeURIComponent(q)}`
        );

        if (!res.ok) return null;

        const data = await res.json();

        // The proxy returns a single release object at the top level on
        // success, and { results: [] } only when nothing matched
        if (Array.isArray(data.results)) return null;

        return data.cover_image && !data.cover_image.includes('spacer.gif')
            ? data.cover_image
            : null;
    } catch {
        return null;
    }
}

export async function getCoverUrl(
    albumId: string,
    artist: string,
    title: string,
    existingCoverUrl?: string | null
): Promise<string | null> {
    if (existingCoverUrl) return existingCoverUrl;

    const url = await fetchCoverFromDiscogs(artist, title);

    if (url) {
        await supabase
            .from('albums')
            .update({ cover_url: url })
            .eq('id', albumId);
    }

    return url;
}

export async function saveSpineColor(albumId: string, spineColor: string): Promise<void> {
    await supabase
        .from('albums')
        .update({ spine_color: spineColor })
        .eq('id', albumId);
}

export async function batchFetchCovers(
    albums: { id: string; artist: string; title: string; coverUrl?: string | null }[],
    onUpdate: (id: string, url: string) => void
): Promise<void> {
    const missing = albums.filter((a) => !a.coverUrl);

    for (const album of missing) {
        const url = await getCoverUrl(album.id, album.artist, album.title, album.coverUrl);
        if (url) onUpdate(album.id, url);
        await new Promise((r) => setTimeout(r, 300));
    }
}
