import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ConfirmProvider } from "@/components/confirm-dialog";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { clubName } = await getSettings();
  return { title: { default: clubName, template: `%s · ${clubName}` } };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Roda antes da pintura: escolhe o tema claro/escuro (preferência salva ou do sistema).
// data-theme é controlado só por este script; o React apenas informa os temas em data-light/data-dark.
const themeScript = `(function(){try{var d=document.documentElement;function apply(){var m=localStorage.getItem('volei-theme');var dark=m?m==='dark':matchMedia('(prefers-color-scheme: dark)').matches;d.setAttribute('data-theme',dark?d.dataset.dark:d.dataset.light);d.dataset.mode=dark?'dark':'light';}apply();window.__applyTheme=apply;matchMedia('(prefers-color-scheme: dark)').addEventListener('change',apply);new MutationObserver(apply).observe(d,{attributes:true,attributeFilter:['data-light','data-dark']});}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { lightTheme, darkTheme } = await getSettings();
  return (
    <html
      lang="pt-BR"
      data-light={lightTheme}
      data-dark={darkTheme}
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-base-200">
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
