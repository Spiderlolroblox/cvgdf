import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface AIConfig {
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
}

const DEFAULT_CONFIG: AIConfig = {
  model: "x-ai/grok-4.1-fast:free",
  systemPrompt: "Tu es un assistant utile et amical. Réponds en français.",
  temperature: 0.7,
  maxTokens: 2048,
  apiKey: "", // API key is now handled by backend
};

export class AIService {
  static async getConfig(): Promise<AIConfig> {
    try {
      const configRef = doc(db, "settings", "ai");
      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        return { ...DEFAULT_CONFIG, ...configSnap.data() } as AIConfig;
      }
      return DEFAULT_CONFIG;
    } catch (error) {
      console.debug("Using default AI config", error);
      return DEFAULT_CONFIG;
    }
  }

  static async updateConfig(config: Partial<AIConfig>): Promise<void> {
    try {
      const configRef = doc(db, "settings", "ai");
      await setDoc(configRef, config, { merge: true });
    } catch (error) {
      throw new Error("Erreur lors de la mise à jour de la configuration IA");
    }
  }

  static async sendMessage(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
  ): Promise<string> {
    const config = await this.getConfig();

    try {
      // Call backend endpoint instead of directly calling OpenRouter
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage,
          conversationHistory,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          systemPrompt: config.systemPrompt,
        }),
      });

      // Read body once and parse as JSON
      let data: any;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          throw new Error("Erreur serveur: réponse invalide");
        }
      } else {
        throw new Error(`Unexpected content type: ${contentType}`);
      }

      // Check status after reading body
      if (!response.ok) {
        const errorMessage = data?.error || `API error: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data.content || "Pas de réponse";
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Erreur lors de la requête IA");
    }
  }

  static getAvailableModels(): string[] {
    return [
      "openrouter/auto",
      "gpt-4-turbo-preview",
      "gpt-3.5-turbo",
      "claude-3-opus",
      "claude-3-sonnet",
      "mistral-large",
    ];
  }
}
