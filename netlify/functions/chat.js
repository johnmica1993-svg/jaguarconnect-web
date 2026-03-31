// Netlify serverless function — proxy for Anthropic API
// Set ANTHROPIC_API_KEY in Netlify Dashboard > Site Settings > Environment Variables

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders(), body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: corsHeaders(), body: 'Method Not Allowed' };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return {
            statusCode: 500,
            headers: corsHeaders(),
            body: JSON.stringify({ error: 'API key not configured' })
        };
    }

    try {
        const body = JSON.parse(event.body);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: body.model || 'claude-sonnet-4-20250514',
                max_tokens: body.max_tokens || 500,
                system: body.system || '',
                messages: body.messages || []
            })
        });

        const data = await response.text();

        return {
            statusCode: response.status,
            headers: corsHeaders(),
            body: data
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: corsHeaders(),
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
}
