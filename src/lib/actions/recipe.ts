"use server";

import { sql } from '../sql';
import { generateMergedRecipe } from '../genai';
import { getUser } from './auth';
import type { Errorable } from './types';

/**
 * Creates a new recipe in the database.
 * @param name - The name of the recipe.
 * @param description - An optional description of the recipe.
 * @param ingredients - An optional string-string record ( name : quantity )
 * @param instructions - Optional instructions for preparing the recipe.
 * @returns An object with either:
 *          { id: number } containing the new recipe ID if successful, or
 *          { error: 'not-logged-in' | 'server-error' } if an error occurs.
 */
export async function createRecipe(
    name: string,
    description?: string,
    ingredients?: Record<string, string>,
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
        const recipes = await sql`
            SELECT r.*, u.username as authorName 
            FROM RecipeWithLikes r
            JOIN AppUser u ON r.authorId = u.id
            WHERE r.id = ${id}
        `;
        if (recipes.length === 0) return { error: 'not-found' };
        return { recipe: recipes[0] as Recipe };
    } catch (e) {
        console.error('Error fetching recipe:', e);
        return { error: 'server-error' };
    }
}

export async function getUserRecipes(): Errorable<{ recipes: Recipe[] }> {
    try {
        const user = await getUser();
        if (!user) {
            return { error: 'not-logged-in' };
        }

        const recipes = await sql`
            SELECT * FROM RecipeWithLikes WHERE authorId = ${user.id}
        ` as Recipe[];

        return { recipes };
    } catch (error) {
        console.error('Error fetching user recipes:', error);
        return { error: 'server-error' };
    }
}

/**
 * Updates an existing recipe in the database.
 * @param id - The ID of the recipe to update.
 * @param name - An optional new name for the recipe.
 * @param description - An optional new description for the recipe.
 * @param ingredients - Optional new ingredients for the recipe ( name : quantity ).
 * @param instructions - Optional new instructions for the recipe.
 * @returns A string indicating the result of the operation:
 *          'success', 'not-logged-in', 'not-found', or 'server-error'.
 */
export async function updateRecipe(
    id: number,
    name?: string,
    description?: string,
    ingredients?: Record<string, string>,
    instructions?: string
) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        const recipe = await sql`UPDATE Recipe SET
            name = COALESCE(${name}, name),
            description = COALESCE(${description}, description),
            ingredients = COALESCE(${JSON.stringify(ingredients)}, ingredients),
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
            WHERE id = ANY(${ids}) AND authorId = ${user.id}
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

/**
 * Merges multiple recipes (including others' recipes) into a single new recipe using AI generation.
 * This allows merging recipes that weren't created by the current user.
 * 
 * @param ids - An array of recipe IDs to merge. Must include at least two IDs.
 * @param temperature - An optional temperature value for AI creativity.
 * @returns An object with either:
 *          { id: number } containing the new merged recipe ID if successful, or
 *          { error: string } if an error occurs.
 */
export async function mergeWithExternalRecipes(ids: number[], temperature?: number): Errorable<{ id: number }> {
    if (ids.length < 2) return { error: 'not-enough-recipes' };
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
        return { error: 'invalid-temperature' };
    }

    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };
        
        // Get all recipes, including ones that don't belong to the user
        const recipes = (await sql`
            SELECT * FROM Recipe
            WHERE id = ANY(${ids})
        `) as Recipe[];

        if (recipes.length === 0) return { error: 'recipe-not-found' };

        const mergedRecipe = await generateMergedRecipe(recipes, temperature);
        if (mergedRecipe === null) return { error: 'generation-error' };

        // First, just create the merged recipe and return its ID
        const [{ id: mergedRecipeId }] = await sql`
            INSERT INTO Recipe (name, authorId, description, ingredients, instructions)
            VALUES (
                ${mergedRecipe.name},
                ${user.id},
                ${mergedRecipe.description},
                ${JSON.stringify(mergedRecipe.ingredients)},
                ${mergedRecipe.instructions}
            )
            RETURNING id
        `;
        
        // Then insert recipe links one by one to avoid duplicate key errors
        for (const parentId of ids) {
            try {
                await sql`
                    INSERT INTO RecipeLink (parentId, childId)
                    VALUES (${parentId}, ${mergedRecipeId})
                    ON CONFLICT DO NOTHING
                `;
            } catch (e) {
                console.log(`Skipping duplicate link for parent ${parentId} -> child ${mergedRecipeId}`);
            }
        }

        return { id: mergedRecipeId };
    } catch (e) {
        console.error("Error merging with external recipes:", e);
        return { error: 'server-error' };
    }
}

export interface Recipe {
  id: number;
  title: string;
  name: string;
  description: string;
  ingredients: string;
  createdAt: Date;
  likeCount: number;
  authorId: number;
  authorName: string; // this now maps to u.username
};
