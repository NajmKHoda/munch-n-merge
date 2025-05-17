import { useState } from 'react';
import { Ingredient } from './types';

interface IngredientInputProps {
    onAddIngredient: (ingredient: Ingredient) => void;
}

export default function IngredientInput({ onAddIngredient }: IngredientInputProps) {
    const [newIngredient, setNewIngredient] = useState<Ingredient>({ name: '', quantity: '' });

    const handleAdd = () => {
        if (newIngredient.name.trim() && newIngredient.quantity.trim()) {
            // Make sure we're trimming values before adding
            onAddIngredient({
                name: newIngredient.name.trim(),
                quantity: newIngredient.quantity.trim()
            });
            setNewIngredient({ name: '', quantity: '' });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
            <div className="md:col-span-2">
                <input
                    type="text"
                    placeholder="Ingredient"
                    value={newIngredient.name}
                    onChange={e => setNewIngredient({...newIngredient, name: e.target.value})}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <div className="md:col-span-2">
                <input
                    type="text"
                    placeholder="Quantity"
                    value={newIngredient.quantity}
                    onChange={e => setNewIngredient({...newIngredient, quantity: e.target.value})}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <button 
                type="button" 
                onClick={handleAdd}
                className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition-colors flex items-center justify-center"
                disabled={!newIngredient.name.trim() || !newIngredient.quantity.trim()}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
}
