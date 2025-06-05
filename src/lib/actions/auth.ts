"use server";

import { cookies } from 'next/headers';
import { sql } from '../sql';
import bcrypt from 'bcrypt';
import { jwtVerify, SignJWT } from 'jose';

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!);

/**
 * Registers a new user in the system.
 * @param username - The username of the new user (3-20 characters, alphanumeric).
 * @param email - The email address of the new user.
 * @param password - The password for the new user (minimum 8 characters).
 * @returns A string indicating the result of the operation:
 *          'success', 'invalid-username-length', 'invalid-username-chars',
 *          'invalid-password-length', 'username-taken', 'email-taken', or 'server-error'.
 */
export async function signUp(username: string, email: string, password: string) {
    if (username.length > 20 || username.length < 3) return 'invalid-username-length';
    if (/^\w+$/.test(username) === false) return 'invalid-username-chars';
    if (password.length < 8) return 'invalid-password-length';

    try {
        const user = await sql`SELECT username, email FROM AppUser
            WHERE username = ${username} OR email = ${email}`;
        if (user.length > 0) {
            return user[0].username === username ? 'username-taken' : 'email-taken';
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await sql`INSERT INTO AppUser (username, email, password)
            VALUES (${username}, ${email}, ${hashedPassword})`;

        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

/**
 * Logs in a user by verifying their credentials and creating a session.
 * @param usernameOrEmail - The username or email of the user.
 * @param password - The password of the user.
 * @returns A string indicating the result of the operation:
 *          'success', 'user-not-found', 'invalid-password', or 'server-error'.
 */
export async function login(usernameOrEmail: string, password: string) {
    try {
        const user = await sql`SELECT * FROM AppUser
            WHERE (username = ${usernameOrEmail} OR email = ${usernameOrEmail});`;
        if (user.length === 0) return 'user-not-found';

        const isValid = await bcrypt.compare(password, user[0].password);
        if (!isValid) return 'invalid-password';

        const session = await sql`INSERT INTO Session (userId)
            VALUES (${user[0].id}) RETURNING id`;
        const sessionId = session[0].id;
        const sessionToken = await new SignJWT({ sessionId })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1d')
            .sign(SESSION_SECRET);

        const userCookies = await cookies();
        userCookies.set('session', sessionToken, {
            expires: new Date(Date.now() + 86400e3) // 1 day
        });

        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

/**
 * Logs out the currently logged-in user by deleting their session.
 * @returns A string indicating the result of the operation:
 *          'success', 'not-logged-in', or 'server-error'.
 */
export async function logout() {
    const sessionId = await getSessionId();
    if (!sessionId) return 'not-logged-in';

    try {
        await sql`DELETE FROM Session WHERE id = ${sessionId}`;
        (await cookies()).delete('session');
        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

/**
 * Retrieves the currently logged-in user's information.
 * @returns The user object if logged in, or null if not logged in or on error.
 */
export async function getUser() {
    const sessionId = await getSessionId();
    if (!sessionId) return null;

    try {
        const user = await sql`SELECT id, username, email, bio, profile_picture, ispublic FROM AppUser
            WHERE id = (SELECT userId FROM Session WHERE id = ${sessionId})`;
        return user[0];
    } catch (e) {
        return null;
    }
}

async function getSessionId() {
    const userCookies = await cookies();
    const session = userCookies.get('session')?.value;
    if (!session) return null;

    try {
        const sessionToken = await jwtVerify(session, SESSION_SECRET, {
            algorithms: ['HS256'],
        });
        return sessionToken.payload.sessionId as string;
    } catch (e) {
        userCookies.delete('session');
        return null;
    }
}