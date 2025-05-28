export interface Recipe {
    id: number;
    authorId: number | null;
    name: string;
    ingredients: Record<string, string>;
    description: string;
    instructions: string;
    likeCount: number;
    createdat?: string | Date;
}

export interface Ingredient {
    name: string;
    quantity: string;
}

export interface FormData {
    name: string;
    ingredients: string;
    description: string;
    instructions: string;
}
