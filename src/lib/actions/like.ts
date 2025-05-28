"use server";

import { sql } from '../sql';
import { getUser } from './auth';
import { Errorable } from './types';

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

/**
 * Gets all recipe IDs that the current user has liked.
 * @returns An object with either:
 *          { likedRecipes: number[] } containing the IDs of recipes the user has liked, or
 *          { error: 'not-logged-in' | 'server-error' } if an error occurs.
 */
export async function getUserLikes(): Errorable<{ likedRecipes: number[] }> {
    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };

        const likes = await sql`
            SELECT recipeId FROM RecipeLike
            WHERE userId = ${user.id}
        ` as { recipeid: number }[];

        return { 
            likedRecipes: likes.map(like => like.recipeid)
        };
    } catch (e) {
        console.error('Error fetching user likes:', e);
        return { error: 'server-error' };
    }
}