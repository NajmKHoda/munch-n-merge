'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTrendingRecipes, type TrendingItem } from '@/lib/actions/feed';
import { likeRecipe, unlikeRecipe, getUserLikes } from '@/lib/actions/like';

const ITEMS_PER_PAGE = 10;

export default function TrendingPage() {
    const [recipes, setRecipes] = useState<TrendingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [likes, setLikes] = useState<Record<number, boolean>>({});

    const loadRecipes = async (newOffset: number = 0) => {
        setLoading(true);
        setError(null);
        const rows = await getTrendingRecipes(ITEMS_PER_PAGE, newOffset);

        if (newOffset === 0) {
            setRecipes(rows);
        } else {
            setRecipes(prev => [...prev, ...rows]);
        }
        setHasMore(rows.length === ITEMS_PER_PAGE);
        setOffset(newOffset);
        setLoading(false);
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

  useEffect(() => {
    loadRecipes();
    loadUserLikes();
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadRecipes(offset + ITEMS_PER_PAGE);
    }
  };

  const handleLike = async (id: number) => {
    // Store the recipe we're modifying for immediate UI update
    const recipeToUpdate = recipes.find(r => r.id === id);
    if (!recipeToUpdate) return;
    
    // Get current like count as a number
    const currentLikeCount = Number((recipeToUpdate as any).likecount || recipeToUpdate.likeCount || 0);
    
    if (likes[id]) {
      // Immediately update UI for better user experience
      setLikes(prev => ({ ...prev, [id]: false }));
      setRecipes(prev => 
        prev.map(recipe => 
          recipe.id === id ? { 
            ...recipe, 
            likeCount: Math.max(0, currentLikeCount - 1),
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
              likeCount: currentLikeCount,
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
            likeCount: currentLikeCount + 1,
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
              likeCount: currentLikeCount,
              likecount: currentLikeCount 
            } : recipe
          )
        );
      }
    }
  };

  if (error && recipes.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Trending Recipes</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          {error === 'Please log in to view your feed' && (
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
      <h1 className="text-3xl font-bold mb-6 text-indigo-800">Trending Recipes</h1>
      
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
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {((recipe as any).authorid || recipe.authorId)?.toString()[0] || '?'}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-800">Chef #{(recipe as any).authorname || recipe.authorId}</p>
                  <p className="text-xs text-gray-500">Recipe Creator</p>
                </div>
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
                    {Number((recipe as any).likecount || recipe.likeCount || 0)}
                  </span>
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
              
            </div>
          </div>
        ))}
      </div>
      
      {recipes.length === 0 && !loading && (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-600 font-medium">No trending recipes yet</p>
          <p className="text-gray-500 mt-2 text-sm">Be the first to like a few dishes and they'll show up here!</p>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {hasMore && recipes.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors shadow-sm"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
