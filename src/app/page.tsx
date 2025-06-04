import { getUser } from '@/lib/actions/auth';
import Link from 'next/link';
import CakeIcon from '@heroicons/react/24/outline/CakeIcon';
import FireIcon from '@heroicons/react/24/outline/FireIcon';
import UsersIcon from '@heroicons/react/24/outline/UsersIcon';
import SparklesIcon from '@heroicons/react/24/outline/SparklesIcon';
import AdjustmentsHorizontalIcon from '@heroicons/react/24/outline/AdjustmentsHorizontalIcon';

// Improved Chef Hat SVG Icon as React component (outlined, modern, clear)
function ChefHatIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 20C8 20 6 16 8 13C10 10 16 10 18 13C20 10 28 10 30 13C32 10 38 10 40 13C42 16 40 20 36 20" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="white"/>
            <rect x="14" y="20" width="20" height="6" rx="2" fill="white" stroke="#f59e0b" strokeWidth="2.5"/>
            <rect x="18" y="28" width="12" height="4" rx="2" fill="white" stroke="#f59e0b" strokeWidth="2.5"/>
        </svg>
    );
}

// Gemini Sparkle SVG Icon as React component (matches provided image, with black outline)
function GeminiSparkleIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="gemini-gradient" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F8F6F1" />
                    <stop offset="0.3" stopColor="#B6E3F9" />
                    <stop offset="0.7" stopColor="#3ABFF8" />
                    <stop offset="1" stopColor="#0891B2" />
                </linearGradient>
            </defs>
            <path d="M24 4C25.2 13.2 34.8 22.8 44 24C34.8 25.2 25.2 34.8 24 44C22.8 34.8 13.2 25.2 4 24C13.2 22.8 22.8 13.2 24 4Z" fill="url(#gemini-gradient)" stroke="#111827" strokeWidth="2.5" />
        </svg>
    );
}

export default async function Home() {
    const user = await getUser();

    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex flex-col justify-between">
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                <h1 className="text-6xl font-extrabold text-indigo-700 mb-4 tracking-tight drop-shadow-sm">
                    Munch-N-Merge
                </h1>
                <p className="mt-4 text-2xl text-black max-w-2xl mx-auto font-semibold">
                    A platform for experimenting with food and recipes in your community!
                </p>
                <div className="flex flex-wrap gap-4 justify-center mt-10">
                    {user ? (
                        <>
                            <Link href="/myrecipies" className="inline-flex items-center px-6 py-3 rounded-lg text-lg font-semibold text-white bg-indigo-500 hover:bg-indigo-600 shadow transition">
                                My Recipes
                            </Link>
                            <Link href="/trending" className="inline-flex items-center px-6 py-3 rounded-lg text-lg font-semibold text-white bg-amber-400 hover:bg-amber-500 shadow transition">
                                Explore Feed
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/signup" className="inline-flex items-center px-6 py-3 rounded-lg text-lg font-semibold text-white bg-indigo-500 hover:bg-indigo-600 shadow transition">
                                Sign Up
                            </Link>
                            <Link href="/login" className="inline-flex items-center px-6 py-3 rounded-lg text-lg font-semibold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 shadow transition">
                                Sign In
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="max-w-6xl mx-auto py-12 px-4 flex flex-col items-center">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full justify-items-center">
                    <FeatureCard
                        icon={<CakeIcon className="h-10 w-10 text-indigo-400" />}
                        title="Recipe Management"
                        desc="Easily create, edit, and organize your favorite recipes. Your culinary journey starts here!"
                    />
                    <FeatureCard
                        icon={<UsersIcon className="h-10 w-10 text-amber-500" />}
                        title="Social Cooking"
                        desc="Socially connect with friends, share your creations, and get inspired by a vibrant food-loving community. Build your cooking network!"
                    />
                    <FeatureCard
                        icon={<FireIcon className="h-10 w-10 text-amber-400" />}
                        title="Trending & Favorites"
                        desc="See what's hot! Like, favorite, and discover trending recipes from your network."
                    />
                    <FeatureCard
                        icon={<GeminiSparkleIcon className="h-10 w-10" />}
                        title="AI Creativity Control"
                        desc="Adjust how bold or classic your merged recipes are with our AI creativity slider!"
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full py-6 bg-white border-t border-gray-200 mt-8">
                <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm font-medium">
                    Munch-N-Merge | Contributors: Adam Omarbasha, Ahmad Wajid, Omar Lejmi, Abdulrahman Albedawy
                </div>
            </footer>
        </main>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-center border border-gray-100 hover:shadow-lg transition w-full max-w-xs">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500">{desc}</p>
        </div>
    );
}
