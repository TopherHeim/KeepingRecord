import type { Handler } from '@netlify/functions';

// Only proxy the hosts the app actually loads cover art from — without
// this the function is an open relay anyone can abuse
const ALLOWED_HOST_SUFFIXES = ['.discogs.com', '.mzstatic.com'];

function isAllowed(rawUrl: string): boolean {
    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        return false;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    return ALLOWED_HOST_SUFFIXES.some(
        suffix => url.hostname.endsWith(suffix) || url.hostname === suffix.slice(1)
    );
}

const handler: Handler = async (event) => {
    const imageUrl = event.queryStringParameters?.url;

    if (!imageUrl) {
        return { statusCode: 400, body: 'Missing url parameter' };
    }

    if (!isAllowed(imageUrl)) {
        return { statusCode: 403, body: 'Host not allowed' };
    }

    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            return { statusCode: response.status, body: 'Failed to fetch image' };
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const base64 = Buffer.from(buffer).toString('base64');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400',
            },
            body: base64,
            isBase64Encoded: true,
        };
    } catch (err) {
        return { statusCode: 500, body: 'Proxy error' };
    }
};

export { handler };
