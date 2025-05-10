import { getUser } from '@/lib/actions/auth';
import Link from 'next/link';

export default async function Home() {
    const user = await getUser();

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Welcome to Munch-N-Merge
                    </h1>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
                        A platform for experimenting with food and recipes
                    </p>
                    {user ? (
                        <div className="mt-8">
                            <p className="text-lg text-gray-600">
                                Welcome back, {user.username}!
                            </p>
                            <div className="mt-4">
                                <Link
                                    href="/recipes"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    View Recipes
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 space-x-4">
                            <Link
                                href="/login"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/signup"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
