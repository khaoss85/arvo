# Solo Founder Building AI Fitness Coach - 6 Months In, Here's What I Learned

**TL;DR:** I'm 6 months into building ARVO, an AI-powered workout coach that costs $15/mo instead of $150/session. Pre-revenue, in beta, learning a ton about the AI + fitness market. Here's what's working, what's not, and what surprised me.

---

## What I Built

**ARVO** is an AI coaching app that gives you real-time, set-by-set workout guidance—like having a personal trainer in your pocket. It's built for serious lifters who follow specific training methodologies (think evidence-based approaches, periodization, progressive overload) but can't afford or don't want a $150/session trainer.

Instead of generic "do 3x10" programs, ARVO uses 17+ specialized AI agents to:
- Select exercises based on your weak points, equipment, and injury history
- Suggest weight and reps for each set based on your previous performance
- Adapt your workout in real-time when you're having a bad (or great) day
- Explain WHY it's making every suggestion (transparency builds trust)

**Target market:** Intermediate-to-advanced lifters, data-driven people who currently use Excel or generic apps and want something smarter.

## The Journey So Far

I started building ARVO 6 months ago because I was frustrated. I'd been tracking workouts in Excel for 10 years—formulas for everything, macros for progression—but Excel can't tell when I'm tired. It can't suggest "drop 5kg on this set because you left too much in the tank on the last one."

Personal trainers can do this, but at $150/session, that's $600-900/month for 4-6 sessions. Not sustainable for most people.

**Solo founder, full-stack dev, first real product.** I've been coding for years but always for clients/employers. This is my first attempt at building something people pay for.

**Current stage:** Beta with early users. Pre-revenue, but pricing model is clear: $15/mo (or annual plans with discount). Roughly 1/10th the cost of a monthly PT package.

**Tech stack:** Next.js 14, TypeScript, OpenAI Responses API (GPT-5), Supabase. Mobile-first web app (PWA-like features, no app store headaches).

## Early Traction & What I'm Seeing

**I can't share big MRR numbers (pre-revenue)**, but here's what I AM seeing:

- **Beta users completing 70-80% of suggested workouts** (vs ~40% completion for generic app templates based on industry benchmarks)
- **Average session: 65 minutes** (users are actually using it in the gym, not just logging)
- **Feedback:** "This is the first app that explains WHY I should do something" (transparency is huge)
- **Problem validation:** Every serious lifter I talk to has the same pain—spreadsheets work until they don't, apps are too generic, trainers are too expensive

**Pricing plan:**
- $15/mo base tier (unlimited workouts, basic AI coaching)
- $25/mo pro tier (audio coaching, advanced analytics, injury tracking)
- Annual plans at 20% discount
- Launch plan: Free beta → paid launch in ~1-2 months

**Why I'm confident about monetization:** People already pay $10-20/mo for inferior apps (Strong, JEFIT, etc.). If I can deliver 10x value with AI, $15 is a no-brainer.

## 5 Key Lessons Learned (6 Months In)

### 1. The AI + Fitness Market Is Bigger Than I Thought (But Crowded)

**Surprise:** Everyone and their dog is building "AI fitness apps" right now.

**Reality check:** Most are GPT wrappers that generate generic programs. They don't understand training methodologies, don't adapt in real-time, don't explain reasoning.

**My edge:** I spent 6 months building a parametric knowledge engine—362 lines of rules for the Kuba Method, 532 lines for Mentzer HIT. My AI interprets proven methodologies, not making stuff up. This takes TIME to build, which is my moat.

**Lesson:** Don't compete on "we use AI." Compete on "we use AI to solve this SPECIFIC problem better than anyone else."

### 2. Solo Founding Is Lonely AF (But Forcing Me to Ship Fast)

**Hardest part:** No one to validate ideas with. No co-founder to handle the stuff I hate (marketing, content, community).

**Benefit:** I make decisions FAST. No alignment meetings. I ship features in days, not weeks.

**What's helping:**
- Building in public on Twitter (accountability, feedback)
- Indie Hackers community (you all get it)
- Beta users who actually care and give feedback
- Talking to users 1-on-1 every week (Zoom calls, gym visits)

**Lesson:** Solo founding is a trade-off. You move fast but carry all the weight. I'm okay with this for now, but I'll need help scaling distribution.

### 3. AI Latency Almost Killed My Product (Then I Fixed It)

**Technical lesson with business impact:**

Early on, users waited 5-10 seconds between sets for AI suggestions. That's FOREVER when you're mid-workout. Beta users said "this is cool but too slow."

**Fix:** I switched to OpenAI's Responses API with configurable reasoning levels. Now my progression calculator uses `reasoning='none'` for <2s responses. Workout planning (once at start) uses `reasoning='medium'` for deeper thinking.

**Result:** Beta users stopped complaining about latency. Completion rates jumped.

**Lesson:** In real-time apps (fitness, gaming, anything gym/field-based), latency is a KILLER. Optimize for speed where it matters, depth where you have time.

### 4. Distribution Is Harder Than Building (And I'm Still Figuring It Out)

**What I've tried:**
- ✅ **Twitter/X:** Small following but engaged (fitness + AI intersection)
- ✅ **Reddit (r/fitness, r/bodybuilding):** Hit-or-miss. Got some good beta users, some "another AI app" hate
- ❌ **Paid ads:** Tried Meta ads, burned $200, got 2 signups. Too early, CPA too high
- ✅ **1-on-1 outreach:** DM'd 50+ serious lifters on Twitter, 10 became beta users
- ✅ **Content:** Writing about AI + training on my blog, slowly building SEO

**What's working best right now:** Direct outreach to people who already care (serious lifters on Twitter/Reddit). Paid ads are a no-go at this stage.

**Current strategy:** Build in public, create valuable content (training + AI insights), get featured on fitness/AI podcasts, leverage communities like this one.

**Lesson:** Early-stage products need high-intent users, not spray-and-pray ads. Go where your users already are and be helpful.

### 5. Users Don't Care About Features—They Care About Outcomes

**What I thought would sell:** "17+ AI agents! Parametric knowledge engine! Multi-turn CoT persistence!"

**What actually resonates:** "Get stronger without a $150/session trainer. AI that explains its reasoning so you understand what you're doing."

**Beta user quote:** "I don't care how the AI works. I care that it WORKS and I understand WHY I'm doing what I'm doing."

**Lesson:** Developers (me) love technical details. Users love OUTCOMES and TRUST. Lead with value, not tech stack.

## Biggest Challenges Right Now

**1. User Acquisition**
I'm good at building, terrible at marketing. I need to get better at content, SEO, community building. Current plan: write more, engage more, ship features that get people talking.

**2. Monetization Timing**
Do I stay free longer to build user base? Or charge now to validate willingness to pay? Leaning toward charging in 1-2 months once I hit feature completeness for v1.

**3. Keeping Motivation High Solo**
Some days I wake up fired up. Other days I wonder if anyone will actually pay for this. Building in public helps, but it's a mental game.

## What's Next

**Immediate goals (next 2 months):**
- Get to 100 beta users (currently ~30)
- Launch paid tiers and validate $15-25/mo pricing
- Ship audio coaching feature (users are asking for this)
- Build content pipeline (blog, YouTube, Twitter threads)

**6-month goal:**
- $2-5K MRR
- 200-500 paying users
- Strong organic acquisition channel (SEO or community-driven)

**Dream scenario:**
- ARVO becomes the go-to AI coach for serious lifters
- $10-20K MRR by month 12
- Sustainable solo founder lifestyle business (or seed for scaling)

## Looking for Early Users (And Your Advice)

**If you're a serious lifter who:**
- Tracks workouts (even in Excel/notes)
- Follows a training methodology (not just winging it)
- Wants AI coaching but can't afford/doesn't want a PT
- Values data and understanding WHY you're doing something

**→ I'd love for you to try ARVO:** [arvo.guru](https://arvo.guru)

It's free during beta. I'm actively iterating based on feedback (literally shipping fixes/features daily based on what users say).

## Questions for the Community

I'd love your thoughts on a few things:

**1. Distribution for fitness/health apps:**
What worked for you? I'm struggling with paid ads at this stage. Is it just too early, or am I targeting wrong?

**2. Monetization timing:**
How long did you stay free/beta before charging? I'm at 6 months, 30 beta users. Should I charge now or wait for more traction?

**3. AI + vertical markets:**
Anyone else building AI tools for specific industries (fitness, nutrition, productivity, etc.)? What surprised you about your market?

**4. Solo founder sustainability:**
How do you keep motivation high when you're the only one who cares about your product? What works for you?

---

**Thanks for reading!** I know this is long, but I wanted to share the real journey—not just the highlight reel. Happy to answer questions, take feedback, or just commiserate about the solo founder grind.

If you've built in the fitness/AI space, or you're a serious lifter who might benefit from ARVO, let's connect. Always happy to learn and help where I can.

_Building in public: [@your_twitter] (if you have one)_
_Product: [arvo.guru](https://arvo.guru)_
