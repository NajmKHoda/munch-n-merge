'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import { useUser } from '@/lib/context/UserContext';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const { user, refreshUser } = useUser();

    const handleLogout = async () => {
        await logout();
        await refreshUser();
        window.location.href = '/';
    };

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors duration-200">
                                <span className="hidden sm:inline">Munch-N-Merge</span>
                                <span className="sm:hidden">M&M</span>
                            </Link>
                        </div>
                        <div className="hidden md:ml-8 md:flex md:space-x-4 lg:space-x-6">
                            <Link
                                href="/"
                                className={`inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                                    isActive('/')
                                        ? 'border-indigo-500 text-gray-900 font-semibold'
                                        : 'border-transparent text-gray-500 hover:border-indigo-200 hover:text-gray-700'
                                }`}
                            >
                                Home
                            </Link>
                            
                            {/* Only show these links when user is logged in */}
                            {user && (
                                <>
                                    <Link
                                        href="/feed"
                                        className={`inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                                            isActive('/feed')
                                                ? 'border-indigo-500 text-gray-900 font-semibold'
                                                : 'border-transparent text-gray-500 hover:border-indigo-200 hover:text-gray-700'
                                        }`}
                                    >
                                        Feed
                                    </Link>
                                    <Link
                                        href="/myrecipies"
                                        className={`inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                                            isActive('/myrecipies')
                                                ? 'border-indigo-500 text-gray-900 font-semibold'
                                                : 'border-transparent text-gray-500 hover:border-indigo-200 hover:text-gray-700'
                                        }`}
                                    >
                                        My Recipes
                                    </Link>
                                </>
                            )}
                            
                            {/* <Link
                                href="/mergerecipes"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                    isActive('/mergerecipes')
                                        ? 'border-indigo-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                Merge Recipes
                            </Link> */}
                            {/* {user && (
                                <Link
                                    href="/friends"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                        isActive('/friends')
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                >
                                    Friends
                                </Link>
                            )} */}
                        </div>
                    </div>
                    <div className="hidden md:flex md:items-center">
                        {user ? (
                            <div className="flex items-center">
                                {/* User actions dropdown */}
                                <div className="relative group">
                                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 focus:outline-none">
                                        <span className="hidden lg:inline mr-1 font-medium">{user.username}</span>
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className="h-5 w-5" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                                            />
                                        </svg>
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className="h-4 w-4 ml-1" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M19 9l-7 7-7-7" 
                                            />
                                        </svg>
                                    </button>
                                    
                                    {/* Dropdown menu */}
                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                                        <Link
                                            href="/friends"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            Friends
                                        </Link>
                                        <Link
                                            href="/settings"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Settings
                                        </Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                                
                                {/* User profile button only - Add Recipe button removed */}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 lg:space-x-4">
                                <Link
                                    href="/login"
                                    className="flex items-center gap-1 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all duration-200 hover:shadow"
                                >
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        className="h-5 w-5" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                                        />
                                    </svg>
                                    <span className="hidden lg:inline">Sign in</span>
                                </Link>
                                <Link
                                    href="/signup"
                                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:text-indigo-600"
                                >
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        className="h-5 w-5" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
                                        />
                                    </svg>
                                    <span className="hidden lg:inline">Sign up</span>
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMenuOpen ? (
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-100 shadow-inner">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link
                            href="/"
                            className={`flex items-center gap-2 pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                                isActive('/')
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-transparent text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-7-7v14" />
                            </svg>
                            Home
                        </Link>
                        
                        {/* Only show these links when user is logged in (mobile) */}
                        {user && (
                            <>
                                <Link
                                    href="/feed"
                                    className={`flex items-center gap-2 pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                                        isActive('/feed')
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                            : 'border-transparent text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    Feed
                                </Link>
                                <Link
                                    href="/myrecipies"
                                    className={`flex items-center gap-2 pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                                        isActive('/myrecipies')
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                            : 'border-transparent text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    My Recipes
                                </Link>
                            </>
                        )}
                    </div>
                    
                    <div className="pt-4 pb-3 border-t border-gray-200">
                        {user ? (
                            <div className="space-y-1">
                                <div className="block px-4 py-2 text-base font-medium text-indigo-600">
                                    Welcome, {user.username}
                                </div>
                                {/* Remove the Add Recipe link from mobile menu as well */}
                                <Link
                                    href="/friends"
                                    className="flex items-center gap-2 px-4 py-2 text-base font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Friends
                                </Link>
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-2 px-4 py-2 text-base font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Settings
                                </Link>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 px-4 py-2">
                                <Link
                                    href="/login"
                                    className="flex items-center justify-center gap-2 w-full text-center px-4 py-2 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="flex items-center justify-center gap-2 w-full text-center px-4 py-2 text-base font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}