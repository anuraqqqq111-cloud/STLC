import { sendJson, parseBody, getOutputText, recipeSuggestionSchema } from './_shared.mjs';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const body = await parseBody(req);
    const { ingredients: rawIngredients, preference } = body;

    const ingredients = Array.isArray(rawIngredients)
      ? rawIngredients.map(item => String(item).trim()).filter(Boolean).slice(0, 40)
      : [];

    if (!ingredients.length) {
      throw Object.assign(new Error('Add at least one ingredient before finding recipes.'), { status: 400 });
    }

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
        max_output_tokens: 1200,
        reasoning: { effort: 'none' },
        input: `You are a strict pantry recipe matcher. Available ingredients: ${JSON.stringify(ingredients)}. Preference: ${String(preference || '').slice(0, 240) || 'none'}.
Return up to four practical dish ideas, ranked by how many of their required ingredients the user has. Every item in each recipe's ingredients array MUST be an available ingredient (case-insensitive); never add staples, seasonings, water, oil, salt, pepper, or optional ingredients unless they are explicitly in the list. Do not put unavailable ingredients in steps either. If no coherent dish can be made, return an empty recipes list and explain briefly in message. Prefer recipes that use the largest number of supplied ingredients. Amounts are not required; use the ingredient names exactly as supplied where possible.`,
        text: {
          verbosity: 'low',
          format: {
            type: 'json_schema',
            name: 'pantry_recipes',
            strict: true,
            schema: recipeSuggestionSchema,
          },
        },
      }),
    });

    const responseJson = await apiResponse.json();
    if (!apiResponse.ok) {
      throw Object.assign(
        new Error(responseJson?.error?.message || 'OpenAI could not suggest recipes right now.'),
        { status: apiResponse.status },
      );
    }

    try {
      const result = JSON.parse(getOutputText(responseJson));
      const available = new Set(ingredients.map(item => item.toLocaleLowerCase().trim()));
      result.recipes = result.recipes.filter(
        recipe => recipe.ingredients.length > 0 &&
          recipe.ingredients.every(item => available.has(item.toLocaleLowerCase().trim())),
      );
      if (!result.recipes.length && !result.message) {
        result.message = 'I could not make a dish using only those ingredients.';
      }
      return sendJson(res, 200, result);
    } catch {
      throw Object.assign(new Error('The AI response was incomplete. Please try again.'), { status: 502 });
    }
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status === 500) console.error(error);
    return sendJson(res, status, { error: error.message || 'Something went wrong. Please try again.' });
  }
}

