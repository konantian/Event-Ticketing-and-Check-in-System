// app/layout.tsx
import './styles/globals.css';
import { Analytics } from "@vercel/analytics/react"

export const metadata = {
  title: 'Event Ticketing System',
  description: 'Simplified event management and check-in',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-100 text-gray-800">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
