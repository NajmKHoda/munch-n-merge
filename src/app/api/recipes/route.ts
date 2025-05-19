import { NextResponse } from 'next/server';
import { sql } from '@/lib/sql';
import { getUser } from '@/lib/actions/auth';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const recipes = await sql`
      SELECT * FROM Recipe 
      WHERE authorId = ${user.id}
      ORDER BY id DESC
    `;

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
