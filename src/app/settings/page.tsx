'use client';

import { useState, useEffect } from 'react';
import { getUser } from '@/lib/actions/auth';
import { updateUsername, updateEmail, updatePassword } from '@/lib/actions/user';
import Link from 'next/link';

export default function SettingsPage() {
    const [user, setUser] = useState<{ username: string; email: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form states
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        getUser().then((userData) => {
            if (userData && 'username' in userData) {
                setUser(userData as { username: string; email: string });
                setNewUsername(userData.username);
                setNewEmail(userData.email);
            }
            setLoading(false);
        });
    }, []);

    const handleUsernameUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await updateUsername(newUsername);
        if (result === 'success') {
            setMessage({ type: 'success', text: 'Username updated successfully!' });
            setUser(prev => prev ? { ...prev, username: newUsername } : null);
        } else {
            let errorMessage = 'Failed to update username. ';
            switch (result) {
                case 'invalid-username-length':
                    errorMessage = 'Username must be between 3 and 20 characters.';
                    break;
                case 'invalid-username-chars':
                    errorMessage = 'Username can only contain letters, numbers, and underscores.';
                    break;
                case 'username-taken':
                    errorMessage = 'This username is already taken.';
                    break;
                case 'not-logged-in':
                    errorMessage = 'Please log in to update your username.';
                    break;
                default:
                    errorMessage = 'An unexpected error occurred.';
            }
            setMessage({ type: 'error', text: errorMessage });
        }
    };

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await updateEmail(newEmail);
        if (result === 'success') {
            setMessage({ type: 'success', text: 'Email updated successfully!' });
            setUser(prev => prev ? { ...prev, email: newEmail } : null);
        } else {
            let errorMessage = 'Failed to update email. ';
            switch (result) {
                case 'email-taken':
                    errorMessage = 'This email is already registered.';
                    break;
                case 'not-logged-in':
                    errorMessage = 'Please log in to update your email.';
                    break;
                default:
                    errorMessage = 'An unexpected error occurred.';
            }
            setMessage({ type: 'error', text: errorMessage });
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match!' });
            return;
        }
        const result = await updatePassword(currentPassword, newPassword);
        if (result === 'success') {
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            let errorMessage = 'Failed to update password. ';
            switch (result) {
                case 'invalid-password-length':
                    errorMessage = 'New password must be at least 8 characters long.';
                    break;
                case 'invalid-current-password':
                    errorMessage = 'Current password is incorrect.';
                    break;
                case 'not-logged-in':
                    errorMessage = 'Please log in to update your password.';
                    break;
                default:
                    errorMessage = 'An unexpected error occurred.';
            }
            setMessage({ type: 'error', text: errorMessage });
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (!user) {
        return <div className="flex justify-center items-center min-h-screen">Please log in to access settings.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4 text-indigo-800">Account Settings</h1>
            
            {/* Quick Links */}
            <div className="mb-8 flex justify-center space-x-4">
                <Link
                    href="/friends"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                    </svg>
                    Manage Friends
                </Link>
            </div>
            
            {message && (
                <div className={`p-4 mb-6 rounded ${
                    message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-8">
                {/* Username Update Form */}
                <form onSubmit={handleUsernameUpdate} className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Update Username</h2>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">New Username</label>
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        Update Username
                    </button>
                </form>

                {/* Email Update Form */}
                <form onSubmit={handleEmailUpdate} className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Update Email</h2>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">New Email</label>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        Update Email
                    </button>
                </form>

                {/* Password Update Form */}
                <form onSubmit={handlePasswordUpdate} className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Update Password</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-2">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
}