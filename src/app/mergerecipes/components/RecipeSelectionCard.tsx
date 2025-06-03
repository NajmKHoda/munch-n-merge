import { useState } from 'react';
import { Recipe } from '@/lib/actions/recipe';
type RecipeSelectionCardProps = {
  recipe: Recipe;
  isSelected: boolean;
  onToggleSelect: () => void;
  isExternal?: boolean;
};

export default function RecipeSelectionCard({ 
  recipe, 
  isSelected, 
  onToggleSelect,
  isExternal = false
}: RecipeSelectionCardProps) {
  const [showIngredients, setShowIngredients] = useState(false);
  return (
    <div 
      className={`border rounded-lg p-4 bg-white shadow-sm hover:shadow transition-all duration-200 relative overflow-hidden cursor-pointer
        ${isSelected ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200'}
        ${isExternal ? 'border-l-4 border-l-amber-500' : ''}`}
      onClick={onToggleSelect}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${isExternal ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
      
      <div className="absolute top-2 right-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors
          ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
            </svg>
          )}
        </div>
      </div>
      
      <div className="ml-2 pr-8">
        {isExternal && (
          <div className="mb-2 text-amber-600 text-xs font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            From Feed
          </div>
        )}
        
        <h2 className="text-xl font-bold mb-2 text-gray-800">{recipe.name}</h2>
        <p className="text-gray-600 mb-3 text-sm">{recipe.description}</p>
        
        <div className="mb-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowIngredients(!showIngredients);
            }}
            className="text-amber-600 font-medium text-sm flex items-center mb-2 hover:text-amber-700"
          >
            {showIngredients ? '▼' : '►'} Ingredients
          </button>
          
          {showIngredients && (
            <div className="bg-indigo-50 p-2 rounded-md border border-indigo-100 mb-2" onClick={e => e.stopPropagation()}>
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
        
        <div className="bg-gray-50 p-2 rounded-md border border-gray-100 mt-3">
          <p className="text-sm text-indigo-700 font-medium">
            {isSelected ? 'Selected for merging' : 'Click to select for merging'}
          </p>
          {isExternal && (
            <p className="text-xs text-gray-500 mt-1">
              Recipe by {recipe.authorName || `Chef #${recipe.authorName}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
