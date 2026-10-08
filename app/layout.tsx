import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Sora } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

const title = 'PostForge · One idea, every platform';
const description = 'Turn a rough idea into ready-to-post copy for X, LinkedIn, Instagram and Threads, with threads, hashtags, a post linter and a content calendar.';

export const metadata: Metadata = {
  title,
  description,
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo.svg` },
  openGraph: { title, description, type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${mono.variable}`}>
      <body className="font-sans">
        {children}
        <Toaster position="bottom-center" toastOptions={{ style: { background: '#020617', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 500 } }} />
      </body>
    </html>
  );
}
