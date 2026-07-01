/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface CloudflareContext {
  request: Request;
  env: {
    GEMINI_API_KEY?: string;
  };
}

/**
 * Cloudflare Pages Function endpoint for translation.
 * Receives a POST request with { text, targetLanguage } and returns the translated text.
 */
export async function onRequestPost(context: CloudflareContext): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { request, env } = context;
    const body = await request.json() as { text?: string; targetLanguage?: string };
    const { text, targetLanguage } = body;

    if (!text || !targetLanguage || targetLanguage === "English") {
      return new Response(JSON.stringify({ translation: text || "" }), {
        status: 200,
        headers,
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          translation: text,
          error: "GEMINI_API_KEY environment variable is not configured on Cloudflare.",
        }),
        {
          status: 200,
          headers,
        }
      );
    }

    const prompt = `Translate this English text to ${targetLanguage}. Provide ONLY the direct, natural translation. Do not include quotes, extra explanations, or any other introductory words. Text to translate:\n"${text}"`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    let result = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    result = result.trim();
    if (result.startsWith('"') && result.endsWith('"')) {
      result = result.slice(1, -1);
    }
    if (result.startsWith("「") && result.endsWith("」")) {
      result = result.slice(1, -1);
    }

    return new Response(JSON.stringify({ translation: result.trim() }), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        translation: "",
        error: error.message || "Unknown error occurred during translation",
      }),
      {
        status: 200,
        headers,
      }
    );
  }
}

/**
 * Handle OPTIONS preflight requests for CORS
 */
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
