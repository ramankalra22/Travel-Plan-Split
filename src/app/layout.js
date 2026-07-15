import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  title: {
    default: 'Travel Itinerary Planner',
    template: '%s | Travel Planner',
  },
  description:
    'Plan your trips, manage itineraries, and split expenses with your travel group — all in one place.',
  keywords: ['travel', 'itinerary', 'expense splitting', 'trip planner', 'splitwise'],
  openGraph: {
    title: 'Travel Itinerary Planner',
    description: 'Plan trips and split expenses with your group.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-gray-950 text-gray-100 antialiased min-h-screen">
        <Providers>
          <Navbar />
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
