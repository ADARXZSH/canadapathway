const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. Define the System Instructions (The "Brain")
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

// 2. Main Handler Function
module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY in Environment Variables");
      return res.status(500).json({ error: "Server configuration error (Missing API Key)." });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { 
        temperature: 0.75, 
        topP: 0.92, 
        topK: 40, 
        maxOutputTokens: 2000 
      },
    });

    // Start Chat with System Instructions and History
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYS }] },
        { role: "model", parts: [{ text: "Understood. I am CanadaPathway AI. I will provide comprehensive, general immigration information while maintaining legal compliance. How can I help you today?" }] },
        ...(history || []).map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        })),
      ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return res.status(200).json({ reply: responseText });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: `Error: ${error.message || String(error)}` });
  }
};