import { getRecipe, type Recipe } from "@/lib/actions/recipe";
import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from 'next/headers';

export default async function RecipePage({ params }: { params: { id: string } }) {
    const result = await getRecipe(parseInt(params.id));
    const headersList = await headers();
    const referer = headersList.get('referer') || '';
    const isFromSearch = referer.includes('/search');
    
    // Extract search query from referer URL if coming from search
    const searchQuery = isFromSearch ? new URL(referer).searchParams.get('q') || '' : '';
    
    if ('error' in result) {
        notFound();
    }
    
    const recipe = result.recipe;
    const ingredients = typeof recipe.ingredients === 'string' 
        ? JSON.parse(recipe.ingredients) as Record<string, string>
        : recipe.ingredients;

    const hasIngredients = Object.keys(ingredients).length > 0;
    const hasInstructions = recipe.instructions?.trim().length > 0;
    const hasDescription = recipe.description?.trim().length > 0;

    // Determine the grid layout based on available content
    const getGridLayout = () => {
        if (!hasIngredients && !hasInstructions) return 'grid-cols-1';
        if (!hasIngredients || !hasInstructions) return 'grid-cols-1';
        return 'grid-cols-1 md:grid-cols-3';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-amber-50 py-8 px-4 animate-fade-in">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <div className="mb-6 animate-slide-down">
                    <Link 
                        href={isFromSearch ? `/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}` : "/trending"}
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to {isFromSearch ? 'Search' : 'Trending Recipes'}
                    </Link>
                </div>

                {/* Recipe Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up">
                    {/* Header Section */}
                    <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white">
                        <div className="absolute top-4 right-4 flex items-center gap-4 text-white/80">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                                {recipe.authorName}
                            </div>
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                {typeof recipe.likeCount === 'number' ? recipe.likeCount : 0} likes
                            </div>
                        </div>
                        
                        <h1 className="text-4xl font-bold mb-4">{recipe.name}</h1>
                        {hasDescription && (
                            <p className="text-white/90 text-lg">{recipe.description}</p>
                        )}
                    </div>
                    {/* Main Content */}
                    <div className={`grid ${getGridLayout()} gap-8 p-8`}>
                        {/* Ingredients */}
                        {hasIngredients && (
                            <div className={`${!hasInstructions ? 'md:col-span-3' : 'md:col-span-1'} animate-fade-in`} style={{ animationDelay: '200ms' }}>
                                <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 h-full">
                                    <h2 className="text-xl font-semibold text-amber-900 mb-4 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                        </svg>
                                        Ingredients
                                    </h2>
                                    <ul className="space-y-3">
                                        {Object.entries(ingredients).map(([ingredient, quantity]) => (
                                            <li key={ingredient} className="flex items-center text-amber-900">
                                                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                                                <span className="font-medium">{ingredient}:</span>
                                                <span className="text-amber-700 ml-2">{quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        {hasInstructions && (
                            <div className={`${!hasIngredients ? 'md:col-span-3' : 'md:col-span-2'} animate-fade-in`} style={{ animationDelay: '400ms' }}>
                                <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 h-full">
                                    <h2 className="text-xl font-semibold text-indigo-900 mb-4 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        Instructions
                                    </h2>
                                    <div className="prose prose-indigo max-w-none">
                                        {recipe.instructions?.split('\n').map((step: string, index: number) => (
                                            <div key={index} className="flex items-start mb-4">
                                                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold mr-3">
                                                    {index + 1}
                                                </span>
                                                <p className="text-indigo-900">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}