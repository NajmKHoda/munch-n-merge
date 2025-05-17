import { GoogleGenAI, Type } from '@google/genai';
import { Recipe } from './actions/recipe';

export const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

// DO NOT CALL THIS FUNCTION FROM THE FRONT-END. It is intended for server-side use only.
// If you want to merge recipes, call `mergeRecipes` in `/actions/recipe.ts` instead.
export async function generateMergedRecipe(recipes: Recipe[], temperature?: number) {
    try {
        const serializedRecipeList = JSON.stringify(
            recipes.map(recipe => ({
                name: recipe.name,
                description: recipe.description,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
            })), null, '    ' // 4 spaces
        );

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `
                You are a recipe generator. Given the following recipes, create a new recipe that combines their
                ingredients and instructions to make a creative, delicious dish.

                Input:
                [
                    {
                        "name": "Chocolate Cake",
                        "description": "A rich chocolate cake.",
                        "ingredients": { "flour": "2 cups", "sugar": "1 cup", "cocoa powder": "1/2 cup" },
                        "instructions": "Mix all ingredients and bake at 350 degrees Fahrenheit for 30 minutes."
                    },
                    {
                        "name": "Vanilla Ice Cream",
                        "description": "A creamy vanilla ice cream.",
                        "ingredients": { "milk": "2 cups", "cream": "1 cup", "sugar": "3/4 cup", "vanilla extract": "1 tbsp" },
                        "instructions": "Mix all ingredients and churn in an ice cream maker."
                    }
                ]

                Output:
                {
                    "name": "Chocolate Vanilla Delight",
                    "description": "A delicious chocolate cake topped with creamy vanilla ice cream.",
                    "ingredients": { "flour": "2 cups", "sugar": "1 cup", "cocoa powder": "1/2 cup", "milk": "2 cups", "cream": "1 cup", "vanilla extract": "1 tbsp" },
                    "instructions": "Mix the cake ingredients and bake at 350 degrees Fahrenheit for 30 minutes. Serve with a scoop of vanilla ice cream on top."
                }

                Input:
                ${serializedRecipeList}

                Output:
            `,
            config: {
                temperature,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        ingredients: {
                            type: Type.OBJECT,
                            description: `Key-value pairs of ingredient names and their quantities.
                            Example: { "flour": "2 cups", "sugar": "1 tbsp" }`
                        },
                        instructions: { type: Type.STRING }
                    },
                    propertyOrdering: ['name', 'description', 'ingredients', 'instructions']
                }
            }
        });

        return response.text ? JSON.parse(response.text) as MergedRecipe : null;

    } catch (error) {
        console.error('Error merging recipes:', error);
        return null;
    }
}

interface MergedRecipe {
    name: string;
    description: string;
    ingredients: Record<string, string>;
    instructions: string;
}