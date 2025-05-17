import { Recipe } from './types';
import { useState } from 'react';

interface RecipeCardProps {
    recipe: Recipe;
    onEdit: (recipe: Recipe) => void;
    onDelete: (id: number) => void;
}

export default function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
    const [showIngredients, setShowIngredients] = useState(false);

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow transition-all duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <div className="ml-2">
                <h2 className="text-xl font-bold mb-2 text-gray-800">{recipe.name}</h2>
                <p className="text-gray-600 mb-3 text-sm">{recipe.description}</p>
                
                <div className="mb-3">
                    <button 
                        onClick={() => setShowIngredients(!showIngredients)}
                        className="text-amber-600 font-medium text-sm flex items-center mb-2 hover:text-amber-700"
                    >
                        {showIngredients ? '▼' : '►'} Ingredients
                    </button>
                    
                    {showIngredients && (
                        <div className="bg-indigo-50 p-2 rounded-md border border-indigo-100 mb-2">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-0.5 text-sm">
                                {Object.entries(recipe.ingredients).map(([ingredient, quantity]) => (
                                    <li key={ingredient} className="flex items-center text-gray-700 py-0.5">
                                        <span className="font-medium">{ingredient}:</span>
                                        <span className="text-gray-600 ml-1">{quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                
                <div className="mb-3">
                    <h3 className="font-medium mb-2 text-gray-700 text-sm">Instructions</h3>
                    <p className="whitespace-pre-wrap text-gray-700 text-sm bg-gray-50 p-3 rounded-md border border-gray-100">{recipe.instructions}</p>
                </div>
                
                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                    <button
                        onClick={() => onEdit(recipe)}
                        className="bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 transition-colors flex items-center gap-1 text-sm"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(recipe.id)}
                        className="bg-white text-red-500 border border-red-500 px-3 py-1.5 rounded hover:bg-red-50 transition-colors flex items-center gap-1 text-sm"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
