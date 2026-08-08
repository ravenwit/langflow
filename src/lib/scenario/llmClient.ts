const DEEPSEEK_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

export type LLMProviderType = "deepseek" | "gemini";

export interface LLMConfig {
  provider: LLMProviderType;
  apiKey: string;
  model?: string;
}

export class LLMClient {
  private provider: LLMProviderType;
  private apiKey: string;
  private model: string;

  constructor(config: LLMConfig) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    this.model = config.model || (config.provider === "deepseek" ? DEEPSEEK_MODEL : "gemini-2.0-flash");
  }

  async generateScenario(prompt: string): Promise<string> {
    if (this.provider === "gemini") {
      return this.callGemini(prompt);
    }
    return this.callDeepSeek(prompt);
  }

  private async callDeepSeek(prompt: string): Promise<string> {
    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as { choices?: { message: { content: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek returned empty content");
    }
    return content;
  }

  private async callGemini(prompt: string): Promise<string> {
    const url = `${GEMINI_URL}?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as { candidates?: { content: { parts: { text: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned empty content");
    }
    return text;
  }
}