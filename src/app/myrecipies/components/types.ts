export interface Recipe {
    id: number;
    name: string;
    description: string;
    instructions: string;
    ingredients: Record<string, string>;
    authorid: number | string;
    authorname: string;
    likecount: number;
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
