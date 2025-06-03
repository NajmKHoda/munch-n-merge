'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserFavorites } from '@/lib/actions/favorite';
import { likeRecipe, unlikeRecipe, getUserLikes } from '@/lib/actions/like';
import { addFavorite, removeFavorite } from '@/lib/actions/favorite';
import { Recipe } from '@/lib/actions/recipe';
import { getRecipesByIds } from '@/lib/actions/recipe';
import Image from 'next/image';

const DEFAULT_PROFILE_PIC = '/images/IconForWebsite.png';

export default function FavoritesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});

  // Load recipes and user likes/favorites
  const loadRecipes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch favorite recipe IDs
      const favoritesResult = await getUserFavorites();
      if ('error' in favoritesResult) {
        if (favoritesResult.error === 'not-logged-in') {
          setError('Please log in to view your favorites');
        } else {
          setError('Failed to load favorites');
        }
        return;
      }

      // Fetch the actual recipes
      if (favoritesResult.favoriteRecipes.length === 0) {
        setRecipes([]);
        return;
      }

      const recipesResult = await getRecipesByIds(favoritesResult.favoriteRecipes);
      if ('error' in recipesResult) {
        setError('Failed to load recipes');
        return;
      }

      setRecipes(recipesResult.recipes);
      
      // Fetch user likes and favorites
      await Promise.all([loadUserLikes(), loadUserFavorites()]);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const handleLike = async (id: number) => {
    // Store the recipe we're modifying for immediate UI update
    const recipeToUpdate = recipes.find(r => r.id === id);
    if (!recipeToUpdate) return;
    
    // Get current like count as a number
    const currentLikeCount = Number((recipeToUpdate as any).likecount || 0);
    
    if (likes[id]) {
      // Immediately update UI for better user experience
      setLikes(prev => ({ ...prev, [id]: false }));
      setRecipes(prev => 
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
        setRecipes(prev => 
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
      setRecipes(prev => 
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
        setRecipes(prev => 
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

  const handleFavorite = async (id: number) => {
    if (favorites[id]) {
      // Immediately update UI for better user experience
      setFavorites(prev => ({ ...prev, [id]: false }));
      
      // Make API call
      const result = await removeFavorite(id);
      
      // If API call fails, revert UI changes
      if (result !== 'success') {
        setFavorites(prev => ({ ...prev, [id]: true }));
      } else {
        // Remove the recipe from the list if unfavorited
        setRecipes(prev => prev.filter(recipe => recipe.id !== id));
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

  if (error && recipes.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Favorite Recipes</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          {error === 'Please log in to view your favorites' && (
            <Link href="/login" className="underline font-medium">
              Go to login
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-indigo-800">Favorite Recipes</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        {recipes.map(recipe => (
          <div key={recipe.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            
            {/* Recipe author header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Image
                  src={(recipe as any).authorProfilePicture || (recipe as any).authorprofilepicture || DEFAULT_PROFILE_PIC}
                  alt={((recipe as any).authorName || (recipe as any).authorname) + ' profile picture'}
                  width={36}
                  height={36}
                  className="rounded-full border border-neutral-200 bg-white"
                />
                <Link
                  href={`/user/${recipe.authorid}`}
                  className="font-semibold text-indigo-700 hover:underline"
                >
                  Chef #{(recipe as any).authorName || (recipe as any).authorname}
                </Link>
              </div>
              
              <div className="flex items-center">
                <button 
                  onClick={() => handleLike(recipe.id)}
                  className={`flex items-center gap-1 p-1 rounded-md min-w-[60px] justify-center ${likes[recipe.id] ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label={likes[recipe.id] ? "Unlike recipe" : "Like recipe"}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6 flex-shrink-0" 
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
                  <span className="text-sm w-5 text-center">
                    {Number((recipe as any).likecount || 0)}
                  </span>
                </button>

                <button 
                  onClick={() => handleFavorite(recipe.id)}
                  className={`flex items-center gap-1 p-1 rounded-md ml-2 ${favorites[recipe.id] ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label={favorites[recipe.id] ? "Remove from favorites" : "Add to favorites"}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
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
                
                <Link 
                  href={`/mergerecipes?recipeId=${recipe.id}`}
                  className="flex items-center gap-1 p-1 rounded-md ml-2 text-amber-500 hover:text-amber-600 transition-colors"
                  title="Remix this recipe"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
                    />
                  </svg>
                  <span className="text-sm">Remix</span>
                </Link>
              </div>
              
            </div>
            
            {/* Recipe content */}
            <div className="p-4 ml-2">
              <Link 
                href={`/recipes/${recipe.id}`}
                className="block mb-2"
              >
                <h2 className="text-xl font-bold text-gray-800 hover:text-indigo-600 transition-colors">
                  {recipe.name}
                </h2>
              </Link>
              
              <p className="text-gray-600 mb-3 text-sm">{recipe.description}</p>
              
              {/* Ingredients preview */}
              {Object.keys(recipe.ingredients).length > 0 && (
                <div className="mb-3">
                  <button 
                    className="text-amber-600 font-medium text-sm flex items-center mb-2 hover:text-amber-700"
                  >
                    Ingredients
                  </button>
                  
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(recipe.ingredients).slice(0, 3).map(ingredient => (
                      <span key={ingredient} className="bg-blue-50 text-indigo-700 text-xs px-2 py-1 rounded">
                        {ingredient}
                      </span>
                    ))}
                    {Object.keys(recipe.ingredients).length > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{Object.keys(recipe.ingredients).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Difficulty Badge - Moved to bottom right */}
              {recipe.difficulty && (
                <div className="absolute bottom-4 right-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${recipe.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                      recipe.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}`}
                  >
                    {recipe.difficulty}
                  </span>
                </div>
              )}
              
            </div>
          </div>
        ))}
      </div>
      
      {recipes.length === 0 && !loading && (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <p className="text-gray-600 font-medium">No favorite recipes yet</p>
          <p className="text-gray-500 mt-2 text-sm">Start exploring the feed and favorite some recipes!</p>
          <Link href="/trending" className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm">
            Explore Trending Recipies
          </Link>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </div>
  );
}
