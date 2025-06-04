"use server";

import { sql } from '../sql';
import bcrypt from 'bcrypt';
import { getUser } from './auth';

export async function updateUsername(newUsername: string) {
    if (newUsername.length > 20 || newUsername.length < 3) return 'invalid-username-length';
    if (/^\w+$/.test(newUsername) === false) return 'invalid-username-chars';

    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        const existingUser = await sql`SELECT username FROM AppUser WHERE username = ${newUsername}`;
        if (existingUser.length > 0) return 'username-taken';

        await sql`UPDATE AppUser SET username = ${newUsername} WHERE id = ${user.id}`;
        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

export async function updateEmail(newEmail: string) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        const existingUser = await sql`SELECT email FROM AppUser WHERE email = ${newEmail}`;
        if (existingUser.length > 0) return 'email-taken';

        await sql`UPDATE AppUser SET email = ${newEmail} WHERE id = ${user.id}`;
        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
    if (newPassword.length < 8) return 'invalid-password-length';

    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        const userData = await sql`SELECT password FROM AppUser WHERE id = ${user.id}`;
        const isValid = await bcrypt.compare(currentPassword, userData[0].password);
        if (!isValid) return 'invalid-current-password';

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await sql`UPDATE AppUser SET password = ${hashedPassword} WHERE id = ${user.id}`;
        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

export async function getUserProfile() {
    try {
        const user = await getUser();
        if (!user) return null;
        const result = await sql`
            SELECT id, username, email, bio, profile_picture 
            FROM AppUser 
            WHERE id = ${user.id}
        `;
        return result[0];
    } catch (e) {
        console.error('Error fetching user profile:', e);
        return null;
    }
}

export async function updateUserProfile({ bio, profilePicture }: { bio?: string; profilePicture?: string }) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';
        
        if (bio !== undefined) {
            await sql`
                UPDATE AppUser 
                SET bio = ${bio} 
                WHERE id = ${user.id}
            `;
        }
        
        if (profilePicture !== undefined) {
            await sql`
                UPDATE AppUser 
                SET profile_picture = ${profilePicture} 
                WHERE id = ${user.id}
            `;
        }
        
        return 'success';
    } catch (e) {
        console.error('Error updating user profile:', e);
        return 'server-error';
    }
}

export async function getPublicUserProfile(userId: number) {
    try {
        const currentUser = await getUser();
        const result = await sql`
            SELECT id, username, bio, profile_picture, email, ispublic 
            FROM AppUser 
            WHERE id = ${userId}
        `;
        if (result.length === 0) return null;

        // If the profile is private, only return basic info unless it's the user's own profile
        // or they are friends
        if (!result[0].ispublic && currentUser?.id !== userId) {
            const areFriends = await sql`
                SELECT 1 FROM Friend 
                WHERE (user1_id = ${currentUser?.id} AND user2_id = ${userId} AND status = 'accepted')
                OR (user1_id = ${userId} AND user2_id = ${currentUser?.id} AND status = 'accepted')
            `;
            
            if (areFriends.length === 0) {
                // Return only basic info for private profiles
                return {
                    id: result[0].id,
                    username: result[0].username,
                    ispublic: result[0].ispublic
                };
            }
        }
        
        return result[0];
    } catch (e) {
        console.error('Error fetching public user profile:', e);
        return null;
    }
}

export async function updatePrivacySetting(isPublic: boolean) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        await sql`
            UPDATE AppUser 
            SET ispublic = ${isPublic} 
            WHERE id = ${user.id}
        `;
        
        return 'success';
    } catch (e) {
        console.error('Error updating privacy setting:', e);
        return 'server-error';
    }
} 