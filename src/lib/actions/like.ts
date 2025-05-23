"use server";

import { sql } from '../sql';
import { getUser } from './auth';

/**
 * Adds a like to a recipe for the logged-in user.
 * @param id - The ID of the recipe to like.
 * @returns A string indicating the result of the operation:
 *          'success', 'not-logged-in', or 'server-error'.
 */
export async function likeRecipe(id: number) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        await sql`
            INSERT INTO RecipeLike (recipeId, userId)
            VALUES (${id}, ${user.id})
            ON CONFLICT DO NOTHING 
        `;

        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

/**
 * Removes a like from a recipe for the logged-in user.
 * @param id - The ID of the recipe to unlike.
 * @returns A string indicating the result of the operation:
 *          'success', 'not-logged-in', or 'server-error'.
 */
export async function unlikeRecipe(id: number) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        await sql`
            DELETE FROM RecipeLike
            WHERE recipeId = ${id} AND userId = ${user.id}
        `;

        return 'success';
    } catch (e) {
        return 'server-error';
    }
}