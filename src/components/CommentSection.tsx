"use client";

import { useState, useEffect } from 'react';
import { addComment, getRecipeComments, deleteComment, updateComment, type Comment } from '@/lib/actions/comment';
import { getUser } from '@/lib/actions/auth';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const DEFAULT_PROFILE_PIC = "/images/IconForWebsite.png";

interface CommentSectionProps {
    recipeId: number;
}

export default function CommentSection({ recipeId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<{ id: number; username: string; profile_picture?: string | null } | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        loadUser();
        loadComments();
    }, [recipeId]);

    async function loadUser() {
        const userData = await getUser();
        if (userData && typeof userData.id === "number" && typeof userData.username === "string") {
            setUser({ id: userData.id, username: userData.username, profile_picture: userData.profile_picture || null });
        }
    }

    async function loadComments() {
        setLoading(true);
        const result = await getRecipeComments(recipeId);
        setLoading(false);
        if ('error' in result) {
            setError(`Error loading comments: ${result.error}`);
        } else {
            // Deduplicate by comment id
            const unique = Array.from(new Map(result.comments.map(c => [c.id, c])).values());
            setComments(unique);
        }
    }

    async function handleSubmitComment(e: React.FormEvent) {
        e.preventDefault();
        if (!newComment.trim()) return;
        const result = await addComment(recipeId, newComment.trim());
        if ('error' in result) {
            setError(`Error adding comment: ${result.error}`);
        } else {
            setNewComment('');
            loadComments();
            setShowAll(true); // Expand to show the new comment
        }
    }

    async function handleDeleteComment(commentId: number) {
        const result = await deleteComment(commentId);
        if ('error' in result) {
            setError(`Error deleting comment: ${result.error}`);
        } else {
            loadComments();
        }
    }

    async function handleUpdateComment(commentId: number) {
        if (!editContent.trim()) return;
        const result = await updateComment(commentId, editContent.trim());
        if ('error' in result) {
            setError(`Error updating comment: ${result.error}`);
        } else {
            setEditingCommentId(null);
            setEditContent('');
            loadComments();
        }
    }

    function startEditing(comment: Comment) {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    }

    // UI: Only show most recent comment unless showAll is true
    const visibleComments = showAll ? comments : comments.slice(0, 1);
    const hasMore = comments.length > 1;

    return (
        <div className="bg-gray-50 rounded border border-gray-100 p-2 mt-2">
            <h3 className="text-base font-semibold mb-2 text-gray-700">Comments</h3>
            {error && (
                <div className="mb-2 p-2 bg-red-50 text-red-700 rounded text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-2 text-current opacity-70 hover:opacity-100">✕</button>
                </div>
            )}
            {user && (
                <form onSubmit={handleSubmitComment} className="mb-2">
                    <div className="flex gap-2 items-center">
                        <div className="relative w-7 h-7 flex-shrink-0">
                            <Image
                                src={user.profile_picture || DEFAULT_PROFILE_PIC}
                                alt={user.username + ' profile picture'}
                                fill
                                className="rounded-full object-cover border border-gray-200"
                            />
                        </div>
                        <input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-grow p-1 px-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                            maxLength={200}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="ml-1 bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Post
                        </button>
                    </div>
                </form>
            )}
            {loading ? (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-400"></div>
                </div>
            ) : comments.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-2">No comments yet.</p>
            ) : (
                <div className="space-y-2">
                    {visibleComments.map(comment => (
                        <div key={comment.id} className="border-b border-gray-100 pb-2 last:border-0 flex gap-2 items-start">
                            <div className="relative w-7 h-7 flex-shrink-0 mt-1">
                                <Image
                                    src={comment.profile_picture || DEFAULT_PROFILE_PIC}
                                    alt={comment.username + ' profile picture'}
                                    fill
                                    className="rounded-full object-cover border border-gray-200"
                                />
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <Link
                                        href={`/user/${comment.user_id}`}
                                        className="font-medium text-gray-800 hover:text-indigo-600 transition-colors text-xs"
                                    >
                                        {comment.username}
                                    </Link>
                                    <span className="text-gray-400 text-xs">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                {editingCommentId === comment.id ? (
                                    <div className="space-y-1">
                                        <input
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full p-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                                            maxLength={200}
                                        />
                                        <div className="flex gap-1 mt-1">
                                            <button
                                                onClick={() => handleUpdateComment(comment.id)}
                                                className="bg-indigo-500 text-white px-2 py-0.5 rounded hover:bg-indigo-600 text-xs"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingCommentId(null);
                                                    setEditContent('');
                                                }}
                                                className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-300 text-xs"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-700 text-xs whitespace-pre-wrap break-words">{comment.content}</p>
                                )}
                                {user && user.id === comment.user_id && !editingCommentId && (
                                    <div className="flex gap-2 mt-0.5">
                                        <button
                                            onClick={() => startEditing(comment)}
                                            className="text-gray-400 hover:text-indigo-500 transition-colors text-xs"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-red-400 hover:text-red-600 transition-colors text-xs"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {hasMore && (
                        <button
                            className="text-indigo-500 text-xs mt-1 hover:underline"
                            onClick={() => setShowAll(v => !v)}
                        >
                            {showAll ? `Hide comments` : `Show all ${comments.length} comments`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
} 