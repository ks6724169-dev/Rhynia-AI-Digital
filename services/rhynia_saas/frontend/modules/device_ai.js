/**
 * ==============================================================================
 * Rhynia AI SaaS — Chrome On-Device AI Engine (Gemini Nano Prompt API)
 * Module: modules/device_ai.js
 * Version: 1.0.0 (Phase 2)
 *
 * Provides:
 *  - Native on-device LLM inference using Chrome Built-in AI (window.ai)
 *  - 100% Zero server cost (runs on user's local phone/PC GPU & NPU)
 *  - Real-time token streaming with 0ms network latency
 *  - Injected Rhynia AI persona, Markdown styling, and SmartArt rules
 *  - Graceful feature detection with silent fallback flag
 * ==============================================================================
 */

class RhyniaOnDeviceAIEngine {
  constructor() {
    this.session = null;
    this.isSupported = false;
    this.capabilities = null;
    this.initPromise = null;
  }

  /**
   * Check if Chrome Built-in AI (Gemini Nano) is available on this browser/device
   * @returns {Promise<boolean>}
   */
  async checkAvailability() {
    if (typeof window === "undefined") return false;

    try {
      // 1. Chrome Prompt API standard: window.ai.languageModel
      const aiObject = window.ai || (window.chrome && window.chrome.ai);
      if (!aiObject || !aiObject.languageModel) {
        this.isSupported = false;
        return false;
      }

      // 2. Query model availability
      const capabilities = await aiObject.languageModel.capabilities();
      this.capabilities = capabilities;

      if (capabilities && (capabilities.available === "readily" || capabilities.available === "after-download")) {
        this.isSupported = true;
        console.log("[DeviceAI] Chrome Built-in AI (Gemini Nano) is AVAILABLE on this device! Status:", capabilities.available);
        return true;
      }

      this.isSupported = false;
      return false;
    } catch (err) {
      console.warn("[DeviceAI] On-device AI check non-blocking error:", err);
      this.isSupported = false;
      return false;
    }
  }

  /**
   * Get or create active on-device session with Rhynia Guardrails
   */
  async getSession() {
    if (this.session) return this.session;

    const available = await this.checkAvailability();
    if (!available) return null;

    try {
      const aiObject = window.ai || (window.chrome && window.chrome.ai);
      
      const systemPrompt = 
        "You are Rhynia AI, a high-intelligence, friendly, and structured AI assistant created by Manish Kumar.\n" +
        "Guidelines:\n" +
        "- Always respond clearly, warmly, and concisely in the user's language (Hindi, English, or Hinglish).\n" +
        "- Use beautiful GitHub-flavored markdown with bold section headings and clean bullet points.\n" +
        "- Never output bare external URLs or junk citations.\n" +
        "- When presenting numerical statistics or comparisons, generate interactive charts in ```chart JSON format.";

      this.session = await aiObject.languageModel.create({
        systemPrompt: systemPrompt,
        temperature: 0.7,
        topK: 3
      });

      console.log("[DeviceAI] On-device Rhynia AI session successfully initialized.");
      return this.session;
    } catch (err) {
      console.warn("[DeviceAI] Session creation failed (will fallback to cloud API):", err);
      return null;
    }
  }

  /**
   * Stream prompt generation locally from user's phone/PC hardware
   * @param {string} prompt - User message
   * @param {Object} options - { signal, onChunk, onDone, onError }
   * @returns {Promise<boolean>} - True if successfully handled on-device
   */
  async streamPrompt(prompt, options = {}) {
    const { signal, onChunk, onDone, onError } = options;

    const session = await this.getSession();
    if (!session) {
      return false; // Not supported or creation failed -> trigger Cloud Fallback
    }

    try {
      console.log("[DeviceAI] Generating response 100% ON-DEVICE via local GPU/NPU...");
      const stream = session.promptStreaming(prompt, { signal });

      let fullText = "";
      for await (const chunk of stream) {
        if (signal && signal.aborted) {
          console.log("[DeviceAI] Streaming aborted by user.");
          break;
        }

        // Prompt API can yield accumulated or incremental delta text
        const delta = chunk.startsWith(fullText) ? chunk.slice(fullText.length) : chunk;
        fullText = chunk;

        if (typeof onChunk === "function") {
          onChunk(delta, fullText);
        }
      }

      if (typeof onDone === "function") {
        onDone(fullText);
      }
      return true;

    } catch (err) {
      if (err.name === "AbortError") {
        return true; // Graceful stop
      }
      console.warn("[DeviceAI] On-device stream interrupted, failing over:", err);
      if (typeof onError === "function") {
        onError(err);
      }
      return false;
    }
  }

  /**
   * Reset local session memory
   */
  destroySession() {
    if (this.session && typeof this.session.destroy === "function") {
      try {
        this.session.destroy();
      } catch (e) {}
    }
    this.session = null;
  }
}

// Global Singleton Instance
window.DeviceAI = new RhyniaOnDeviceAIEngine();
