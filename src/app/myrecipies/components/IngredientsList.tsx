import { Ingredient } from './types';

interface IngredientsListProps {
    ingredients: Ingredient[];
    onRemoveIngredient: (index: number) => void;
}

export default function IngredientsList({ ingredients, onRemoveIngredient }: IngredientsListProps) {
    if (ingredients.length === 0) {
        return null;
    }

    return (
        <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200">
            <div className="p-2 bg-indigo-50 rounded-t-lg border-b border-gray-200">
                <h4 className="font-medium text-sm text-indigo-700">Added Ingredients</h4>
            </div>
            <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {ingredients.map((ingredient, index) => (
                    <li key={index} className="flex justify-between items-center p-2 hover:bg-gray-50">
                        <span>
                            <span className="font-medium text-gray-700">{ingredient.name}:</span> {ingredient.quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => onRemoveIngredient(index)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                            aria-label="Remove ingredient"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
