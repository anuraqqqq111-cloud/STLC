import { sendJson, getOutputText, validateImageData, responseSchema } from './_shared.mjs';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const { imageData } = req.body;
    validateImageData(imageData);

    if (!process.env.OPENAI_API_KEY) {
      throw Object.assign(
        new Error('OpenAI is not configured yet. Add OPENAI_API_KEY to your Vercel environment variables.'),
        { status: 503 },
      );
    }

    const apiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        store: false,
        max_output_tokens: 260,
        reasoning: { effort: 'none' },
        input: [{
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Fast visual classification: identify at most 10 visible food ingredients with short, conservative estimates. For each ingredient, return imageFocusX and imageFocusY as the approximate center of that exact visible item in the uploaded image, from 0 to 100 percent left-to-right and top-to-bottom. If an item appears multiple times, use the clearest one. Then suggest one simple dish using them. Keep every field extremely brief; return no ingredients when the image has no usable food.',
            },
            { type: 'input_image', image_url: imageData, detail: 'low' },
          ],
        }],
        text: {
          verbosity: 'low',
          format: {
            type: 'json_schema',
            name: 'pantry_scan',
            strict: true,
            schema: responseSchema,
          },
        },
      }),
    });

    const responseJson = await apiResponse.json();
    if (!apiResponse.ok) {
      const message = responseJson?.error?.message || 'OpenAI could not analyze this photo right now.';
      throw Object.assign(new Error(message), { status: apiResponse.status });
    }

    try {
      const analysis = JSON.parse(getOutputText(responseJson));
      return sendJson(res, 200, analysis);
    } catch {
      throw Object.assign(new Error('The AI response was incomplete. Please try the photo again.'), { status: 502 });
    }
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status === 500) console.error(error);
    return sendJson(res, status, { error: error.message || 'Something went wrong. Please try again.' });
  }
}

