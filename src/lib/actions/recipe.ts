"use server";

import { sql } from '../sql';
import { getUser } from './auth';

/**
 * Creates a new recipe in the database.
 * @param name - The name of the recipe.
 * @param description - An optional description of the recipe.
 * @param ingredients - An optional record of ingredients and their quantities.
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
            VALUES (${name}, ${user.id}, ${description || ''}, ${ingredients || {}}, ${instructions || ''})
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
    ingredients?: Record<string, string>,
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
 * Retrieves all recipes from the database.
 * @returns An object with either:
 *          { recipes: Recipe[] } containing all recipes, or
 *          { error: 'server-error' } if an error occurs.
 */
export async function getAllRecipes(): Errorable<{ recipes: Recipe[] }> {
    try {
        const recipes = await sql`
            SELECT r.*, u.username as authorName 
            FROM Recipe r 
            LEFT JOIN AppUser u ON r.authorId = u.id 
            ORDER BY r.id DESC`;
        return { recipes: recipes as (Recipe & { authorName: string })[] };
    } catch (e) {
        return { error: 'server-error' };
    }
}

type Errorable<T> = Promise<Partial<T> & { error?: string }>;

interface Recipe {
    id: number;
    authorId: number | null;
    name: string;
    description: string;
    ingredients: Record<string, string>;
    instructions: string;
}