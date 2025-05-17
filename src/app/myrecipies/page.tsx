'use client';

import { useState, useEffect } from 'react';
import { createRecipe, getRecipe, updateRecipe, deleteRecipe } from '@/lib/actions/recipe';
import { Recipe, FormData, Ingredient } from './components/types';
import RecipeForm from './components/RecipeForm';
import RecipeCard from './components/RecipeCard';

export default function RecipesPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Helper function to handle form submission for creating recipes
    const handleCreateRecipe = async (formData: FormData, ingredientsList: Ingredient[]) => {
        console.log("Creating recipe with ingredients:", ingredientsList);
        
        if (ingredientsList.length === 0) {
            alert("Please add at least one ingredient before creating a recipe.");
            return;
        }
        
        try {
            // Format ingredients as a key-value object where keys are ingredient names and values are quantities
            const ingredientsObj = ingredientsList.reduce((obj, ing) => {
                obj[ing.name.trim()] = ing.quantity.trim();
                return obj;
            }, {} as Record<string, string>);
            
            console.log("Formatted ingredients for API:", ingredientsObj);
            
            // Make sure all required fields are provided
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
                
                console.log("Sending data to server:", recipeData);
                
                // Pass the ingredients as a proper object for the SQL query
                const result = await createRecipe(
                    recipeData.name,
                    recipeData.description,
                    recipeData.ingredients,
                    recipeData.instructions
                );

                console.log("API response:", result);

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
                        setRecipes(prevRecipes => [...prevRecipes, newRecipe.recipe]);
                        resetForm();
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
                const recipe = updatedRecipe.recipe;
                setRecipes(recipes.map(r => r.id === selectedRecipe.id ? recipe : r));
                resetForm();
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
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-indigo-800">My Recipes</h1>
            
            {!isCreating && !selectedRecipe && (
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md mb-6 hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create New Recipe
                </button>
            )}

            {(isCreating || selectedRecipe) && (
                <RecipeForm 
                    isCreating={isCreating}
                    selectedRecipe={selectedRecipe}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map(recipe => (
                    <RecipeCard 
                        key={recipe.id}
                        recipe={recipe}
                        onEdit={startEdit}
                        onDelete={handleDeleteRecipe}
                    />
                ))}
            </div>
        </div>
    );
}
