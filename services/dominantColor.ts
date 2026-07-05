import { API_BASE } from './apiBase';

const SIZE = 50;
// The left edge of the cover art is the closest match to the record's actual
// spine, so weight those columns much more heavily than the rest of the cover.
const SPINE_COLUMNS = 10;

function buildHistogram(
    data: Uint8ClampedArray,
    maxColumn: number
): Record<string, number> {
    const colorCounts: Record<string, number> = {};

    for (let i = 0; i < data.length; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % SIZE;
        if (x >= maxColumn) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue;
        if (r < 20 && g < 20 && b < 20) continue;
        if (r > 235 && g > 235 && b > 235) continue;

        // Quantize into 20-wide buckets, clamped so channels near 255 don't
        // round up past the valid range and produce broken hex strings
        const rr = Math.min(255, Math.round(r / 20) * 20);
        const gg = Math.min(255, Math.round(g / 20) * 20);
        const bb = Math.min(255, Math.round(b / 20) * 20);

        const key = `${rr},${gg},${bb}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
    }

    return colorCounts;
}

export async function getDominantColor(
    imageUrl: string,
    fallback = '#222222'
): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = SIZE;
                canvas.height = SIZE;

                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(fallback); return; }

                ctx.drawImage(img, 0, 0, SIZE, SIZE);

                const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

                // Prefer the spine-edge columns; fall back to the whole cover
                // when the edge is all black/white (filtered out above)
                let colorCounts = buildHistogram(data, SPINE_COLUMNS);
                if (Object.keys(colorCounts).length === 0) {
                    colorCounts = buildHistogram(data, SIZE);
                }

                if (Object.keys(colorCounts).length === 0) {
                    resolve(fallback);
                    return;
                }

                const dominant = Object.entries(colorCounts).sort(
                    (a, b) => b[1] - a[1]
                )[0][0];

                const [r, g, b] = dominant.split(',').map(Number);
                const hex =
                    '#' +
                    r.toString(16).padStart(2, '0') +
                    g.toString(16).padStart(2, '0') +
                    b.toString(16).padStart(2, '0');

                resolve(hex);
            } catch {
                resolve(fallback);
            }
        };

        img.onerror = () => resolve(fallback);

        // Route through our proxy instead of hitting Discogs directly
        const proxiedUrl = `${API_BASE}/.netlify/functions/image-proxy?url=${encodeURIComponent(imageUrl)}`;
        img.src = proxiedUrl;
    });
}
