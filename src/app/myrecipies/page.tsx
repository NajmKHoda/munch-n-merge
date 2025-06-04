'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createRecipe, getRecipe, updateRecipe, deleteRecipe, getUserRecipes } from '@/lib/actions/recipe';
import { Recipe, FormData, Ingredient } from './components/types';
import RecipeForm from './components/RecipeForm';
import RecipeCard from './components/RecipeCard';
import Link from 'next/link';

export default function RecipesPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const searchParams = useSearchParams();
    const mergedId = searchParams.get('merged');

    useEffect(() => {
        // Fetch all recipes for the user
        const fetchRecipes = async () => {
            try {
                setIsLoading(true);
                const response = await getUserRecipes();
                if ('error' in response) throw new Error('Failed to fetch recipes');
                setRecipes(response.recipes!.map(recipe => ({
                    id: recipe.id,
                    name: recipe.name,
                    description: recipe.description,
                    instructions: recipe.instructions ?? '',
                    ingredients: typeof recipe.ingredients === 'string'
                        ? JSON.parse(recipe.ingredients)
                        : recipe.ingredients,
                    authorId: recipe.authorId,
                    authorName: recipe.authorname,
                    likeCount: recipe.likecount ?? 0,
                    difficulty: recipe.difficulty ?? null,
                })));

                // Handle newly merged recipe
                if (mergedId) {
                    const mergedRecipeId = parseInt(mergedId);
                    const mergedRecipeResult = await getRecipe(mergedRecipeId);
                    
                    if ('recipe' in mergedRecipeResult) {
                        setNotification({
                            message: 'Recipe merged successfully! Your new recipe is now ready.',
                            type: 'success'
                        });
                        
                        // Scroll to the newly merged recipe
                        setTimeout(() => {
                            const element = document.getElementById(`recipe-${mergedRecipeId}`);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                                element.classList.add('highlight-recipe');
                            }
                        }, 500);
                    }
                }
            } catch (error) {
                console.error('Error fetching recipes:', error);
                setNotification({
                    message: 'Failed to load your recipes. Please try again later.',
                    type: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecipes();
    }, [mergedId]);

    // Helper function to handle form submission for creating recipes
    const handleCreateRecipe = async (formData: FormData, ingredientsList: Ingredient[]) => {
        
        try {
            // Format ingredients as a key-value object where keys are ingredient names and values are quantities
            const ingredientsObj = ingredientsList.reduce((obj, ing) => {
                obj[ing.name.trim()] = ing.quantity.trim();
                return obj;
            }, {} as Record<string, string>);
            
            
            // Make sure recipe name is provided
            if (!formData.name.trim()) {
                alert("Please enter a recipe name.");
                return;
            }
            
            try {
                // Create a plain object to serialize properly
                const recipeData = {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    ingredients: ingredientsObj,
                    instructions: formData.instructions.trim()
                };
                                
                // Pass the ingredients as a proper object for the SQL query
                const result = await createRecipe(
                    recipeData.name,
                    recipeData.description,
                    recipeData.ingredients,
                    recipeData.instructions
                );

                if ('error' in result) {
                    // Handle specific error cases
                    if (result.error === 'server-error') {
                        console.error("Server error creating recipe");
                        alert("There was a server error while saving your recipe. Please try again later.");
                    } else if (result.error === 'not-logged-in') {
                        alert("You need to be logged in to create recipes. Please log in and try again.");
                    } else {
                        alert(`Error creating recipe: ${result.error}`);
                    }
                    return;
                }

                if ('id' in result && result.id) {
                    const newRecipe = await getRecipe(result.id);
                    if ('recipe' in newRecipe && newRecipe.recipe) {
                        // Ensure the new recipe matches the local Recipe type
                        const localRecipe: Recipe = {
                            id: newRecipe.recipe.id,
                            name: newRecipe.recipe.name,
                            description: newRecipe.recipe.description,
                            instructions: newRecipe.recipe.instructions ?? '',
                            ingredients: typeof newRecipe.recipe.ingredients === 'string'
                                ? JSON.parse(newRecipe.recipe.ingredients)
                                : newRecipe.recipe.ingredients,
                            authorId: newRecipe.recipe.authorId,
                            authorName: newRecipe.recipe.authorname,
                            likeCount: newRecipe.recipe.likecount ?? 0,
                        };
                        setRecipes(prevRecipes => [...prevRecipes, localRecipe]);
                        resetForm();
                        setNotification({
                            message: 'Recipe created successfully!',
                            type: 'success'
                        });
                    } else {
                        console.error("Failed to retrieve the created recipe:", newRecipe);
                    }
                } else {
                    console.error("Failed to create recipe:", result);
                }
            } catch (apiError) {
                console.error("API call error:", apiError);
            }
        } catch (error) {
            console.error("Error creating recipe:", error);
        }
    };

    // Helper function to handle form submission for updating recipes
    const handleUpdateRecipe = async (formData: FormData, ingredientsList: Ingredient[]) => {
        if (!selectedRecipe) return;

        const ingredientsObj = ingredientsList.reduce((obj, ing) => {
            obj[ing.name] = ing.quantity;
            return obj;
        }, {} as Record<string, string>);

        const result = await updateRecipe(
            selectedRecipe.id,
            formData.name,
            formData.description,
            ingredientsObj,
            formData.instructions
        );

        if (result === 'success') {
            const updatedRecipe = await getRecipe(selectedRecipe.id);
            if ('recipe' in updatedRecipe && updatedRecipe.recipe) {
                // Properly convert server recipe type to local Recipe type
                const recipe: Recipe = {
                    id: updatedRecipe.recipe.id,
                    name: updatedRecipe.recipe.name,
                    description: updatedRecipe.recipe.description,
                    instructions: updatedRecipe.recipe.instructions ?? '',
                    ingredients: typeof updatedRecipe.recipe.ingredients === 'string'
                        ? JSON.parse(updatedRecipe.recipe.ingredients)
                        : updatedRecipe.recipe.ingredients,
                    authorId: updatedRecipe.recipe.authorId,
                    authorName: updatedRecipe.recipe.authorname,
                    likeCount: updatedRecipe.recipe.likecount ?? 0,
                };
                setRecipes(prevRecipes => prevRecipes.map(r => r.id === selectedRecipe.id ? recipe : r));
                resetForm();
                setNotification({
                    message: 'Recipe updated successfully!',
                    type: 'success'
                });
            }
        }
    };

    // Handle form submission based on whether creating or updating
    const handleSubmit = async (formData: FormData, ingredientsList: Ingredient[]) => {
        if (isCreating) {
            await handleCreateRecipe(formData, ingredientsList);
        } else if (selectedRecipe) {
            await handleUpdateRecipe(formData, ingredientsList);
        }
    };

    const handleDeleteRecipe = async (id: number) => {
        const result = await deleteRecipe(id);
        if (result === 'success') {
            setRecipes(recipes.filter(r => r.id !== id));
            setNotification({
                message: 'Recipe deleted successfully.',
                type: 'success'
            });
        }
    };

    const startEdit = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setIsCreating(false);
    };

    const resetForm = () => {
        setIsCreating(false);
        setSelectedRecipe(null);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-indigo-800">My Recipes</h1>
            
            {notification && (
                <div className={`mb-6 p-4 rounded-md ${
                    notification.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-700' 
                        : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                    {notification.message}
                    <button 
                        onClick={() => setNotification(null)}
                        className="ml-2 text-current opacity-70 hover:opacity-100"
                    >
                        ✕
                    </button>
                </div>
            )}
            
            <div className="flex flex-wrap gap-4 mb-6">
                {!isCreating && !selectedRecipe && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create New Recipe
                    </button>
                )}
                
                <Link 
                    href="/mergerecipes"
                    className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Merge Recipes
                </Link>
            </div>

            {(isCreating || selectedRecipe) && (
                <RecipeForm 
                    isCreating={isCreating}
                    selectedRecipe={selectedRecipe}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                />
            )}

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : recipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {recipes.map(recipe => (
                        <div key={recipe.id} id={`recipe-${recipe.id}`} className="aspect-square">
                            <RecipeCard 
                                recipe={recipe}
                                onEdit={startEdit}
                                onDelete={handleDeleteRecipe}
                                likeCount={recipe.likeCount || 0}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-600 font-medium">No Recipes Yet</p>
                    <p className="text-gray-500 mt-2 text-sm">You haven't created any recipes yet.</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm text-sm"
                    >
                        Create Your First Recipe
                    </button>
                </div>
            )}

            <style jsx global>{`
                .highlight-recipe {
                    animation: highlight 2s ease-in-out;
                }
                
                @keyframes highlight {
                    0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
                }
            `}</style>
        </div>
    );
}
