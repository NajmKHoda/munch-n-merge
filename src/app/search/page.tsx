'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchRecipes } from '@/lib/actions/recipe';
import { likeRecipe, unlikeRecipe, getUserLikes } from '@/lib/actions/like';
import { addFavorite, removeFavorite, getUserFavorites } from '@/lib/actions/favorite';
import Link from 'next/link';

export default function SearchPage() {
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [likes, setLikes] = useState<Record<number, boolean>>({});
    const [favorites, setFavorites] = useState<Record<number, boolean>>({});
    const searchParams = useSearchParams();
    const query = searchParams.get('q');

    // Load user likes
    const loadUserLikes = async () => {
        try {
            const likesResult = await getUserLikes();
            
            if (!('error' in likesResult)) {
                // Create a map of recipe IDs to like status
                const likesMap = likesResult.likedRecipes.reduce((acc, recipeId) => {
                    acc[recipeId] = true;
                    return acc;
                }, {} as Record<number, boolean>);
                
                setLikes(likesMap);
            }
        } catch (error) {
            console.error('Error loading likes:', error);
        }
    };

    // Load user favorites
    const loadUserFavorites = async () => {
        try {
            const favoritesResult = await getUserFavorites();
            
            if (!('error' in favoritesResult)) {
                // Create a map of recipe IDs to favorite status
                const favoritesMap = favoritesResult.favoriteRecipes.reduce((acc, recipeId) => {
                    acc[recipeId] = true;
                    return acc;
                }, {} as Record<number, boolean>);
                
                setFavorites(favoritesMap);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    };

    const handleLike = async (e: React.MouseEvent, id: number) => {
        e.preventDefault(); // Prevent navigation
        // Store the recipe we're modifying for immediate UI update
        const recipeToUpdate = results.find(r => r.id === id);
        if (!recipeToUpdate) return;
        
        // Get current like count as a number
        const currentLikeCount = Number(recipeToUpdate.likecount || 0);
        
        if (likes[id]) {
            // Immediately update UI for better user experience
            setLikes(prev => ({ ...prev, [id]: false }));
            setResults(prev => 
                prev.map(recipe => 
                    recipe.id === id ? { 
                        ...recipe, 
                        likecount: Math.max(0, currentLikeCount - 1)
                    } : recipe
                )
            );
            
            // Make API call
            const result = await unlikeRecipe(id);
            
            // If API call fails, revert UI changes
            if (result !== 'success') {
                setLikes(prev => ({ ...prev, [id]: true }));
                setResults(prev => 
                    prev.map(recipe => 
                        recipe.id === id ? { 
                            ...recipe, 
                            likecount: currentLikeCount
                        } : recipe
                    )
                );
            }
        } else {
            // Immediately update UI for better user experience
            setLikes(prev => ({ ...prev, [id]: true }));
            setResults(prev => 
                prev.map(recipe => 
                    recipe.id === id ? { 
                        ...recipe, 
                        likecount: currentLikeCount + 1
                    } : recipe
                )
            );
            
            // Make API call
            const result = await likeRecipe(id);
            
            // If API call fails, revert UI changes
            if (result !== 'success') {
                setLikes(prev => ({ ...prev, [id]: false }));
                setResults(prev => 
                    prev.map(recipe => 
                        recipe.id === id ? { 
                            ...recipe, 
                            likecount: currentLikeCount
                        } : recipe
                    )
                );
            }
        }
    };

    const handleFavorite = async (e: React.MouseEvent, id: number) => {
        e.preventDefault(); // Prevent navigation
        if (favorites[id]) {
            // Immediately update UI for better user experience
            setFavorites(prev => ({ ...prev, [id]: false }));
            
            // Make API call
            const result = await removeFavorite(id);
            
            // If API call fails, revert UI changes
            if (result !== 'success') {
                setFavorites(prev => ({ ...prev, [id]: true }));
            }
        } else {
            // Immediately update UI for better user experience
            setFavorites(prev => ({ ...prev, [id]: true }));
            
            // Make API call
            const result = await addFavorite(id);
            
            // If API call fails, revert UI changes
            if (result !== 'success') {
                setFavorites(prev => ({ ...prev, [id]: false }));
            }
        }
    };

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) {
                setResults([]);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const response = await searchRecipes(query);
                if ('error' in response) {
                    throw new Error(response.error);
                }
                setResults(response.recipes || []);
                // Load likes and favorites when results are fetched
                await Promise.all([loadUserLikes(), loadUserFavorites()]);
            } catch (err) {
                setError('Failed to fetch search results. Please try again.');
                console.error('Search error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Search Results for "{query}"
            </h1>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
                    {error}
                </div>
            ) : results.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Recipes Found</h3>
                    <p className="text-gray-500">Try adjusting your search terms or browse all recipes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((recipe) => (
                        <Link
                            key={recipe.id}
                            href={`/recipe/${recipe.id}`}
                            className="block bg-white rounded-lg border border-gray-200 border-l-4 border-l-purple-500 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    {recipe.name}
                                </h2>
                                <p className="text-gray-600 text-sm mb-4">
                                    {recipe.description}
                                </p>
                                <div className="flex items-center text-sm justify-between">
                                    <span className="flex items-center text-amber-500 font-medium">
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className="h-4 w-4 mr-1" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                                            />
                                        </svg>
                                        By {recipe.authorname}
                                    </span>
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={(e) => handleLike(e, recipe.id)}
                                            className={`flex items-center ${likes[recipe.id] ? 'text-red-500' : 'text-gray-400'} hover:text-red-500 transition-colors`}
                                        >
                                            <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                className="h-5 w-5 mr-1" 
                                                fill={likes[recipe.id] ? "currentColor" : "none"}
                                                viewBox="0 0 24 24" 
                                                stroke="currentColor"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                                                />
                                            </svg>
                                            {recipe.likecount || 0}
                                        </button>
                                        <button
                                            onClick={(e) => handleFavorite(e, recipe.id)}
                                            className={`flex items-center ${favorites[recipe.id] ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500 transition-colors`}
                                        >
                                            <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                className="h-5 w-5" 
                                                fill={favorites[recipe.id] ? "currentColor" : "none"}
                                                viewBox="0 0 24 24" 
                                                stroke="currentColor"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
} 