import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { SplashLoader } from '@/components/splash-loader';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata = {
  title: 'DIFX',
  description: 'Gestão financeira offline para motoristas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SplashLoader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
