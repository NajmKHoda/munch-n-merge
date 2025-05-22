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
                from.id AS fromId,
                from.username AS fromUsername,
                to.id AS toId,
                to.username AS toUsername
            FROM FriendRequest fr
            WHERE (fromId = ${user.id} OR toId = ${user.id})
            JOIN AppUser AS from ON from.id = fr.fromId
            JOIN AppUser AS to ON to.id = fr.toId
        ` as {
            requestId: number;
            fromId: number;
            fromUsername: string;
            toId: number;
            toUsername: string;
        }[];

        const requests = rawRequests.map(r => ({
            id: r.requestId,
            from: {
                id: r.fromId,
                username: r.fromUsername,
            },
            to: {
                id: r.toId,
                username: r.toUsername,
            }
        }));

        return { requests };
    } catch (e) {
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