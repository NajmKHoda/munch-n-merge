"use server";

import { sql } from '../sql';
import { getUser } from './auth';
import { Errorable } from './types';

export type Comment = {
    id: number;
    recipe_id: number;
    user_id: number;
    username: string;
    profile_picture: string | null;
    content: string;
    created_at: Date;
    updated_at: Date;
};

export async function addComment(recipeId: number, content: string): Errorable<{ commentId: number }> {
    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };
        const [{ id: commentId }] = await sql`
            INSERT INTO Comment (recipe_id, user_id, content)
            VALUES (${recipeId}, ${user.id}, ${content})
            RETURNING id
        `;
        return { commentId };
    } catch (e) {
        console.error('Error adding comment:', e);
        return { error: 'server-error' };
    }
}

export async function getRecipeComments(recipeId: number): Errorable<{ comments: Comment[] }> {
    try {
        const comments = await sql`
            SELECT 
                c.id,
                c.recipe_id,
                c.user_id,
                u.username,
                u.profile_picture,
                c.content,
                c.created_at,
                c.updated_at
            FROM Comment c
            JOIN AppUser u ON u.id = c.user_id
            WHERE c.recipe_id = ${recipeId}
            ORDER BY c.created_at DESC
        ` as Comment[];
        return { comments };
    } catch (e) {
        console.error('Error getting recipe comments:', e);
        return { error: 'server-error' };
    }
}

export async function getUserComments(userId: number): Errorable<{ comments: Comment[] }> {
    try {
        const comments = await sql`
            SELECT 
                c.id,
                c.recipe_id,
                c.user_id,
                u.username,
                u.profile_picture,
                c.content,
                c.created_at,
                c.updated_at
            FROM Comment c
            JOIN AppUser u ON u.id = c.user_id
            WHERE c.user_id = ${userId}
            ORDER BY c.created_at DESC
        ` as Comment[];
        return { comments };
    } catch (e) {
        console.error('Error getting user comments:', e);
        return { error: 'server-error' };
    }
}

export async function deleteComment(commentId: number): Errorable<{ success: boolean }> {
    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };
        const result = await sql`
            DELETE FROM Comment
            WHERE id = ${commentId} AND user_id = ${user.id}
            RETURNING id
        `;
        if (result.length === 0) {
            return { error: 'not-found' };
        }
        return { success: true };
    } catch (e) {
        console.error('Error deleting comment:', e);
        return { error: 'server-error' };
    }
}

export async function updateComment(commentId: number, content: string): Errorable<{ success: boolean }> {
    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };
        const result = await sql`
            UPDATE Comment
            SET content = ${content}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${commentId} AND user_id = ${user.id}
            RETURNING id
        `;
        if (result.length === 0) {
            return { error: 'not-found' };
        }
        return { success: true };
    } catch (e) {
        console.error('Error updating comment:', e);
        return { error: 'server-error' };
    }
} 