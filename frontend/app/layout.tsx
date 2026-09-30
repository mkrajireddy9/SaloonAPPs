import type { Metadata } from 'next';
import '../src/styles.css';

export const metadata: Metadata = { title: 'Halo Salon | Thoughtful hair consultations', description: 'Personalized hair consultations, salon appointments, and stylist-ready recommendations.', keywords: ['hair salon', 'hair consultation', 'salon appointments'] };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
