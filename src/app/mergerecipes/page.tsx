'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRecipes, mergeRecipes, Recipe } from '@/lib/actions/recipe';
import RecipeSelectionCard from './components/RecipeSelectionCard';
import Link from 'next/link';

export default function MergeRecipesPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipes, setSelectedRecipes] = useState([]);
    const [temperature, setTemperature] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const response = await getUserRecipes();
                if ('error' in response) throw new Error('Failed to fetch recipes');
                setRecipes(response.recipes!);
            } catch (error) {
                console.error('Failed to fetch recipes:', error);
                setError('Failed to load your recipes. Please try again later.');
            }
        };

        fetchRecipes();
    }, []);

    const toggleRecipeSelection = (recipeId) => {
        setSelectedRecipes(prevSelected => {
            if (prevSelected.includes(recipeId)) {
                return prevSelected.filter(id => id !== recipeId);
            } else {
                return [...prevSelected, recipeId];
            }
        });
    };

    const handleTemperatureChange = (e) => {
        const value = parseFloat(e.target.value);
        setTemperature(value);
    };

    const handleMergeRecipes = async () => {
        if (selectedRecipes.length < 2) {
            setError('Please select at least 2 recipes to merge.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log("Merging recipes with IDs:", selectedRecipes);
            console.log("Using temperature:", temperature);
            
            // Important: Pass parameters separately, not nested in an array
            const result = await mergeRecipes(selectedRecipes, temperature);
            
            console.log("Merge result:", result);
            
            if ('error' in result) {
                if (result.error === 'not-enough-recipes') {
                    setError('Please select at least 2 recipes to merge.');
                } else if (result.error === 'not-logged-in') {
                    setError('You need to be logged in to merge recipes.');
                } else if (result.error === 'recipe-not-found') {
                    setError('One or more selected recipes could not be found.');
                } else if (result.error === 'generation-error') {
                    setError('There was an error generating the merged recipe. Please try again.');
                } else if (result.error === 'invalid-temperature') {
                    setError('Invalid temperature value. Please use a value between 0 and 2.');
                } else {
                    setError(`Error merging recipes: ${result.error}`);
                }
            } else if ('id' in result && result.id) {
                // Success! Redirect to the new merged recipe
                router.push(`/myrecipies?merged=${result.id}`);
            }
        } catch (error) {
            console.error('Error merging recipes:', error);
            setError('An unexpected error occurred while merging recipes.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4 text-indigo-800">Merge Recipes</h1>
            
            {error && (
                <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
                    {error}
                    <button 
                        onClick={() => setError(null)}
                        className="ml-2 text-current opacity-70 hover:opacity-100"
                    >
                        ✕
                    </button>
                </div>
            )}
            
            <div className="flex flex-wrap gap-4 mb-6">
                <Link 
                    href="/myrecipies"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back to My Recipes
                </Link>
            </div>

            <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 text-indigo-700 border-b pb-2">AI Creativity Level</h2>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={handleTemperatureChange}
                        className="w-48"
                    />
                    <span className="text-gray-700 font-medium">{temperature.toFixed(1)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    Lower values create more predictable recipes, higher values are more creative.
                </p>
                
                <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-700">
                            {selectedRecipes.length} recipes selected
                        </h3>
                        <button
                            onClick={handleMergeRecipes}
                            disabled={selectedRecipes.length < 2 || isLoading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-white 
                                ${selectedRecipes.length < 2 || isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-600'
                                } transition-colors shadow-sm`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    Merging...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    Merge Selected Recipes
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Please select at least 2 recipes to create a merged recipe.
                    </p>
                </div>
            </div>

            <h2 className="text-xl font-semibold mb-4 text-gray-700">Available Recipes</h2>
            
            {recipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes.map(recipe => (
                        <RecipeSelectionCard
                            key={recipe.id}
                            recipe={recipe}
                            isSelected={selectedRecipes.includes(recipe.id)}
                            onToggleSelect={() => toggleRecipeSelection(recipe.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Recipes Available</h3>
                    <p className="text-gray-500 mb-4">You need to create some recipes before you can merge them.</p>
                    <Link
                        href="/myrecipies"
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create Your First Recipe
                    </Link>
                </div>
            )}
        </div>
    );
}
