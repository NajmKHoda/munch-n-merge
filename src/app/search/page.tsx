'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchRecipes } from '@/lib/actions/recipe';
import Link from 'next/link';

export default function SearchPage() {
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
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
            } catch (err) {
                setError('Failed to fetch search results. Please try again.');
                console.error('Search error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [query]);
    console.log(results);
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
                            className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    {recipe.name}
                                </h2>
                                <p className="text-gray-600 text-sm mb-4">
                                    {recipe.description}
                                </p>
                                <div className="flex items-center text-sm text-gray-500">
                                    <span>By {recipe.authorname}</span>
                                    <span className="mx-2">•</span>
                                    <span>{recipe.likecount} likes</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
} 