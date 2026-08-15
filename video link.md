# 🎥 AutoPromo SDK — Video Demo

Watch the complete project walkthrough & demonstration video here:

👉 **[https://youtu.be/cTnnx4vGqvQ](https://youtu.be/cTnnx4vGqvQ)**

Watch this video to get an overall overview of everything present in this application. Below is the complete demonstration breakdown and script covered in the video:

---

## 🎬 AutoPromo SDK — Video Demo Breakdown

### Audience & Scope
Hackathon Judges, Developers, and Investors — full end-to-end demonstration covering application creation, SDK integration, multi-LLM copy generation, zero ToS risk social intents, Gemini Imagen 3 poster studio, strategy engine analytics, and workspace management.

---

## Scene 1 — Hook & Problem Statement

### 🖥️ Screen Actions
* Start on the **AutoPromo Landing Page** (`/`).
* Scroll through the Hero section.
* Hover over the platform badges:
  * Twitter / X
  * LinkedIn
  * Reddit
  * WhatsApp
* Highlight the **Zero ToS Risk** badge.

### 🎙️ Voiceover
> **"Hey everyone! Building a great application is hard, but getting people to know about it is even harder.**
>
> Your application already knows when important moments happen — like reaching 10,000 downloads, shipping version 2.0, or receiving a five-star review.
>
> But developers often forget to promote these moments, or end up spending hours manually writing social media posts.
>
> Traditional social automation tools can also rely on unofficial APIs or risky automation methods, which can put your accounts at risk.
>
> **That's where AutoPromo SDK comes in.**
>
> AutoPromo is a drop-in developer layer that listens to product milestones, generates multi-platform promotional content and AI-powered ad artwork, and lets you publish it with **one tap — with zero ToS risk.**"

---

## Scene 2 — Connect an App & 3-Line SDK Integration

### 🖥️ Screen Actions
1. Click **Apps** (`/apps`) in the sidebar.
2. Click **+ Connect New App**.
3. Enter:
   * **Name:** `FitnessTracker`
   * **Description:** `AI workout planner`
4. Click **Save**.
5. Navigate to **Docs** (`/docs`).
6. Highlight the `@autopromo/sdk` integration snippet.
7. Navigate to **Settings** (`/settings`).
8. Click the copy icon beside the App API key.

### 🎙️ Voiceover
> **"Let's see how easy it is to integrate AutoPromo.**
>
> From the dashboard, we can connect any application in just a few seconds.
>
> Here, we already have applications like **PocketRecipe** and **FocusTimer**, and we can add another application simply by entering its name and description.
>
> Once the app is connected, integrating AutoPromo into the codebase takes just **three lines of code**.
>
> We install `@autopromo/sdk`, initialize it using the App ID from our Settings page, and then start tracking important product moments.
>
> For example, we can track events like `trackVersion()`, `trackMilestone()`, and `trackReview()`.
>
> The SDK is fully asynchronous and non-blocking, so it doesn't slow down or interfere with the host application."

---

## Scene 3 — Trigger Events & AI Copy Generation

### 🖥️ Screen Actions
1. Navigate to **App Studio** for `PocketRecipe`: `/apps/pocket-recipe`
2. Click **Create Post / Trigger Event**.
3. Select **New Version Release**.
4. Enter:
   * **Build:** `v2.5.0`
   * **Release Notes:** `Added offline mode and faster search`
5. Click **Generate**.
6. Let the generated post cards appear.
7. Demonstrate real-time **Discord Webhook** notifications.

### 🎙️ Voiceover
> **"Now let's see AutoPromo in action.**
>
> Imagine that our application has just released version 2.5.
>
> The SDK captures that milestone and sends the event payload to our Express backend.
>
> From there, AutoPromo uses a **resilient multi-LLM fallback engine** to generate the promotional content.
>
> Our primary model is **OpenAI's GPT-4o-mini**. If that service becomes unavailable, the system can automatically fall back to **AgentRouter**, and then to **Groq with Llama 3.3 70B**.
>
> This gives us a resilient generation pipeline instead of depending on a single model provider.
>
> Within seconds, AutoPromo generates multiple tailored post variants across different styles — including **Casual, Viral, Professional, and Clear** tones.
>
> And at the same time, our team receives a real-time notification through our **Discord webhook** whenever a new promotional event is generated."

---

## Scene 4 — 1-Tap, Zero-ToS-Risk Publishing

### 🖥️ Screen Actions
Stay on **App Studio**: `/apps/pocket-recipe`
1. Hover over a **Twitter / X** post and click **Tweet It**.
2. Click **LinkedIn** to show LinkedIn native sharing flow.
3. Click **Reddit** to show Reddit submission flow.
4. Click **WhatsApp** to show WhatsApp native share interface.

### 🎙️ Voiceover
> **"Now here's one of the most important parts of AutoPromo: zero Terms-of-Service risk.**
>
> Instead of storing social media passwords or running risky browser automation, AutoPromo uses the platforms' native sharing and composition flows.
>
> For example, when I click **Tweet It**, AutoPromo opens the Twitter or X intent page with our AI-generated content already prepared.
>
> When I select **LinkedIn**, it opens LinkedIn's native sharing flow.
>
> For **Reddit**, it opens the submission flow with the content ready to post.
>
> And for **WhatsApp**, it opens the native WhatsApp sharing interface.
>
> The important part is that **the human always makes the final publishing decision**.
>
> AutoPromo prepares the content, but the user remains in control of the final post.
>
> This gives us a simple way to combine AI-powered content generation with a human-controlled publishing workflow."

---

## Scene 5 — AI Ad & Poster Studio

### 🖥️ Screen Actions
1. Click **Create Ad / Ad Studio**: `/apps/pocket-recipe/ads`
2. Enter brief: `Healthy dinner meals in 20 seconds`
3. Select visual themes: **Dark Modern**, **Neon Cyber**, or **Vibrant Gradient**.
4. Switch aspect ratios: **Square (1:1)**, **Landscape (16:9)**, **Story (9:16)**.
5. Click **Generate Poster with Gemini** and **Download High-Res PNG**.

### 🎙️ Voiceover
> **"But social promotion isn't just about text. Visual content plays a huge role in getting attention and driving conversions.**
>
> That's why AutoPromo also includes an **Ad and Poster Studio**.
>
> Here, we can enter a simple product brief — for example, **'Healthy dinner meals in 20 seconds.'**
>
> We can then choose the visual style we want, such as **Dark Modern, Neon Cyber, or Vibrant Gradient**.
>
> We can also instantly switch between different aspect ratios.
>
> **Square, 1:1**, works well for social media posts.
>
> **Landscape, 16:9**, is useful for web banners and larger promotional content.
>
> And **Story, 9:16**, is designed for vertical platforms such as Reels and Stories.
>
> With a single click, AutoPromo generates the promotional artwork, renders it directly in the browser, and allows us to download the final high-resolution PNG."

---

## Scene 6 — Strategy Engine & Performance Analytics

### 🖥️ Screen Actions
1. Click **Analytics** (`/analytics`).
2. Show the **Shown vs Chosen** charts.
3. Hover over a post's score tag to show the formula breakdown:
   $$\text{Score} = \text{Base Weight} + 0.5 \times \left( \frac{\text{Chosen}}{\text{Shown}} \right)$$

### 🎙️ Voiceover
> **"AutoPromo doesn't just generate promotional content — it also learns from how teams use it.**
>
> Our **Adaptive Strategy Engine** ranks different post variants based on actual human publishing choices.
>
> The scoring system combines the platform's base weight with the historical ratio of posts that were chosen versus the number of times they were shown.
>
> The formula is: **Score = Base Weight + 0.5 × (Chosen / Shown).**
>
> This allows the system to identify which types of promotional content are being selected more often.
>
> In the Analytics dashboard, teams can track platform performance, compare different tones, and understand which promotional strategies are performing best."

---

## Scene 7 — Settings, Live Terminal & Conclusion

### 🖥️ Screen Actions
1. Click **Settings** (`/settings`) to inspect SDK keys, quotas, preferences, and billing.
2. Click **Live Feed** (`/live/pocket-recipe`) to demonstrate the developer terminal.
3. Return to **Landing Page** (`/`).

### 🎙️ Voiceover
> **"Finally, the Settings page gives teams complete control over their AutoPromo workspace.**
>
> Developers can manage SDK keys, workspace preferences, environment settings, quotas, and billing information from one place.
>
> We also provide a real-time **Live Terminal** where developers can monitor application events and promotional activity as it happens.
>
> AutoPromo is designed to fit directly into the modern developer workflow, while keeping the actual publishing decision in the hands of the user.
>
> **From product milestones, to AI-generated copy, to promotional artwork, and finally to publishing — AutoPromo turns every important moment in your application into an opportunity for growth.**
>
> **Thank you for watching, and welcome to the future of app promotion with AutoPromo SDK.**"
