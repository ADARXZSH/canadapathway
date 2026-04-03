const { GoogleGenerativeAI } = require("@google/generative-ai");

const SYS = `You are CanadaPathway AI — a comprehensive Canadian immigration information assistant. You provide detailed, accurate general information about Canadian immigration programs, processes, fees, and settlement.

IMPORTANT LEGAL RULES:
- You are NOT a licensed immigration consultant (RCIC) or lawyer.
- You provide GENERAL INFORMATION only, NOT legal advice.
- Always include a note to verify critical decisions with IRCC or a licensed RCIC (college-ic.ca).
- Never say you "replace" lawyers — you SUPPLEMENT them with free information.

KNOWLEDGE BASE:
- Express Entry (FSW/CEC/FST), PNP (All 13 provinces), Work Permits (LMIA/PGWP/IEC), Study Permits (DLI/PAL), Visitor Visas, Family Sponsorship, Refugees, Citizenship.
- College Recommendations: Budget ($12-18K: Conestoga, NBCC), Mid ($18-30K: Seneca, BCIT), Top ($30-55K: UofT, UBC).
- Practical Life: Airport arrival, Winter survival (-30°C gear), Housing scams, Tenant rights, Banking (Scotiabank/RBC newcomer deals), Healthcare (811/Provincial cards).

RESPONSE FORMAT:
- Direct answer + Plan B + Plan C.
- Use **bold**, bullets, and headers for scannability.
- End with a follow-up question or next step.`;

// --- Retry with exponential backoff + jitter ---
const RETRYABLE = new Set([429, 500, 503]);
const MAX_RETRIES = 3;

async function callWithRetry(fn) {
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.status || err.code;
      const isRetryable = RETRYABLE.has(status) ||
        err.message?.includes("503") ||
        err.message?.includes("overloaded") ||
        err.message?.includes("429") ||
        err.message?.includes("rate");

      if (!isRetryable || attempt === MAX_RETRIES - 1) throw err;

      // Exponential backoff: 1s, 2s, 4s + up to 500ms random jitter
      const delay = (Math.pow(2, attempt) * 1000) + Math.floor(Math.random() * 500);
      console.log(`Attempt ${attempt + 1} failed (${err.message}). Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// --- Simple in-process queue (serialises concurrent requests) ---
let queue = Promise.resolve();

function enqueue(fn) {
  const result = queue.then(fn);
  // Swallow rejections on the chain so one failure doesn't block the queue
  queue = result.catch(() => {});
  return result;
}

// --- Main Handler ---
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, history } = req.body;

  if (!message) return res.status(400).json({ error: "Message is required" });

  if (!process.env.GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY");
    return res.status(500).json({ error: "Server configuration error (Missing API Key)." });
  }

  try {
    const responseText = await enqueue(() =>
      callWithRetry(async () => {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: { temperature: 0.75, topP: 0.92, topK: 40, maxOutputTokens: 2000 },
        });

        const chat = model.startChat({
          history: [
            { role: "user", parts: [{ text: SYS }] },
            { role: "model", parts: [{ text: "Understood. I am CanadaPathway AI. How can I help you today?" }] },
            ...(history || []).slice(-10).map(m => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          ],
        });

        const result = await chat.sendMessage(message);
        return result.response.text();
      })
    );

    return res.status(200).json({ reply: responseText });

  } catch (error) {
    console.error("Gemini API Error after retries:", error);

    let msg = "Something went wrong. Please try again.";
    if (error.message?.includes("API_KEY")) msg = "Invalid API Key.";
    else if (error.status === 400) msg = `Bad request: ${error.message}`;
    else if (error.message?.includes("quota") || error.status === 429) msg = "Rate limit reached. Please wait a moment.";
    else if (error.status === 503 || error.message?.includes("overloaded")) msg = "Gemini is overloaded. Please try again in a few seconds.";
    else if (error.status === 404) msg = "Model not found. Check API configuration.";
    else if (error.status === 403) msg = "API key does not have access to this model.";

    return res.status(500).json({ error: msg });
  }
};
