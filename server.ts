/**
 * MealMind AI server.ts - Full-stack entrypoint integrating Vite & Express & Gemini API
 */
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { validatePlannerInput, sanitizeIngredientsList } from './src/utils/validation';

dotenv.config();

// Port must be 3000
const PORT = 3000;

// Lazy initialization of Gemini API standard client to avoid startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === '') {
      throw new Error('GEMINI_API_KEY environment variable is not set. Please add your GEMINI_API_KEY in the Secrets panel.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API log helper
  app.use((req, _res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // POST /api/mealplan - Single Gemini request returning structured JSON
  app.post('/api/mealplan', async (req: Request, res: Response) => {
    try {
      const input = req.body;
      
      // 1. Server-side validation check
      const validation = validatePlannerInput(input);
      if (!validation.isValid) {
        res.status(400).json({ error: Object.values(validation.errors)[0] });
        return;
      }

      // 2. Format / sanitize inputs
      const budget = Number(input.dailyBudget);
      const size = Number(input.familySize);
      const diet = input.dietPreference;
      const available = sanitizeIngredientsList(input.availableIngredients || '');
      const cTime = Number(input.cookingTimeAvailable);
      const dType = input.dayType;

      // Initialize API key and check if available
      let ai;
      try {
        ai = getGeminiClient();
      } catch (keyError: any) {
        console.error('[API KEY FAILURE]', keyError);
        res.status(503).json({
          error: 'Meal planning service is temporarily offline due to configuration requirements. Please check your system settings.'
        });
        return;
      }

      // 3. Construct descriptive prompt
      const prompt = `You are a professional nutritionist, budget cooking chef, and zero-waste kitchen organizer.
Build a comprehensive one-day cooking to-do list and meal planner matching these strict constraints:
- Family/Group Size: ${size} people
- Daily Budget: $${budget} (this is the absolute cap for ingredients we need to buy)
- Diet Preference: ${diet}
- Available Ingredients in kitchen (Already available, do not purchase unless we need more): ${available || 'None'}
- Safe Cooking Time: ${cTime} minutes across the whole day (Breakfast, Lunch, Dinner preparation combined)
- Day Type: ${dType} (Optimize complexity; e.g. Weekend can have more elaborate preparation steps; Working Day must be highly efficient/quick)

IMPORTANT RULES FOR THE GENERATION:
1. Costs MUST be estimated for the full family of ${size} people, NOT per-person.
2. Estimated Daily Cost is the total estimated cost of Breakfast + Lunch + Dinner for the entire family of ${size} people.
3. Split ingredients strictly in "groceryList":
   - "alreadyAvailable": list ingredients from the user's available list that are actually used in the recipes.
   - "needToBuy": list ingredients required but not already available. Estimate realistic quantities and costs for a family of ${size}.
4. Target Daily Cost comparison against Budget of $${budget}:
   - If Estimated Daily Cost <= $${budget} * 0.85: Status is "Within Budget"
   - If $${budget} * 0.85 < Estimated Daily Cost <= $${budget}: Status is "Near Limit"
   - If Estimated Daily Cost > $${budget}: Status is "Over Budget"
5. Provide substitutions for common/expensive ingredients or user diet preferences (e.g. Tomato -> Tamarind, Paneer -> Tofu, Milk -> Soy Milk).
6. Provide high-quality step-by-step instructions for each meal that fit within the ${cTime} minutes cooking constraint.

Generate an absolute-precise response matching the required JSON schema. Do not include markdown wraps like \`\`\`json outside the returned json string.`;

      // 4. Define Response Schema using standard `@google/genai` type definitions
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          breakfast: {
            type: Type.OBJECT,
            properties: {
              mealName: { type: Type.STRING, description: 'Descriptive or traditional name of the breakfast meal model' },
              prepTime: { type: Type.STRING, description: 'Preparation and cooking duration, e.g. "15 mins"' },
              cost: { type: Type.NUMBER, description: 'Estimated cost in USD of ingredients for this meal for the family size' },
              description: { type: Type.STRING, description: 'Short overview of the meal' },
              recipeSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3-5 clear instructions for cooking the meal'
              }
            },
            required: ['mealName', 'prepTime', 'cost', 'description', 'recipeSteps']
          },
          lunch: {
            type: Type.OBJECT,
            properties: {
              mealName: { type: Type.STRING, description: 'Descriptive name of the lunch meal' },
              prepTime: { type: Type.STRING, description: 'Cooking time e.g. "20 mins"' },
              cost: { type: Type.NUMBER, description: 'Estimated cost in USD for the family size' },
              description: { type: Type.STRING, description: 'Overview of the meal' },
              recipeSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Step by step cooking guidelines'
              }
            },
            required: ['mealName', 'prepTime', 'cost', 'description', 'recipeSteps']
          },
          dinner: {
            type: Type.OBJECT,
            properties: {
              mealName: { type: Type.STRING, description: 'Descriptive name of the dinner meal' },
              prepTime: { type: Type.STRING, description: 'Cooking time e.g. "25 mins"' },
              cost: { type: Type.NUMBER, description: 'Estimated cost in USD for the family size' },
              description: { type: Type.STRING, description: 'Overview of the meal' },
              recipeSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Step by step cooking guidelines'
              }
            },
            required: ['mealName', 'prepTime', 'cost', 'description', 'recipeSteps']
          },
          groceryList: {
            type: Type.OBJECT,
            properties: {
              alreadyAvailable: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Ingredients provided by the user that were actually utilized'
              },
              needToBuy: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Name of the ingredient to buy' },
                    estimatedCost: { type: Type.NUMBER, description: 'Total cost in USD for the family size' },
                    quantity: { type: Type.STRING, description: 'Needed quantity e.g., "500g", "1 liter"' }
                  },
                  required: ['name', 'estimatedCost', 'quantity']
                },
                description: 'Ingredients not provided by the user that are mandatory to buy'
              }
            },
            required: ['alreadyAvailable', 'needToBuy']
          },
          substitutions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING, description: 'Ingredient proposed replacement' },
                substitute: { type: Type.STRING, description: 'Suggested replacement ingredient' },
                reason: { type: Type.STRING, description: 'Brief explanation for substitutions (saving, waste avoidance, diet restriction)' }
              },
              required: ['original', 'substitute', 'reason']
            },
            description: '3 useful substitution options custom to user inputs'
          },
          budgetAnalysis: {
            type: Type.OBJECT,
            properties: {
              estimatedDailyCost: { type: Type.NUMBER, description: 'Sum of costs of breakfast, lunch, and dinner' },
              remainingBudget: { type: Type.NUMBER, description: 'Daily Budget minus Estimated Daily Cost value' },
              budgetStatus: { 
                type: Type.STRING, 
                description: 'Must match one of: "Within Budget", "Near Limit", "Over Budget"' 
              },
              feasibilityExplanation: { type: Type.STRING, description: 'Constructive analysis of how ingredients match budget limits' },
              savingsTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3 customized frugal cooking tips tailored to the diet'
              }
            },
            required: ['estimatedDailyCost', 'remainingBudget', 'budgetStatus', 'feasibilityExplanation', 'savingsTips']
          }
        },
        required: ['breakfast', 'lunch', 'dinner', 'groceryList', 'substitutions', 'budgetAnalysis']
      };

      // 5. Query standard gemini-3.5-flash with JSON mode
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.2, // low temperature for precise facts and adherence to rules
        },
      });

      const responseText = response.text ? response.text.trim() : '';
      if (!responseText) {
        throw new Error('Gemini API returned an empty output stream.');
      }

      // Safe parse
      const parsedData = JSON.parse(responseText);
      res.json(parsedData);
    } catch (apiError: any) {
      console.error('[GEMINI ERROR]', apiError);
      res.status(500).json({ 
        error: 'We encountered a problem generating your custom meal plan. Please check your inputs and try again downstream.' 
      });
    }
  });

  // Vite Integration for development / Serving build assets in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Fallback
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] MealMind AI running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER CRASH]', err);
});
