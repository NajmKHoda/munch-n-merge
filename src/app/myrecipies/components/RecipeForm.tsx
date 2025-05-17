import { useState, useEffect } from 'react';
import { Recipe, Ingredient, FormData } from './types';
import IngredientInput from './IngredientInput';
import IngredientsList from './IngredientsList';

interface RecipeFormProps {
    isCreating: boolean;
    selectedRecipe: Recipe | null;
    onSubmit: (formData: FormData, ingredientsList: Ingredient[]) => Promise<void>;
    onCancel: () => void;
}

export default function RecipeForm({ isCreating, selectedRecipe, onSubmit, onCancel }: RecipeFormProps) {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        ingredients: '',
        description: '',
        instructions: ''
    });
    
    const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([]);

    // Reset form when selectedRecipe changes
    useEffect(() => {
        if (selectedRecipe) {
            const ingredients = Object.entries(selectedRecipe.ingredients).map(([name, quantity]) => ({
                name,
                quantity
            }));

            setIngredientsList(ingredients);
            setFormData({
                name: selectedRecipe.name,
                ingredients: convertIngredientsListToString(ingredients),
                description: selectedRecipe.description,
                instructions: selectedRecipe.instructions
            });
        } else if (!isCreating) {
            // Reset form if not creating or editing
            setFormData({
                name: '',
                ingredients: '',
                description: '',
                instructions: ''
            });
            setIngredientsList([]);
        }
    }, [selectedRecipe, isCreating]);

    const convertIngredientsListToString = (list: Ingredient[] = ingredientsList): string => {
        return list
            .map(ingredient => `${ingredient.name}: ${ingredient.quantity}`)
            .join('\n');
    };

    const addIngredient = (ingredient: Ingredient) => {
        // Create a new array with the new ingredient
        const updatedList = [...ingredientsList, ingredient];
        setIngredientsList(updatedList);
        
        // Update the ingredients string in formData
        const updatedIngredientsString = convertIngredientsListToString(updatedList);
        setFormData({ 
            ...formData, 
            ingredients: updatedIngredientsString 
        });
        
        // Log for debugging
        console.log("Added ingredient:", ingredient);
        console.log("Updated ingredients list:", updatedList);
    };

    const removeIngredient = (index: number) => {
        const updatedList = [...ingredientsList];
        updatedList.splice(index, 1);
        setIngredientsList(updatedList);
        
        const updatedIngredientsString = convertIngredientsListToString(updatedList);
        setFormData({ 
            ...formData, 
            ingredients: updatedIngredientsString 
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Log what we're submitting for debugging
        console.log("Submitting form with ingredients:", ingredientsList);
        console.log("Form data:", formData);
        
        if (ingredientsList.length === 0) {
            alert("Please add at least one ingredient before submitting.");
            return;
        }
        
        try {
            await onSubmit(formData, ingredientsList);
        } catch (error) {
            console.error("Error submitting recipe:", error);
            alert("There was an error saving your recipe. Please try again.");
        }
    };

    return (
        <div className="mb-8 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-indigo-700 border-b pb-2">
                {isCreating ? 'Create New Recipe' : 'Edit Recipe'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="recipeName" className="block text-sm font-medium text-gray-700 mb-1">Recipe Name</label>
                    <input
                        id="recipeName"
                        type="text"
                        placeholder="E.g., Chocolate Chip Cookies"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
                    <IngredientInput onAddIngredient={addIngredient} />
                    <IngredientsList 
                        ingredients={ingredientsList} 
                        onRemoveIngredient={removeIngredient} 
                    />
                    <input type="hidden" name="ingredients" value={convertIngredientsListToString()} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            id="description"
                            placeholder="Briefly describe your recipe..."
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            rows={3}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                        <textarea
                            id="instructions"
                            placeholder="Step-by-step instructions..."
                            value={formData.instructions}
                            onChange={e => setFormData({...formData, instructions: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            rows={3}
                        />
                    </div>
                </div>
                
                <div className="flex gap-3 pt-2 border-t mt-4">
                    <button 
                        type="submit" 
                        className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {isCreating ? 'Create' : 'Update'} Recipe
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex items-center gap-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
