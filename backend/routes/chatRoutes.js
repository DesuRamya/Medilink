import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY is not configured on the server",
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt =
      "You are Medilink Assistant. Provide general medical information only. " +
      "Do not provide diagnosis or definitive treatment. Encourage users to " +
      "consult a healthcare professional for personalized advice. " +
      "If severe symptoms are described (e.g., chest pain, trouble breathing, " +
      "fainting, stroke symptoms), advise urgent care.\n\n" +
      `User: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return res.status(200).json({
      success: true,
      reply: response.text || "",
    });
  } catch (error) {
    console.error("Chat error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate response",
      error: error?.message || "Unknown error",
    });
  }
});

export default router;
