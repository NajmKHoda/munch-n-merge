import { getUser } from '@/lib/actions/auth';
import Link from 'next/link';

export default async function Home() {
    const user = await getUser();

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                            Welcome to Munch-N-Merge
                        </h1>
                        <p className="mt-5 text-xl text-gray-500">
                            A platform for experimenting with food and recipes
                        </p>
                        {user ? (
                            <div className="mt-8">
                                <p className="text-lg text-gray-600">
                                    Welcome back, {user.username}!
                                </p>
                                <div className="mt-4 flex flex-wrap gap-4 justify-center">
                                    <Link
                                        href="/myrecipies"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        View My Recipes
                                    </Link>
                                    <Link
                                        href="/feed"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-amber-500 hover:bg-amber-600"
                                    >
                                        Explore Recipe Feed
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-8 flex gap-4 justify-center">
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
            </div>
        </main>
    );
}
