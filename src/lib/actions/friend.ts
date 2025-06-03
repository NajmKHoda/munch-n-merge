"use server";

import { sql } from '../sql';
import { getUser } from './auth';
import { Errorable } from './types';

/**
 * Sends a friend request to another user.
 * @param recipientId - The ID of the user to send the friend request to.
 * @returns An object with either:
 *          { requestId: number } containing the new friend request ID if successful, or
 *          { error: 'not-logged-in' | 'server-error' } if an error occurs.
 */
export async function requestFriend(recipientId: number): Errorable<{ requestId: number }> {
    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };

        const [{ id: requestId }] = await sql`
            INSERT INTO FriendRequest (fromId, toId)
            VALUES (${user.id}, ${recipientId}) RETURNING id
        `;
        return { requestId };
    } catch (e) {
        return { error: 'server-error' };
    }
}

/**
 * Retrieves all friend requests involving the current user.
 * @returns An object with either:
 *          { requests: { id, from, to }[] } containing the list of friend requests if successful, or
 *          { error: 'not-logged-in' | 'server-error' } if an error occurs.
 */
export async function getFriendRequests(): Errorable<{
    requests: {
        id: number;
        from: {
            id: number;
            username: string;
        }
        to: {
            id: number;
            username: string;
        }
    }[]
}> {
    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };
        
        const rawRequests = await sql`
            SELECT
                fr.id AS requestId,
                from_user.id AS fromId,
                from_user.username AS fromUsername,
                to_user.id AS toId,
                to_user.username AS toUsername
            FROM FriendRequest fr
            JOIN AppUser AS from_user ON from_user.id = fr.fromId
            JOIN AppUser AS to_user ON to_user.id = fr.toId
            WHERE (fr.fromId = ${user.id} OR fr.toId = ${user.id})
        ` as {
            requestid: number;
            fromid: number;
            fromusername: string;
            toid: number;
            tousername: string;
        }[];
        console.log(rawRequests)
        const requests = rawRequests.map(r => ({
            id: r.requestid,
            from: {
                id: r.fromid,
                username: r.fromusername,
            },
            to: {
                id: r.toid,
                username: r.tousername,
            }
        }));
        return { requests };
    } catch (e) {
        console.error('Error getting friend requests:', e);
        return { error: 'server-error' };
    }
}

/**
 * Accepts a friend request and adds the sender as a friend.
 * @param id - The ID of the friend request to accept.
 * @returns A string indicating the result of the operation:
 *          'success', 'not-logged-in', 'not-found', or 'server-error'.
 */
export async function acceptFriendRequest(id: number) {
    try {
        console.log(id)
        const user = await getUser();
        if (!user) return 'not-logged-in';

        const res = await sql`
            WITH deleted AS (
                DELETE FROM FriendRequest
                WHERE id = ${id} AND toId = ${user.id} RETURNING fromId, toId
            )
            INSERT INTO Friend (id1, id2)
            SELECT fromId, toId FROM deleted
            RETURNING id1, id2
        `;
        if (res.length === 0) return 'not-found';

        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

/**
 * Deletes a friend request.
 * @param id - The ID of the friend request to delete.
 * @returns A string indicating the result of the operation:
 *          'success', 'not-logged-in', or 'server-error'.
 */
export async function deleteFriendRequest(id: number) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        await sql`
            DELETE FROM FriendRequest
            WHERE id = ${id} AND
                (toId = ${user.id} OR fromId = ${user.id})
        `;

        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

/**
 * Removes a friend from the user's friend list.
 * @param id - The ID of the friend to remove.
 * @returns A string indicating the result of the operation:
 *          'success', 'not-logged-in', or 'server-error'.
 */
export async function removeFriend(id: number) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        await sql`
            DELETE FROM Friend
            WHERE (id1 = ${user.id} OR id2 = ${user.id}) AND
                (id1 = ${id} OR id2 = ${id})
        `;

        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

/**
 * Retrieves the list of friends for the current user.
 * @returns An object with either:
 *          { friends: { id, username }[] } containing the list of friends if successful, or
 *          { error: 'not-logged-in' | 'server-error' } if an error occurs.
 */
export async function getFriends(): Errorable<{
    friends: {
        id: number;
        username: string;
    }[]
}> {
    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };

        const friends = await sql`
            SELECT id, username FROM AppUser
            WHERE id IN (
                SELECT id2 FROM Friend WHERE id1 = ${user.id}
                UNION
                SELECT id1 FROM Friend WHERE id2 = ${user.id}
            );
        ` as { id: number; username: string }[];

        return { friends };
    } catch (e) {
        return { error: 'server-error' };
    }
}

/**
 * Searches for users by username to add as friends.
 * @param query - The search query (username to search for).
 * @returns An object with either:
 *          { users: { id, username }[] } containing the matching users if successful, or
 *          { error: 'not-logged-in' | 'server-error' } if an error occurs.
 */
export async function searchUsers(query: string): Errorable<{
    users: {
        id: number;
        username: string;
    }[]
}> {
    try {
        if (!query || query.trim().length < 2) {
            return { users: [] };
        }

        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };

        // Search users whose username contains the query,
        // excluding the current user and users who are already friends
        // or have pending friend requests
        const users = await sql`
            SELECT id, username FROM AppUser
            WHERE 
                id != ${user.id} 
                AND username ILIKE ${'%' + query + '%'}
                AND id NOT IN (
                    -- Exclude existing friends
                    SELECT id2 FROM Friend WHERE id1 = ${user.id}
                    UNION
                    SELECT id1 FROM Friend WHERE id2 = ${user.id}
                    UNION
                    -- Exclude users with pending requests
                    SELECT toId FROM FriendRequest WHERE fromId = ${user.id}
                    UNION
                    SELECT fromId FROM FriendRequest WHERE toId = ${user.id}
                )
            ORDER BY username
            LIMIT 10
        ` as { id: number; username: string }[];
        console.log(users)
        return { users };
    } catch (e) {
        console.error('Error searching users:', e);
        return { error: 'server-error' };
    }
}

/**
 * Checks if the current user has a pending friend request with another user.
 * @param userId - The ID of the other user.
 * @returns An object with either:
 *          { status: 'none' | 'sent' | 'received' | 'friends' } indicating the relationship status, or
 *          { error: 'not-logged-in' | 'server-error' } if an error occurs.
 */
export async function getFriendStatus(userId: number): Errorable<{
    status: 'none' | 'sent' | 'received' | 'friends'
}> {
    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };

        // Check if they are already friends
        const friends = await sql`
            SELECT COUNT(*) as count FROM Friend
            WHERE (id1 = ${user.id} AND id2 = ${userId})
            OR (id1 = ${userId} AND id2 = ${user.id})
        ` as [{ count: number }];

        if (friends[0].count > 0) {
            return { status: 'friends' };
        }

        // Check for pending requests
        const sentRequest = await sql`
            SELECT COUNT(*) as count FROM FriendRequest
            WHERE fromId = ${user.id} AND toId = ${userId}
        ` as [{ count: number }];

        if (sentRequest[0].count > 0) {
            return { status: 'sent' };
        }

        const receivedRequest = await sql`
            SELECT COUNT(*) as count FROM FriendRequest
            WHERE fromId = ${userId} AND toId = ${user.id}
        ` as [{ count: number }];

        if (receivedRequest[0].count > 0) {
            return { status: 'received' };
        }

        return { status: 'none' };
    } catch (e) {
        console.error('Error getting friend status:', e);
        return { error: 'server-error' };
    }
}

export async function getFriendCount(userId: number): Promise<number> {
    try {
        const result = await sql`
            SELECT COUNT(*) as count FROM (
                SELECT id2 as friendId FROM Friend WHERE id1 = ${userId}
                UNION
                SELECT id1 as friendId FROM Friend WHERE id2 = ${userId}
            ) AS friends`;
        return Number(result[0]?.count || 0);
    } catch (e) {
        return 0;
    }
}