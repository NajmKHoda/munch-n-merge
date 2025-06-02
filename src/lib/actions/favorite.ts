"use server";

import { sql } from '../sql';
import { getUser } from './auth';
import { Errorable } from './types';

/**
 * Adds a recipe to the user's favorites.
 */
export async function addFavorite(recipeId: number) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        await sql`
            INSERT INTO recipefavorite (recipeId, userId)
            VALUES (${recipeId}, ${user.id})
            ON CONFLICT DO NOTHING
        `;

        return 'success';
    } catch (e) {
        console.error('Error adding favorite:', e);
        return 'server-error';
    }
}

/**
 * Removes a recipe from the user's favorites.
 */
export async function removeFavorite(recipeId: number) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        await sql`
            DELETE FROM recipefavorite
            WHERE recipeId = ${recipeId} AND userId = ${user.id}
        `;

        return 'success';
    } catch (e) {
        console.error('Error removing favorite:', e);
        return 'server-error';
    }
}

/**
 * Gets all recipe IDs that the current user has favorited.
 */
export async function getUserFavorites(): Errorable<{ favoriteRecipes: number[] }> {
    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };

        const favorites = await sql`
            SELECT recipeId FROM recipefavorite
            WHERE userId = ${user.id}
        ` as { recipeid: number }[];

        return { 
            favoriteRecipes: favorites.map(fav => fav.recipeid)
        };
    } catch (e) {
        console.error('Error fetching user favorites:', e);
        return { error: 'server-error' };
    }
}
