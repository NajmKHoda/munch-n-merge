"use server";

import { sql } from '../sql';
import { getUser } from './auth';
import { Recipe } from './recipe';
import { Errorable } from './types';

const MAX_FEED_LIMIT = 100;
const MAX_FEED_DEPTH = 5;

/**
 * Retrieves a feed of recipes based on the user's network and specified parameters.
 * 
 * This function uses a recursive SQL query to construct the user's social network up to the specified depth.
 * It then fetches recipes authored by users in the network, excluding the logged-in user, and filters them
 * by the `afterDate` parameter. The results are paginated using the `limit` and `offset` parameters.
 * 
 * @param depth - The maximum depth of the user's network to include in the feed.
 * @param afterDate - Only include recipes created after this date.
 * @param limit - The maximum number of recipes to retrieve (must be between 1 and 100).
 * @param offset - The number of recipes to skip (default is 0).
 * @returns An object with either:
 *          { recipes: Recipe[] } containing the retrieved recipes if successful, or
 *          { error: 'invalid-depth' | 'invalid-offset' | 'invalid-limit' | 'invalid-after-date' | 'not-logged-in' | 'server-error' } if an error occurs.
 * 
 * Errors:
 * - 'invalid-depth': The provided depth is negative.
 * - 'invalid-offset': The provided offset is negative.
 * - 'invalid-limit': The provided limit is not within the valid range.
 * - 'invalid-after-date': The provided `afterDate` is not a valid date.
 * - 'not-logged-in': The user is not logged in.
 * - 'server-error': A server-side error occurred.
 */
export async function getRecipeFeed(
    depth: number,
    afterDate: Date,
    limit: number,
    offset: number = 0
): Errorable<{ recipes: Recipe[] }> {
    if (depth < 0 || depth > MAX_FEED_DEPTH) return { error: 'invalid-depth' };
    if (isNaN(afterDate.valueOf())) return { error: 'invalid-after-date' };
    if (limit <= 0 || limit > MAX_FEED_LIMIT) return { error: 'invalid-limit' };
    if (offset < 0) return { error: 'invalid-offset' };

    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };
        
        const recipes = await sql`
            WITH RECURSIVE Network AS (
                SELECT id AS userId, 0 AS depth
                    FROM AppUser
                    WHERE id = ${user.id}
                UNION
                (
                    SELECT f.id1 AS userId, n.depth + 1
                        FROM Friend f
                        JOIN Network n ON f.id2 = n.userId
                        WHERE n.depth < ${depth}
                    UNION
                    SELECT f.id2 AS userId, n.depth + 1
                        FROM Friend f
                        JOIN Network n ON f.id1 = n.userId
                        WHERE n.depth < ${depth}
                )
            )
            SELECT r.*
                FROM Recipe r
                JOIN Network n ON r.authorId = n.userId AND n.userId != ${user.id}
                WHERE r.createdAt > ${afterDate}
                LIMIT ${limit} OFFSET ${offset}
        ` as Recipe[];

        return { recipes };
    } catch (e) {
        console.error('Error fetching recipe feed:', e);
        return { error: 'server-error' };
    }
}