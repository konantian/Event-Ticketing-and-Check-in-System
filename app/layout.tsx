// app/layout.tsx
import './styles/globals.css';
import { Analytics } from "@vercel/analytics/react"
import Header from './components/Header';
import Footer from './components/Footer';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Event Ticketing System',
  description: 'Simplified event management and check-in',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <Toaster position="top-right" richColors closeButton />
        <Header />
        <main>
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
