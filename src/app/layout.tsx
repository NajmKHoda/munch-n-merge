import type { Metadata } from "next";
import "./globals.css";

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
            <body>{children}</body>
        </html>
    );
}
