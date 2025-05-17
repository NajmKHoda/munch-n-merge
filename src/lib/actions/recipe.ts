"use server";

import { sql } from '../sql';
import { generateMergedRecipe } from '../genai';
import { getUser } from './auth';

/**
 * Creates a new recipe in the database.
 * @param name - The name of the recipe.
 * @param description - An optional description of the recipe.
 * @param ingredients - An optional array of ingredients.
 * @param instructions - Optional instructions for preparing the recipe.
 * @returns An object with either:
 *          { id: number } containing the new recipe ID if successful, or
 *          { error: 'not-logged-in' | 'server-error' } if an error occurs.
 */
export async function createRecipe(
    name: string,
    description?: string,
    ingredients?: string[],
    instructions?: string
): Errorable<{ id: number }> {
    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };

        const recipe = await sql`INSERT INTO Recipe (name, authorId, description, ingredients, instructions)
            VALUES (${name}, ${user.id}, ${description || ''}, ${ingredients || []}, ${instructions || ''})
            RETURNING id`;
        return { id: recipe[0].id };
    } catch (e) {
        return { error: 'server-error' };
    }
}

/**
 * Retrieves a recipe by its ID.
 * @param id - The ID of the recipe to retrieve.
 * @returns An object with either:
 *          { recipe: Recipe } containing the requested recipe if found, or
 *          { error: 'not-found' | 'server-error' } if an error occurs.
 */
export async function getRecipe(id: number): Errorable<{ recipe: Recipe }> {
    try {
        const recipe = await sql`SELECT * FROM Recipe WHERE id = ${id}`;
        if (recipe.length === 0) return { error: 'not-found' };
        return { recipe: recipe[0] as Recipe };
    } catch (e) {
        return { error: 'server-error' };
    }
}

/**
 * Updates an existing recipe in the database.
 * @param id - The ID of the recipe to update.
 * @param name - An optional new name for the recipe.
 * @param description - An optional new description for the recipe.
 * @param ingredients - Optional new ingredients for the recipe.
 * @param instructions - Optional new instructions for the recipe.
 * @returns A string indicating the result of the operation:
 *          'success', 'not-logged-in', 'not-found', or 'server-error'.
 */
export async function updateRecipe(
    id: number,
    name?: string,
    description?: string,
    ingredients?: string[],
    instructions?: string
) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        const recipe = await sql`UPDATE Recipe SET
            name = COALESCE(${name}, name),
            description = COALESCE(${description}, description),
            ingredients = COALESCE(${ingredients}, ingredients),
            instructions = COALESCE(${instructions}, instructions)
            WHERE id = ${id} AND authorId = ${user.id}
            RETURNING id`;
        if (recipe.length === 0) return 'not-found';

        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

/**
 * Deletes a recipe from the database.
 * @param id - The ID of the recipe to delete.
 * @returns A string indicating the result of the operation:
 *          'success', 'not-logged-in', 'not-found', or 'server-error'.
 */
export async function deleteRecipe(id: number) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';
        
        const recipe = await sql`DELETE FROM Recipe
            WHERE id = ${id} AND authorId = ${user.id}
            RETURNING id`;
        if (recipe.length === 0) return 'not-found';

        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

/**
 * Merges multiple recipes into a single new recipe using AI generation.
 * @param ids - An array of recipe IDs to merge. Must include at least two IDs.
 * @param temperature - An optional temperature value for AI creativity (must be between 0 and 2, inclusive; higher values result in more creative outputs).
 * @returns An object with either:
 *          { id: number } containing the new merged recipe ID if successful, or
 *          { error: 'not-enough-recipes' | 'not-logged-in' | 'recipe-not-found' | 'generation-error' | 'invalid-temperature' | 'server-error' } if an error occurs.
 * 
 * Errors:
 * - 'not-enough-recipes': Fewer than two recipe IDs were provided.
 * - 'not-logged-in': The user is not logged in.
 * - 'recipe-not-found': One or more recipes were not found or do not belong to the user.
 * - 'generation-error': The AI failed to generate a merged recipe.
 * - 'invalid-temperature': The provided temperature value is outside the valid range (0 to 2).
 * - 'server-error': A server-side error occurred.
 */
export async function mergeRecipes(ids: number[], temperature?: number): Errorable<{ id: number }> {
    if (ids.length < 2) return { error: 'not-enough-recipes' };
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
        return { error: 'invalid-temperature' };
    }

    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };

        const recipes = (await sql`
            SELECT * FROM Recipe
            WHERE id IN (${ids.join(',')}) AND authorId = ${user.id}
        `) as Recipe[];
        if (recipes.length === 0) return { error: 'recipe-not-found' };

        const mergedRecipe = await generateMergedRecipe(recipes, temperature);
        if (mergedRecipe === null) return { error: 'generation-error' };

        const [{ id: mergedRecipeId }] = await sql`
            WITH MergedRecipe AS (
                INSERT INTO Recipe (name, authorId, description, ingredients, instructions)
                VALUES (
                    ${mergedRecipe.name},
                    ${user.id},
                    ${mergedRecipe.description},
                    ${JSON.stringify(mergedRecipe.ingredients)},
                    ${mergedRecipe.instructions}
                )
                RETURNING id
            )
            INSERT INTO RecipeLink (parentId, childId)
            SELECT parentId, (SELECT id FROM MergedRecipe)
            FROM UNNEST(${ids}::int[]) AS parentId
            RETURNING (SELECT id FROM MergedRecipe);
        `;

        return { id: mergedRecipeId };
    } catch (e) {
        return { error: 'server-error' };
    }
}

type Errorable<T> = Promise<Partial<T> & { error?: string }>;

export interface Recipe {
    id: number;
    authorId: number | null;
    name: string;
    description: string;
    ingredients: string[];
    instructions: string;
}