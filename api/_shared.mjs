// Shared schemas and helpers for Vercel Serverless Functions.
// This file is prefixed with "_" so Vercel does NOT treat it as an endpoint.

export const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ingredients: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          amount: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          imageFocusX: { type: 'number', minimum: 0, maximum: 100 },
          imageFocusY: { type: 'number', minimum: 0, maximum: 100 },
        },
        required: ['name', 'amount', 'confidence', 'imageFocusX', 'imageFocusY'],
      },
    },
    dish: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        reason: { type: 'string' },
        missingIngredients: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'description', 'reason', 'missingIngredients'],
    },
  },
  required: ['ingredients', 'dish'],
};

export const recipeSuggestionSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    message: { type: 'string' },
    recipes: {
      type: 'array', maxItems: 4,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          title: { type: 'string' }, time: { type: 'string' }, tag: { type: 'string' },
          summary: { type: 'string' }, matchReason: { type: 'string' },
          ingredients: { type: 'array', items: { type: 'string' } },
          steps: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'time', 'tag', 'summary', 'matchReason', 'ingredients', 'steps'],
      },
    },
  }, required: ['message', 'recipes'],
};

export function sendJson(res, status, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(status).json(data);
}

export function getOutputText(response) {
  if (typeof response.output_text === 'string') return response.output_text;
  return (response.output || [])
    .flatMap(item => item.content || [])
    .filter(item => item.type === 'output_text')
    .map(item => item.text)
    .join('');
}

export function validateImageData(imageData) {
  if (typeof imageData !== 'string' || !/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(imageData)) {
    throw Object.assign(new Error('Please use a JPG, PNG, WEBP, or GIF photo.'), { status: 400 });
  }
}

