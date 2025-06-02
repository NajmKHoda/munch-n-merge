'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import { useUser } from '@/lib/context/UserContext';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const pathname = usePathname();
    const router = useRouter();
    const { user, refreshUser } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    
    const handleLogout = async () => {
        await logout();
        await refreshUser();
        window.location.href = '/';
    };

    const isActive = (path: string) => pathname === path;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex items-center">
                            {/* Icon next to logo */}
                            <img
                                src="/images/IconForWebsite.png"
                                alt="Site Icon"
                                className="h-8 w-8 sm:h-10 sm:w-10 mr-2 object-contain"
                                style={{ filter: 'invert(29%) sepia(91%) saturate(1817%) hue-rotate(221deg) brightness(93%) contrast(101%)' }}
                            />
                            <Link href="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors duration-200 flex items-center">
                                <span className="hidden sm:inline">Munch-N-Merge</span>
                                <span className="sm:hidden">M&M</span>
                            </Link>
                        </div>
                        {/* Add more space between logo/icon and nav links */}
                        <div className="hidden md:flex md:ml-16 md:space-x-4 lg:ml-10 lg:space-x-6">
                            {/* <Link
                                href="/"
                                className={`inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                                    isActive('/')
                                        ? 'border-indigo-500 text-gray-900 font-semibold'
                                        : 'border-transparent text-gray-500 hover:border-indigo-200 hover:text-gray-700'
                                }`}
                            >
                                Home
                            </Link> */}
                            
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
                                    <div className="relative self-center group">
                                        <button 
                                            className={`inline-flex content-center items-center px-2 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                                                isActive('/myrecipies')
                                                    ? 'border-indigo-500 text-gray-900 font-semibold'
                                                    : 'border-transparent text-gray-500 hover:border-indigo-200 hover:text-gray-700'
                                            }`}
                                        >
                                            My Recipes
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
                                        
                                        {/* My Recipes Dropdown menu */}
                                        <div className="absolute self-center left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                                            <Link
                                                href="/myrecipies"
                                                className="flex content-center items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                My Recipes
                                            </Link>
                                            <Link
                                                href="/favorites"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                                Favorites
                                            </Link>
                                        </div>
                                    </div>
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

                            {/* Replace Search Recipes dropdown with inline search bar */}
                            <div className="relative">
                                <form onSubmit={handleSearch} className="flex items-center">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-64 px-4 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                            placeholder="Search recipes..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 focus:outline-none"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex md:items-center">
                        {}
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
                        {/* <Link
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
                        </Link> */}
                        
                        {/* Add search bar in mobile menu */}
                        <div className="px-3 py-2">
                            <form onSubmit={(e) => {
                                handleSearch(e);
                                setIsMenuOpen(false);
                            }}>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                        placeholder="Search recipes..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 focus:outline-none"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                        
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
                                <div className="relative self-center group">
                                    <button 
                                        className={`flex items-center content-center gap-2 pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                                            isActive('/myrecipies')
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                : 'border-transparent text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600'
                                        }`}
                                    >
                                        My Recipes
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
                                    
                                    {/* My Recipes Dropdown menu */}
                                    <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                                        <Link
                                            href="/myrecipies"
                                            className="flex content-center items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            My Recipes
                                        </Link>
                                        <Link
                                            href="/favorites"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                            Favorites
                                        </Link>
                                    </div>
                                </div>
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