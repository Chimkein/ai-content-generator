# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hans and a small circle of friends who create social media content. Non-technical users who want to turn raw content (videos, images, text ideas) into ready-to-post social media captions and teaser visuals without learning design tools or paying for subscriptions.

## Product Purpose

Turn videos, images, and text into social-media-ready captions and teaser images/videos in one workflow. Exists to eliminate the friction between having content and having a polished post. Success means: paste/upload content, get 3 caption variations + teaser images, pick favorites, and post — all in under a minute.

## Positioning

Two things together that no free tool combines: (1) an all-in-one workflow that generates captions, teaser images, and Ken Burns teaser videos from a single input, and (2) an entirely free AI stack — Gemini Flash, Groq (Llama/Qwen/GPT-OSS), and Pollinations.ai — with automatic model fallback so rate limits never block the user.

## Operating Context

Used on desktop and mobile browsers. Typical flow: upload content or paste text on the Create page, configure tone/length/language, generate, review 3 caption variations and 1-3 teaser images, crop/select favorites, save to a folder or share directly to a platform. History and analytics pages track past generations. Settings page stores defaults for repeat use.

## Capabilities and Constraints

- Caption generation: 4 AI models with automatic fallback chain (Gemini Flash → Qwen 3.6 27B → Llama 3.3 70B → GPT-OSS 120B)
- Image generation: 7 models (6 Pollinations.ai + 1 Gemini) with style/aspect-ratio control
- Video processing: Gemini Files API for video-to-caption; client-side Ken Burns for teaser video
- Image cropping: client-side with aspect ratio presets
- Organization: folder-based history, pinning/favorites, analytics with streaks
- Sharing: platform-specific formatting (Instagram, Twitter/X, Facebook, TikTok, LinkedIn)
- Auth: Google OAuth via Supabase
- Storage: Supabase Storage with signed URLs for generated images
- Constraint: all AI services must remain free-tier. No paid API keys.
- Constraint: single-user auth model (Google OAuth), no team/org features

## Brand Commitments

- Name: AI Content Gen (displayed in sidebar and landing page header)
- Fonts: Sora (headings), Outfit (body)
- Icons: Phosphor Icons (exclusively — no other icon library)
- Color: indigo-tinted oklch palette

## Evidence on Hand

- Deployed at https://ai-contentgen-app.vercel.app
- Supabase project: Chimkein's Project (ap-south-1)
- No testimonials, case studies, or marketing assets exist. Do not fabricate any.

## Product Principles

1. **Zero cost, zero friction** — every AI service is free-tier; the user never hits a paywall or setup step.
2. **One input, complete output** — a single upload yields captions, images, and video; never make the user context-switch between tools.
3. **Smart defaults, full control** — settings remember preferences, but every option (tone, model, style, count) is one tap away.
4. **Fail gracefully** — rate limits trigger automatic model fallback, not error screens.
5. **Keep it simple** — no enterprise patterns, no multi-tenant, no premature abstraction. Build incrementally.

## Accessibility & Inclusion

No product-specific accessibility requirements established yet. Multi-language caption support exists (English, Filipino, Cebuano, Taglish).
