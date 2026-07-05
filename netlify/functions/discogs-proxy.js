const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { q, barcode, artist, album } = event.queryStringParameters || {};
    const token = process.env.DISCOGS_TOKEN;
    const headers = {
        'Authorization': `Discogs token=${token}`,
        'User-Agent': 'KeepingRecord/1.0',
    };

    try {
        let url;
        if (barcode) {
            // barcode is a dedicated search param per the docs — far more
            // accurate for UPC/EAN lookups than free-text q
            url = `https://api.discogs.com/database/search?barcode=${encodeURIComponent(barcode)}&type=release`;
        } else if (q) {
            url = `https://api.discogs.com/database/search?q=${encodeURIComponent(q)}&type=release`;
        } else {
            // docs show release_title, not album
            url = `https://api.discogs.com/database/search?artist=${encodeURIComponent(artist)}&release_title=${encodeURIComponent(album)}`;
        }

        const response = await fetch(url, { headers });
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ results: [] }) };
        }

        const initialMatch = data.results.find(r => r.type === 'master') || data.results[0];
        let finalMatch = initialMatch;

        // STEP 2: The documented Master resource lookup
        if (initialMatch.master_id) {
            const masterRes = await fetch(`https://api.discogs.com/masters/${initialMatch.master_id}`, { headers });
            if (masterRes.ok) {
                const masterData = await masterRes.json();
                finalMatch = {
                    ...initialMatch,
                    title: masterData.title,
                    artists: masterData.artists,  // use master's artist array
                    year: masterData.year,        // original release year from master
                    genre: masterData.genres,
                    style: masterData.styles,
                };
            }
        }

        // Processing for your App UI. Search results title releases as
        // "Artist - Album" with no artists array; masters have both.
        let searchArtist = "";
        let searchTitle = finalMatch.title || "";
        if (!finalMatch.artists && searchTitle.includes(' - ')) {
            const idx = searchTitle.indexOf(' - ');
            searchArtist = searchTitle.slice(0, idx);
            searchTitle = searchTitle.slice(idx + 3);
        }

        const canonicalArtist = ((finalMatch.artists?.[0]?.name || searchArtist || artist || "").replace(/\s*\(\d+\)$/, '')).trim();
        const canonicalAlbum = (searchTitle.split('(')[0].trim()) || album || "";

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                ...finalMatch,
                canonicalArtist,
                canonicalAlbum,
                year: finalMatch.year || ""
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message, stack: err.stack })
        };
    }
};