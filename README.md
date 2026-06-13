# MealMind AI 🥦

> Plan meals. Save money. Reduce waste.

MealMind AI is an award-winning, responsive culinary micro-application designed as a production-grade hackathon submission. It empowers families to design healthy eating schedules, manage kitchen inventory, avoid waste, and optimize financial budgets through structured, deterministically parsed artificial intelligence.

---

## 📖 Problem Statement & Solution

### The Problem
Households generate significant food waste daily, often buying redundant ingredients while failing to utilize items already resting in their pantries. At the same time, planning nutritious meals that fit family size constraints and financial budgets remains a manually intensive, confusing challenge.

### The Solution: MealMind AI
MealMind AI resolves this by acting as a modern, structured kitchen workspace. It takes an individual's target budget, family size, diet preferences, available kitchen items, and daily preparation time, and instantly cooks up:
1. **Dynamic Meal Schedules**: Time-efficient instructions for breakfast, lunch, and dinner.
2. **Integrated Grocery Lists**: Smart comparison separating existing pantry foods from missing items that need purchase.
3. **Budget Status feasibility**: Instant categorical warnings checking real costs against target boundaries.
4. **Frugal substitutions**: Smart recipe swaps preserving dietary constraints and reducing expenditure.

---

## 🏛️ System Architecture

MealMind AI is architected as a highly modular, secure full-stack React + Node.js Express application running seamlessly in sandboxed containers on the Cloud Run platform.

```
src/
├── types/
│   └── mealPlan.ts            # Strict standard type schemas and interfaces
├── utils/
│   ├── validation.ts          # Input checks and sanitization engines
│   └── tests.ts               # Programmatic execution unit assertions
├── services/
│   └── mealPlannerService.ts   # Network API adapters and error controllers
├── components/
│   ├── Header.tsx             # Navigation toolbar & control benchmarks
│   ├── MealPlanForm.tsx       # Semantic inputs form featuring type checking
│   ├── MealCard.tsx           # Scaled breakfast/lunch/dinner recipe guides
│   ├── GroceryView.tsx        # Shopping list manager with task checkboxes
│   ├── BudgetSummaryView.tsx  # Piggybank cost charts & savings tips
│   ├── SubstitutionGrid.tsx   # Swap cards showing replacement food items
│   ├── HelpView.tsx           # Program assistance and user manual modal
│   └── TestQAView.tsx         # Clickable browser testing sandbox interface
├── App.tsx                    # Main layout coordinator and state engine
└── index.css                  # Tailwinds style sheet featuring Inter/JetBrains fonts
```

---

## 🛡️ Security Implementations (`SECURITY.md`)

- **Secure API Isolation**: No API keys are exposed to the browser. All generative requests proxy through our lazy-initialized Express backend endpoint.
- **HTML Injection Filters**: Replaces script-injection threat sequences (e.g. `<script>`, `;`, `'`) with safe, normal text strings.
- **Strict Bounding Controls**: Enforces strict mathematical limits (budget > 0, family size integers from 1 up to 50 members) to prevent memory overflows.
- **Fallback Boundaries**: Programmatic Error Boundaries catch unexpected runtime errors gracefully.

---

## ⚡ Performance Optimizations (`EFFICIENCY.md`)

- **Single Gemini Dispatch Pattern**: Requests all menu details, grocery calculations, and category checks in **one single, structured API call** using JSON model constraints, avoiding expensive chat loops.
- **Deterministic Response Schema**: Configures the `@google/genai` TypeScript SDK `responseSchema` parameters to eliminate parser failures and cut token usage.
- **Response Caching**: Caches user forms and active generated meal plans in `localStorage`, maintaining structural data even during offline refreshes.

---

## ♿ WCAG 2.2 AA Compliance (`ACCESSIBILITY.md`)

- **Semantic Layouts**: Organizes layout components within standard structural landmarks (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`).
- **Focus Indicators**: Includes high-contrast visible focus highlights (`focus-visible:ring-emerald-500`) for seamless keyboard interactions.
- **Aesthetic Pointer Sizing**: Maintains minimum 44px touch targets on mobile viewports.
- **Status Contrast**: Combines both color badges AND explicit text indicators (e.g. "Within Budget") so status is readable by colorblind users.

---

## 🧪 Testing Suite (`TESTING.md`)

MealMind AI houses an **interactive Unit Test QA Sandbox** right in the application:
1. Open the drawer by selection **"Suite Tests"** in the navigation bar.
2. Click **"Execute Suite Tests"** to run programmatic assertions inspecting:
   - Budget feasibility calculations.
   - HTML/Injection tag filters.
   - Parent level boundary validations.
   - Meal plan schema structures.
3. Fully green assertion marks verify strict mathematical correctness in real time.

---

## 🚀 Setup & Launch Instructions

### Prerequisites
- **Node.js** v20+ / NPM installed.
- **Gemini API Key** (Set inside system secrets or `.env` configuration file).

### Local Execution

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Setup environment parameters**:
   Create a `.env` in root mirroring `.env.example`:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   APP_URL="http://localhost:3000"
   ```
3. **Boot local server**:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
# Clean, compile client assets and bundle backend server
npm run build

# Start stand-alone high performance production server
npm run start
```

---

## 🔮 Future Roadmap and Scope
- **Google Calendar Sync**: Add scheduled meal reminders and preparation times directly using Google Workspace OAuth integration.
- **Voice Cooking Helper**: Implement conversational, step-by-step cooking assistants utilizing the Gemini Live API.
- **Dynamic OCR Pantry Upload**: Take photos of receipts or raw ingredients inside the fridge to upload inventory instantly.
# MealMind-AI
