'use server';

import { sql } from '@/lib/sql';
import { getUser } from '@/lib/actions/auth';
import { Recipe } from '../myrecipies/components/types';

export async function getRecipesForUser() {
  try {
    const user = await getUser();
    if (!user) {
      return [];
    }

    const recipes = await sql`
      SELECT * FROM Recipe 
      WHERE authorId = ${user.id}
      ORDER BY id DESC
    `;

    return recipes as Recipe[];
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw new Error('Failed to fetch recipes');
  }
}
