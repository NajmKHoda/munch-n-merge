import { GoogleGenAI, Type } from '@google/genai';
import { Recipe } from './actions/recipe';

export const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

// DO NOT CALL THIS FUNCTION FROM THE FRONT-END. It is intended for server-side use only.
// If you want to merge recipes, call mergeRecipes in /actions/recipe.ts instead.
export async function generateMergedRecipe(recipes: Recipe[], temperature?: number) {
    try {
        const serializedRecipeList = recipes.map(recipeToGeminiFormat).join(',\n');

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `
                You are a recipe generator. Given the following recipes, create a new recipe that combines their
                ingredients and instructions to make a creative, delicious dish. Ensure that the instructions follow
                a clear, numbered order separated by newlines.

                Also assign a difficulty level: "Easy", "Medium", or "Hard" based on the complexity of ingredients and steps.

                Input:
                [
                    {
                        "name": "Chocolate Cake",
                        "description": "A rich chocolate cake.",
                        "ingredients": [
                            { "name": "flour", "quantity": "2 cups" },
                            { "name": "sugar", "quantity": "1 cup" },
                            { "name": "cocoa powder", "quantity": "1/2 cup" }
                        ],
                        "instructions": "Mix all ingredients and bake at 350 degrees Fahrenheit for 30 minutes."
                    },
                    {
                        "name": "Vanilla Ice Cream",
                        "description": "A creamy vanilla ice cream.",
                        "ingredients": [
                            { "name": "milk", "quantity": "2 cups" },
                            { "name": "cream", "quantity": "1 cup" },
                            { "name": "sugar", "quantity": "3/4 cup" },
                            { "name": "vanilla extract", "quantity": "1 tbsp" }
                        ],
                        "instructions": "Mix all ingredients and churn in an ice cream maker."
                    }
                ]

                Output:
                {
                    "name": "Chocolate Vanilla Delight",
                    "description": "A delicious chocolate cake topped with creamy vanilla ice cream.",
                    "ingredients": [
                        { "name": "flour", "quantity": "2 cups" },
                        { "name": "sugar", "quantity": "1 cup" },
                        { "name": "cocoa powder", "quantity": "1/2 cup" },
                        { "name": "milk", "quantity": "2 cups" },
                        { "name": "cream", "quantity": "1 cup" },
                        { "name": "vanilla extract", "quantity": "1 tbsp" }
                    ],
                    "instructions": "1. Mix the cake ingredients and bake at 350 degrees Fahrenheit for 30 minutes.\n2. Serve with a scoop of vanilla ice cream on top.",
                    "difficulty": "Medium"
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
                            type: Type.ARRAY,
                            description: `Array of ingredient objects, each with a name and quantity.
                            Example: [ { "name": "flour", "quantity": "2 cups" }, { "name": "sugar", "quantity": "1 tbsp" } ]`,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    quantity: { type: Type.STRING }
                                }
                            }
                        },
                        instructions: { type: Type.STRING },
                        difficulty: {
                            type: Type.STRING,
                            description: 'Overall difficulty of the recipe. One of: "Easy", "Medium", "Hard".'
                        }
                    },
                    propertyOrdering: ['name', 'description', 'ingredients', 'instructions', 'difficulty']
                }
            }
        });
        console.log('Response from Gemini:', response.text);
        if (!response.text) return null;

        const geminiRecipe: GeminiMergedRecipe = JSON.parse(response.text);
        return recipeFromGeminiFormat(geminiRecipe);
    } catch (error) {
        console.error('Error merging recipes:', error);
        return null;
    }
}

function recipeToGeminiFormat(recipe: Recipe): string {
    return JSON.stringify({
        name: recipe.name,
        description: recipe.description,
        ingredients: Object.entries(recipe.ingredients)
            .map(([name, quantity]) => ({ name, quantity })),
        instructions: recipe.instructions
    }, null, '    ');
}

function recipeFromGeminiFormat(recipe: GeminiMergedRecipe): MergedRecipe {
    return {
        name: recipe.name,
        description: recipe.description,
        ingredients: Object.fromEntries(recipe.ingredients
            .map(ing => [ing.name, ing.quantity])),
        instructions: recipe.instructions,
        difficulty: recipe.difficulty
    };
}

interface GeminiMergedRecipe {
    name: string;
    description: string;
    ingredients: { name: string; quantity: string }[];
    instructions: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface MergedRecipe {
    name: string;
    description: string;
    ingredients: Record<string, string>;
    instructions: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}