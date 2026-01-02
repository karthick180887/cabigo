import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cabigo.in"),
  title: {
    default: "Cabigo - One Way & Drop Taxi Service in South India",
    template: "%s | Cabigo South India",
  },
  description:
    "Book one-way and drop taxis across South India. Chennai, Coimbatore, Madurai, Bengaluru, Kochi, and Hyderabad. Lowest price guarantee for outstation & airport transfers.",
  keywords: [
    "one way taxi",
    "drop taxi",
    "one way cab chennai",
    "tamil nadu taxi",
    "kerala taxi",
    "karnataka taxi",
    "andhra pradesh taxi",
    "telangana taxi",
    "outstation cab booking",
    "airport taxi",
  ],
  authors: [{ name: "Cabigo" }],
  creator: "Cabigo",
  publisher: "Cabigo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://cabigo.in",
    siteName: "Cabigo - South India Taxi Service",
    title: "Cabigo - One Way & Drop Taxi in South India",
    description:
      "Book one-way drop taxis across South India. Chennai, Bengaluru, Kochi, Hyderabad, and more. Save up to 40% on return fare.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cabigo Tamil Nadu Taxi Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cabigo - Lowest Price Drop Taxi South India",
    description: "Book one-way cabs across South India. Pay only for one way.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "OW3EAF-Kff3gkd1i7m-So5XOez3czbRX1DRsD0GTYr8",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f3d2b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://cabigo.in" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${plexSans.variable} ${plexSerif.variable}`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
