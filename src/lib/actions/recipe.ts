"use server";

import { sql } from '../sql';
import { generateMergedRecipe } from '../genai';
import { getUser } from './auth';
import type { Errorable } from './types';

const MAX_SEARCH_LIMIT = 25;

/**
 * Creates a new recipe in the database.
 * @param name - The name of the recipe.
 * @param description - An optional description of the recipe.
 * @param ingredients - An optional string-string record ( name : quantity )
 * @param instructions - Optional instructions for preparing the recipe.
 * @returns An object with either:
 *          { id: number } containing the new recipe ID if successful, or
 *          { error: 'not-logged-in' | 'server-error' } if an error occurs.
 */
export async function createRecipe(
    name: string,
    description?: string,
    ingredients?: Record<string, string>,
    instructions?: string
): Errorable<{ id: number }> {
    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };

        const recipe = await sql`INSERT INTO Recipe (name, authorid, description, ingredients, instructions)
            VALUES (${name}, ${user.id}, ${description || ''}, ${ingredients || []}, ${instructions || ''})
            RETURNING id`;
        return { id: recipe[0].id };
    } catch (e) {
        return { error: 'server-error' };
    }
}

/**
 * Retrieves a recipe by its ID.
 * @param id - The ID of the recipe to retrieve.
 * @returns An object with either:
 *          { recipe: Recipe } containing the requested recipe if found, or
 *          { error: 'not-found' | 'server-error' } if an error occurs.
 */
export async function getRecipe(id: number): Errorable<{ recipe: Recipe }> {
    try {
        const recipes = await sql`
            SELECT r.*, u.username as authorname, u.ispublic, u.id as authorid
            FROM RecipeWithLikes r
            JOIN AppUser u ON r.authorid = u.id
            WHERE r.id = ${id}
        `;
        if (recipes.length === 0) return { error: 'not-found' };
        
        const recipe = recipes[0];
        const currentUser = await getUser();
        
        // If the recipe author's profile is private, check access permissions
        if (!recipe.ispublic) {
            // If not logged in and profile is private, deny access
            if (!currentUser) {
                return { error: 'not-found' };
            }
            
            // If it's not the user's own recipe, check if they're friends
            if (currentUser.id !== recipe.authorid) {
                const friendship = await sql`
                    SELECT 1 FROM Friend 
                    WHERE (id1 = ${currentUser.id} AND id2 = ${recipe.authorid})
                    OR (id1 = ${recipe.authorid} AND id2 = ${currentUser.id})
                `;
                
                if (friendship.length === 0) {
                    return { error: 'not-found' };
                }
            }
        }
        
        // Remove the ispublic field from the response (create a new object without it)
        const recipeData = {
            id: recipe.id,
            name: recipe.name,
            description: recipe.description,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            createdAt: recipe.createdAt,
            likecount: recipe.likecount,
            authorid: recipe.authorid,
            authorname: recipe.authorname,
            difficulty: recipe.difficulty,
            profile_picture: recipe.profile_picture
        };
        return { recipe: recipeData as Recipe };
    } catch (e) {
        console.error('Error fetching recipe:', e);
        return { error: 'server-error' };
    }
}

export async function getUserRecipes(): Errorable<{ recipes: Recipe[] }> {
    try {
        const user = await getUser();
        if (!user) {
            return { error: 'not-logged-in' };
        }

        const recipes = await sql`
            SELECT * FROM RecipeWithLikes WHERE authorid = ${user.id}
        ` as Recipe[];

        return { recipes };
    } catch (error) {
        console.error('Error fetching user recipes:', error);
        return { error: 'server-error' };
    }
}

/**
 * Updates an existing recipe in the database.
 * @param id - The ID of the recipe to update.
 * @param name - An optional new name for the recipe.
 * @param description - An optional new description for the recipe.
 * @param ingredients - Optional new ingredients for the recipe ( name : quantity ).
 * @param instructions - Optional new instructions for the recipe.
 * @returns A string indicating the result of the operation:
 *          'success', 'not-logged-in', 'not-found', or 'server-error'.
 */
export async function updateRecipe(
    id: number,
    name?: string,
    description?: string,
    ingredients?: Record<string, string>,
    instructions?: string
) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';

        const recipe = await sql`UPDATE Recipe SET
            name = COALESCE(${name}, name),
            description = COALESCE(${description}, description),
            ingredients = COALESCE(${JSON.stringify(ingredients)}, ingredients),
            instructions = COALESCE(${instructions}, instructions)
            WHERE id = ${id} AND authorid = ${user.id}
            RETURNING id`;
        if (recipe.length === 0) return 'not-found';

        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

/**
 * Deletes a recipe from the database.
 * @param id - The ID of the recipe to delete.
 * @returns A string indicating the result of the operation:
 *          'success', 'not-logged-in', 'not-found', or 'server-error'.
 */
export async function deleteRecipe(id: number) {
    try {
        const user = await getUser();
        if (!user) return 'not-logged-in';
        
        const recipe = await sql`DELETE FROM Recipe
            WHERE id = ${id} AND authorid = ${user.id}
            RETURNING id`;
        if (recipe.length === 0) return 'not-found';

        return 'success';
    } catch (e) {
        return 'server-error';
    }
}

/**
 * Merges multiple recipes into a single new recipe using AI generation.
 * @param ids - An array of recipe IDs to merge. Must include at least two IDs.
 * @param temperature - An optional temperature value for AI creativity (must be between 0 and 2, inclusive; higher values result in more creative outputs).
 * @returns An object with either:
 *          { id: number } containing the new merged recipe ID if successful, or
 *          { error: 'not-enough-recipes' | 'not-logged-in' | 'recipe-not-found' | 'generation-error' | 'invalid-temperature' | 'server-error' } if an error occurs.
 * 
 * Errors:
 * - 'not-enough-recipes': Fewer than two recipe IDs were provided.
 * - 'not-logged-in': The user is not logged in.
 * - 'recipe-not-found': One or more recipes were not found or do not belong to the user.
 * - 'generation-error': The AI failed to generate a merged recipe.
 * - 'invalid-temperature': The provided temperature value is outside the valid range (0 to 2).
 * - 'server-error': A server-side error occurred.
 */
export async function mergeRecipes(ids: number[], temperature?: number): Errorable<{ id: number }> {
    if (ids.length < 2) return { error: 'not-enough-recipes' };
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
        return { error: 'invalid-temperature' };
    }

    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };
        const recipes = (await sql`
            SELECT * FROM Recipe
            WHERE id = ANY(${ids}) AND authorid = ${user.id}
        `) as Recipe[];

        if (recipes.length === 0) return { error: 'recipe-not-found' };

        const mergedRecipe = await generateMergedRecipe(recipes, temperature);
        console.log('Merged recipe:', mergedRecipe);
        if (mergedRecipe === null) return { error: 'generation-error' };

        const [{ id: mergedRecipeId }] = await sql`
            WITH MergedRecipe AS (
                INSERT INTO Recipe (name, authorid, description, ingredients, instructions, difficulty)
                VALUES (
                    ${mergedRecipe.name},
                    ${user.id},
                    ${mergedRecipe.description},
                    ${JSON.stringify(mergedRecipe.ingredients)},
                    ${mergedRecipe.instructions}
                    ${mergedRecipe.difficulty || null}  -- Difficulty is optional
                )
                RETURNING id
            )
            INSERT INTO RecipeLink (parentId, childId)
            SELECT parentId, (SELECT id FROM MergedRecipe)
            FROM UNNEST(${ids}::int[]) AS parentId
            RETURNING (SELECT id FROM MergedRecipe);
        `;

        return { id: mergedRecipeId };
    } catch (e) {
        return { error: 'server-error' };
    }
}

/**
 * Merges multiple recipes (including others' recipes) into a single new recipe using AI generation.
 * This allows merging recipes that weren't created by the current user.
 * 
 * @param ids - An array of recipe IDs to merge. Must include at least two IDs.
 * @param temperature - An optional temperature value for AI creativity.
 * @returns An object with either:
 *          { id: number } containing the new merged recipe ID if successful, or
 *          { error: string } if an error occurs.
 */
export async function mergeWithExternalRecipes(ids: number[], temperature?: number): Errorable<{ id: number }> {
    if (ids.length < 2) return { error: 'not-enough-recipes' };
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
        return { error: 'invalid-temperature' };
    }

    try {
        const user = await getUser();
        if (!user) return { error: 'not-logged-in' };
        
        // Get all recipes, but filter to only include ones the user has access to
        const recipes = (await sql`
            SELECT r.* FROM Recipe r
            JOIN AppUser u ON r.authorid = u.id
            WHERE r.id = ANY(${ids})
              AND (u.ispublic = true 
                   OR u.id = ${user.id}
                   OR EXISTS (
                       SELECT 1 FROM Friend 
                       WHERE (id1 = ${user.id} AND id2 = u.id)
                       OR (id1 = u.id AND id2 = ${user.id})
                   ))
        `) as Recipe[];
        
        // Check if user has access to all requested recipes
        if (recipes.length !== ids.length) {
            return { error: 'recipe-not-found' };
        }

        const mergedRecipe = await generateMergedRecipe(recipes, temperature);
        if (mergedRecipe === null) return { error: 'generation-error' };
        console.log('Merged recipe:', mergedRecipe);
        // First, just create the merged recipe and return its ID
        const [{ id: mergedRecipeId }] = await sql`
                INSERT INTO Recipe (name, authorid, description, ingredients, instructions, difficulty)
                VALUES (
                    ${mergedRecipe.name},
                    ${user.id},
                    ${mergedRecipe.description},
                    ${JSON.stringify(mergedRecipe.ingredients)},
                    ${mergedRecipe.instructions},
                    ${mergedRecipe.difficulty || null}
                )
                RETURNING id
            `;

        
        // Then insert recipe links one by one to avoid duplicate key errors
        for (const parentId of ids) {
            try {
                await sql`
                    INSERT INTO RecipeLink (parentId, childId)
                    VALUES (${parentId}, ${mergedRecipeId})
                    ON CONFLICT DO NOTHING
                `;
            } catch (e) {
                console.log(`Skipping duplicate link for parent ${parentId} -> child ${mergedRecipeId}`);
            }
        }

        return { id: mergedRecipeId };
    } catch (e) {
        console.error("Error merging with external recipes:", e);
        return { error: 'server-error' };
    }
}

/**
 * Retrieves the merge history for a recipe, showing all parent recipes that were used to create it.
 * Uses a recursive query to traverse the recipe merge tree and find all ancestors.
 * @param id - The ID of the recipe to get merge history for.
 * @returns An object with either:
 *          { history: Array<{ id: number, name: string, parentIds: number[] }> } containing the recipe history tree if successful, or
 *          { error: 'not-found' | 'server-error' } if an error occurs.
 * 
 * The history array contains nodes representing recipes in the merge tree, where each node has:
 * - id: The recipe ID
 * - name: The recipe name  
 * - parentIds: Array of recipe IDs that were merged to create this recipe (empty for original recipes)
 * 
 * @example
 * For a recipe with ID 5 that was merged from recipes 1 and 2, where recipe 2 was itself merged from recipes 3 and 4:
 * ```
 * Recipe 1 (original)    Recipe 3 (original)    Recipe 4 (original)
 *         \                      \                      /
 *          \                      \____Recipe 2_______/
 *           \                            /
 *            \__________Recipe 5________/
 * ```
 * 
 * The returned history would be:
 * ```
 * [
 *   { id: 1, name: "Pasta Salad", parentIds: [] },
 *   { id: 2, name: "Veggie Stir Fry", parentIds: [3, 4] },
 *   { id: 3, name: "Caesar Salad", parentIds: [] },
 *   { id: 4, name: "Fried Rice", parentIds: [] },
 *   { id: 5, name: "Fusion Bowl", parentIds: [1, 2] }
 * ]
 * ```
 */
export async function getRecipeMergeHistory(id: number): Errorable<{
    history: {
        id: number,
        name: string,
        parentIds: number[]
    }[]
}> {
    try {
        const nodes = await sql`
            WITH RECURSIVE RecipeHistory AS (
                SELECT r.id, r.name FROM Recipe r WHERE id = ${id}
                UNION
                SELECT r.id, r.name FROM RecipeLink rl
                JOIN RecipeHistory rh ON rl.childId = rh.id
                JOIN Recipe r ON rl.parentId = r.id
            )
            SELECT
            rh.id, rh.name,
            COALESCE(
                jsonb_agg(rl.parentId) FILTER (WHERE rl.parentId IS NOT NULL),
                '[]'::jsonb
            ) AS "parentIds"
            FROM RecipeHistory rh
            LEFT JOIN RecipeLink rl ON rh.id = rl.childId
            GROUP BY rh.id, rh.name
        ` as { id: number, name: string, parentIds: number[] }[];

        if (nodes.length === 0) return { error: 'not-found' };
        console.log(nodes);
        return { history: nodes }
    } catch (e) {
        console.error('Error fetching recipe merge history:', e);
        return { error: 'server-error' };
    }
}

/**
 * Gets recipe search suggestions based on a query string.
 * @param query - The search query to match against recipe names
 * @returns An object with either:
 *          { suggestions: Array<{ id: number, name: string }> } containing the matching suggestions if successful, or
 *          { error: 'server-error' } if an error occurs.
 */
export async function getSearchSuggestions(query: string): Errorable<{ suggestions: { id: number, name: string }[] }> {
    try {
        const trimmed = query.trim();
        
        if (!trimmed) {
            return { suggestions: [] };
        }

        const currentUser = await getUser();
        
        if (!currentUser) {
            // If not logged in, only search recipes from public users
            const suggestions = await sql`
                SELECT r.id, r.name
                FROM Recipe r
                JOIN AppUser u ON r.authorid = u.id
                WHERE LOWER(r.name) LIKE LOWER(${'%' + trimmed + '%'}) 
                  AND u.ispublic = true
                ORDER BY r.name ASC
                LIMIT 5
            ` as { id: number, name: string }[];
            return { suggestions };
        }

        // If logged in, search recipes from public users and friends
        const suggestions = await sql`
            SELECT r.id, r.name
            FROM Recipe r
            JOIN AppUser u ON r.authorid = u.id
            WHERE LOWER(r.name) LIKE LOWER(${'%' + trimmed + '%'})
              AND (u.ispublic = true 
                   OR u.id = ${currentUser.id}
                   OR EXISTS (
                       SELECT 1 FROM Friend 
                       WHERE (id1 = ${currentUser.id} AND id2 = u.id)
                       OR (id1 = u.id AND id2 = ${currentUser.id})
                   ))
            ORDER BY r.name ASC
            LIMIT 5
        ` as { id: number, name: string }[];
        
        return { suggestions };
    } catch (e) {
        console.error('Error fetching search suggestions:', e);
        return { error: 'server-error' };
    }
}

/**
 * Searches for recipes by title.
 * @param query - The search query to match against recipe titles
 * @returns An object with either:
 *          { recipes: Recipe[] } containing the matching recipes if successful, or
 *          { error: 'server-error' } if an error occurs.
 */
export async function searchRecipes(query: string): Errorable<{ recipes: Recipe[] }> {
    try {
        const currentUser = await getUser();
        
        if (!currentUser) {
            // If not logged in, only search recipes from public users
            const recipes = await sql`
                SELECT r.*, u.username as authorname,
                       COUNT(rl.userId) as likecount
                FROM Recipe r
                LEFT JOIN AppUser u ON r.authorid = u.id
                LEFT JOIN RecipeLike rl ON r.id = rl.recipeId
                WHERE LOWER(r.name) LIKE LOWER(${'%' + query + '%'}) 
                  AND u.ispublic = true
                GROUP BY r.id, u.username
                ORDER BY likecount DESC, r.name ASC
                LIMIT ${MAX_SEARCH_LIMIT}
            `;
            return { recipes: recipes as Recipe[] };
        }

        // If logged in, search recipes from public users and friends
        const recipes = await sql`
            SELECT r.*, u.username as authorname,
                   COUNT(rl.userId) as likecount
            FROM Recipe r
            LEFT JOIN AppUser u ON r.authorid = u.id
            LEFT JOIN RecipeLike rl ON r.id = rl.recipeId
            WHERE LOWER(r.name) LIKE LOWER(${'%' + query + '%'})
              AND (u.ispublic = true 
                   OR u.id = ${currentUser.id}
                   OR EXISTS (
                       SELECT 1 FROM Friend 
                       WHERE (id1 = ${currentUser.id} AND id2 = u.id)
                       OR (id1 = u.id AND id2 = ${currentUser.id})
                   ))
            GROUP BY r.id, u.username
            ORDER BY likecount DESC, r.name ASC
            LIMIT ${MAX_SEARCH_LIMIT}
        `;
        
        return { recipes: recipes as Recipe[] };
    } catch (e) {
        console.error('Error searching recipes:', e);
        return { error: 'server-error' };
    }
}

export async function getRecipesByUserId(userId: number): Errorable<{ recipes: Recipe[] }> {
    try {
        const currentUser = await getUser();
        
        // If the current user is viewing their own recipes, return all
        if (currentUser && currentUser.id === userId) {
            const recipes = await sql`
                SELECT r.*, u.username as authorname, u.profile_picture as authorprofilepicture
                FROM RecipeWithLikes r
                JOIN AppUser u ON r.authorid = u.id
                WHERE r.authorid = ${userId}
                ORDER BY r.createdAt DESC
            ` as Recipe[];
            return { recipes };
        }

        // Check if the profile owner's account is public
        const profileOwner = await sql`
            SELECT ispublic FROM AppUser WHERE id = ${userId}
        `;
        if (profileOwner.length === 0) {
            return { recipes: [] };
        }

        // If the profile is public, return all recipes
        if (profileOwner[0].ispublic) {
            const recipes = await sql`
                SELECT r.*, u.username as authorname, u.profile_picture as authorprofilepicture
                FROM RecipeWithLikes r
                JOIN AppUser u ON r.authorid = u.id
                WHERE r.authorid = ${userId}
                ORDER BY r.createdAt DESC
            ` as Recipe[];
            return { recipes };
        }

        // If the profile is private, check if current user is friends with the profile owner
        if (!currentUser) {
            // Not logged in and profile is private - no recipes visible
            return { recipes: [] };
        }

        const friendship = await sql`
            SELECT 1 FROM Friend 
            WHERE (id1 = ${currentUser.id} AND id2 = ${userId})
            OR (id1 = ${userId} AND id2 = ${currentUser.id})
        `;

        // If they are friends, return recipes; otherwise return empty array
        if (friendship.length > 0) {
            const recipes = await sql`
                SELECT r.*, u.username as authorname, u.profile_picture as authorprofilepicture
                FROM RecipeWithLikes r
                JOIN AppUser u ON r.authorid = u.id
                WHERE r.authorid = ${userId}
                ORDER BY r.createdAt DESC
            ` as Recipe[];
            return { recipes };
        }

        // Profile is private and not friends - return empty array
        return { recipes: [] };
    } catch (error) {
        console.error('Error fetching user recipes:', error);
        return { error: 'server-error' };
    }
}

export async function getRecipesByIds(ids: number[]): Errorable<{ recipes: Recipe[] }> {
    try {
        const currentUser = await getUser();
        
        if (!currentUser) {
            // If not logged in, only return recipes from public users
            const recipes = await sql`
                SELECT 
                    r.*,
                    u.username as authorname,
                    u.profile_picture,
                    u.id as authorid
                FROM RecipeWithLikes r
                JOIN AppUser u ON r.authorid = u.id
                WHERE r.id = ANY(${ids}) AND u.ispublic = true
            ` as Recipe[];
            return { recipes };
        }

        // If logged in, return recipes from public users and friends
        const recipes = await sql`
            SELECT 
                r.*,
                u.username as authorname,
                u.profile_picture,
                u.id as authorid
            FROM RecipeWithLikes r
            JOIN AppUser u ON r.authorid = u.id
            WHERE r.id = ANY(${ids})
              AND (u.ispublic = true 
                   OR u.id = ${currentUser.id}
                   OR EXISTS (
                       SELECT 1 FROM Friend 
                       WHERE (id1 = ${currentUser.id} AND id2 = u.id)
                       OR (id1 = u.id AND id2 = ${currentUser.id})
                   ))
        ` as Recipe[];
        return { recipes };
    } catch (e) {
        console.error('Error fetching recipes by ids:', e);
        return { error: 'server-error' };
    }
}

export interface Recipe {
  id: number;
  name: string;
  description: string;
  ingredients: string;
  instructions: string;
  createdAt: Date;
  likecount: number;
  authorid: number;
  authorname: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null | string;
  profile_picture?: string | null;
};
