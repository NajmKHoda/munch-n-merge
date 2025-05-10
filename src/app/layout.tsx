import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { UserProvider } from '@/lib/context/UserContext';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: "Munch-N-Merge",
    description: "A platform for experimenting with food and recipes",
};

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <UserProvider>
                    <Navbar />
                    {children}
                </UserProvider>
            </body>
        </html>
    );
}
