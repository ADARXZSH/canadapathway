module.exports = function handler(req, res) {
  res.status(200).json({
    ok: true,
    hasKey: !!process.env.GEMINI_API_KEY,
    keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.slice(0, 8) + "..." : "NOT SET"
  });
};
