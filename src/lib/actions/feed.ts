"use server";

import { NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER } from 'next/dist/lib/constants';
import { sql } from '../sql';
import { getUser } from './auth';
import { Recipe } from './recipe';
import { Errorable } from './types';

const MAX_FEED_LIMIT = 100;
const MAX_FEED_DEPTH = 5;

export interface TrendingItem extends Recipe {
    likeCount: number;
}

export async function getTrendingRecipes(
    limit: number,
    offset: number = 0
): Promise<TrendingItem[]> {
    return await sql`
        SELECT *
        FROM RecipeWithLikes
        ORDER BY likeCount DESC, createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
        ` as TrendingItem[];
        
}

export async function getFriendsFeed(
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
            WITH UserNetwork AS (
                SELECT ${user.id} AS userId, 0 AS depth
                UNION
                SELECT 
                    CASE 
                        WHEN id1 = ${user.id} THEN id2
                        ELSE id1
                    END AS userId,
                    1 AS depth
                FROM Friend
                WHERE id1 = ${user.id} OR id2 = ${user.id}
                UNION
                SELECT f2.id2 AS userId, 2 AS depth
                FROM Friend f1
                JOIN Friend f2 ON f1.id2 = f2.id1
                WHERE f1.id1 = ${user.id} AND f2.id2 != ${user.id} AND ${depth} >= 2
                UNION
                SELECT f2.id1 AS userId, 2 AS depth
                FROM Friend f1
                JOIN Friend f2 ON f1.id2 = f2.id2
                WHERE f1.id1 = ${user.id} AND f2.id1 != ${user.id} AND ${depth} >= 2
                UNION
                SELECT f3.id2 AS userId, 3 AS depth
                FROM Friend f1
                JOIN Friend f2 ON f1.id2 = f2.id1
                JOIN Friend f3 ON f2.id2 = f3.id1
                WHERE f1.id1 = ${user.id} AND f3.id2 != ${user.id} AND ${depth} >= 3
                UNION
                SELECT f4.id2 AS userId, 4 AS depth
                FROM Friend f1
                JOIN Friend f2 ON f1.id2 = f2.id1
                JOIN Friend f3 ON f2.id2 = f3.id1
                JOIN Friend f4 ON f3.id2 = f4.id1
                WHERE f1.id1 = ${user.id} AND f4.id2 != ${user.id} AND ${depth} >= 4
                UNION
                SELECT f5.id2 AS userId, 5 AS depth
                FROM Friend f1
                JOIN Friend f2 ON f1.id2 = f2.id1
                JOIN Friend f3 ON f2.id2 = f3.id1
                JOIN Friend f4 ON f3.id2 = f4.id1
                JOIN Friend f5 ON f4.id2 = f5.id1
                WHERE f1.id1 = ${user.id} AND f5.id2 != ${user.id} AND ${depth} >= 5
            )
            SELECT DISTINCT r.*, u.username AS authorName
            FROM RecipeWithLikes r
            JOIN UserNetwork n ON r.authorId = n.userId AND n.userId != ${user.id}
            JOIN AppUser u ON u.id = r.authorId
            WHERE r.createdAt > ${afterDate}
            ORDER BY r.likeCount DESC, r.createdAt DESC
            LIMIT ${limit} OFFSET ${offset}
        ` as Recipe[];
        return { recipes };

    } catch (e) {
        console.error('Error fetching recipe feed:', e);
        return { error: 'server-error' };
    }
}
