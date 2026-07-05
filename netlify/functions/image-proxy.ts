import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
    const imageUrl = event.queryStringParameters?.url;

    if (!imageUrl) {
        return { statusCode: 400, body: 'Missing url parameter' };
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