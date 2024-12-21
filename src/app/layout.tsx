import React, { JSX } from 'react';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import ClientProvider from '@/components/ClientProvider';
import Header from '@/components/Header';
import Layout from '@/components/Layout';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Aditya',
    description: 'My Portfolio',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): JSX.Element {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ClientProvider>
                    <Layout>
                        <Layout.Header>
                            <Header />
                        </Layout.Header>
                        {/* <Layout.Sidebar>
                            <div>My Sidebar</div>
                        </Layout.Sidebar> */}
                        <Layout.Main>{children}</Layout.Main>
                        <Layout.Footer>
                            <div>© 2021 Aditya</div>
                        </Layout.Footer>
                    </Layout>
                </ClientProvider>
            </body>
        </html>
    );
}
