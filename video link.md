# 🎥 AutoPromo SDK — Video Demo

Watch the complete project demonstration and application walkthrough video here:

👉 **[https://youtu.be/cTnnx4vGqvQ](https://youtu.be/cTnnx4vGqvQ)**

---

## 📌 Video Overview & Demonstration Highlights

This video demonstration walks through the core features, architecture, and developer workflow of AutoPromo SDK:

### 1. Problem Statement & Zero ToS Risk Architecture
* Demonstrates why traditional social media automation tools risk account bans.
* Explains how AutoPromo SDK captures application milestones and prepares platform-native composition intents for 1-tap human-in-the-loop publishing.

### 2. Application Connection & 3-Line SDK Integration
* Demonstrates connecting a new application (`FitnessTracker`) in the dashboard.
* Highlights the 3-line `@autopromo/sdk` integration for tracking launches, version updates, 5-star reviews, and milestone goals asynchronously.

### 3. Event Triggers & Resilient Multi-LLM Generation
* Triggers a version release event (`v2.5.0`) for `PocketRecipe`.
* Demonstrates the Multi-LLM Provider Engine with automatic failover (OpenAI `gpt-4o-mini` $\rightarrow$ AgentRouter $\rightarrow$ Groq `Llama 3.3 70B`).
* Shows instant real-time Discord webhook notifications broadcast to team channels.

### 4. 1-Tap Publishing Across 6 Major Platforms
* Demonstrates pre-filled native composition intents for **Twitter/X**, **LinkedIn**, **Reddit**, **WhatsApp**, **Telegram**, and **Facebook**.
* Explains how human-in-the-loop verification ensures zero Terms-of-Service risk.

### 5. AI Ad & Poster Studio (Gemini Imagen 3)
* Shows AI promotional banner generation powered by **Google Gemini Imagen 3**.
* Demonstrates custom aesthetic themes (*Dark Modern*, *Neon Cyber*, *Vibrant Gradient*) and multi-aspect ratio rendering (**Square 1:1**, **Landscape 16:9**, **Story 9:16**).
* Exports a high-resolution PNG asset directly from the browser.

### 6. Adaptive Strategy Engine & Performance Analytics
* Explains the Strategy Engine scoring formula:
  $$\text{Score} = w_{\text{base}}(\text{Event}, \text{Platform}) + 0.5 \times \left( \frac{\text{Times Chosen}}{\text{Times Shown} + 1} \right)$$
* Demonstrates win-rate metrics, tone breakdown charts, and scoring tooltips.

### 7. Workspace Settings, Live Terminal & Telemetry
* Inspects SDK API keys, environment controls, and subscription quota meters.
* Demonstrates real-time event streaming in the dark-mode developer terminal view.
