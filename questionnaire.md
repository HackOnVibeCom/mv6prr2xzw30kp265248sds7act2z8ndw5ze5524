# HackOnVibe — Project Questionnaire

## 1. What does your application/service do?

AutoPromo SDK is an autonomous, AI-driven promotion layer and growth analytics dashboard for mobile and web applications. It captures real-time application milestones (such as product launches, version releases, 5-star user reviews, and download goals) via a drop-in 3-line SDK (`@autopromo/sdk`), generates platform-tailored promotional copy across 6 social networks (Twitter/X, LinkedIn, Reddit, WhatsApp, Telegram, Facebook) and commercial AI ad poster artwork using Google Gemini Imagen 3, ranks content variants using an adaptive Strategy Engine, and opens native platform composition screens so developers can publish in 1-tap with **Zero Terms-of-Service Risk**.

---

## 2. Who is the target audience?

Mobile app developers, web application founders, indie hackers, growth marketers, and software product teams who want to consistently promote their product milestones without spending hours writing social threads, designing graphics, or risking social account bans through fragile automation bots.

---

## 3. Which countries are the expected buyers of this service?

Primarily major software development and startup ecosystems — the **United States**, **United Kingdom**, **Canada**, **Australia**, **India**, and **Western Europe** (Germany, France, Netherlands) — where consumer mobile apps launch frequently and where App Store, Product Hunt, and social tech culture are strongest. Secondary growth markets include **Southeast Asia** (Singapore, Indonesia) and **East Asia** (Japan, South Korea). Because AutoPromo SDK is distributed via NPM as a global web/mobile SDK and supports multi-locale social platforms, it is completely region-agnostic and accessible worldwide.

---

## 4. Who are your competitors?

AutoPromo SDK replaces a fragmented patchwork of point tools that developers currently stitch together:
* **Social Scheduling & Management Tools** (*Buffer, Hootsuite, Sprout Social*) — which require manual content creation and expensive paid platform API integrations.
* **Generic AI Copywriting Tools** (*Jasper, Copy.ai*) — which lack direct application event context, SDK hooks, and real-time product trigger telemetry.
* **Unofficial Automation Bots & Web Scrapers** — which carry high risks of account suspension or permanent social media bans due to platform API restrictions.
* **Graphic Design & Banner Templates** (*Canva*) — which require manual graphic editing for every release.

AutoPromo SDK's primary competition is this inefficient patchwork of point tools combined with spreadsheets and manual effort.

---

## 5. What is your advantage?

Three core architectural differentiators:

1. **Zero ToS Risk (1-Tap Human-in-the-Loop)**: Avoids third-party account delegation, password storage, or unauthorized web scraping. AutoPromo constructs pre-filled native platform composition intent URLs (`twitter.com/intent/tweet`, `wa.me`, `linkedin.com/sharing`), keeping a human in final 1-tap publishing control.
2. **Resilient Multi-LLM Fallback Matrix**: Features a sequential execution cascade across AI providers (**OpenAI `gpt-4o-mini`** $\rightarrow$ **AgentRouter** $\rightarrow$ **Groq `Llama 3.3 70B`** $\rightarrow$ **Structured Copy Fallback**), guaranteeing 100% uptime for post generation.
3. **Adaptive Strategy Engine & AI Poster Studio**: Ranks post variants dynamically based on historical publishing performance ($\text{Score} = \text{Base Weight} + 0.5 \times \frac{\text{Chosen}}{\text{Shown}}$) and integrates Google Gemini Imagen 3 for 1-click multi-aspect ratio ad banner export (**Square 1:1**, **Landscape 16:9**, **Story 9:16**).

