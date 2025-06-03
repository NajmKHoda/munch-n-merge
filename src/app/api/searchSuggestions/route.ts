import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/sql';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get('q') || '';
    const trimmed = q.trim();

    if (!trimmed) {
        return NextResponse.json({ suggestions: [] });
    }

    const rows = (await sql`
        SELECT id, name
        FROM Recipe
        WHERE name ILIKE ${'%' + trimmed + '%'}
        ORDER BY name
        LIMIT 5
    `) as { id: number, name: string }[];

    return NextResponse.json({ suggestions: rows });
}