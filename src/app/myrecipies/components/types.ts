export interface Recipe {
    id: number;
    name: string;
    description: string;
    instructions: string;
    ingredients: Record<string, string>;
    authorId: number | string;
    authorName: string;
    likeCount: number;
}

export interface FormData {
    name: string;
    description: string;
    instructions: string;
}

export interface Ingredient {
    name: string;
    quantity: string;
}
