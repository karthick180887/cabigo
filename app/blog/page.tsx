import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Travel Tips & Taxi Guides | Cabigo Blog",
    description:
        "Travel tips, route guides, and taxi booking advice for South India. Learn the best times to travel, route highlights, and booking tips.",
    alternates: {
        canonical: "https://cabigo.in/blog",
    },
};

const highlights = [
    {
        title: "Best Time for Hill Station Trips",
        description: "Plan Ooty, Kodaikanal, and Munnar drops with weather-friendly windows.",
        href: "/routes",
    },
    {
        title: "Airport Transfer Checklist",
        description: "What to keep ready for on-time pickups from Chennai, Bengaluru, and Kochi.",
        href: "/airport-taxi",
    },
    {
        title: "One Way vs Round Trip Pricing",
        description: "Compare drop taxi savings with round trip packages before you book.",
        href: "/one-way-taxi",
    },
];

export default function BlogPage() {
    return (
        <div className="container" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
            <nav className="breadcrumbs" style={{ marginBottom: "2rem" }}>
                <Link href="/">Home</Link> / <span>Blog</span>
            </nav>

            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", marginBottom: "1rem" }}>
                Travel <span className="text-gradient">Guides</span>
            </h1>
            <p style={{ maxWidth: "720px", fontSize: "1.1rem", color: "var(--color-text-secondary)" }}>
                Insights on routes, pricing, and travel planning across South India. Explore our
                latest guides and booking tips.
            </p>

            <div className="grid grid-3" style={{ gap: "2rem", marginTop: "3rem" }}>
                {highlights.map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                        className="card"
                        style={{ padding: "2rem", textDecoration: "none" }}
                    >
                        <h2 style={{ marginBottom: "0.75rem" }}>{item.title}</h2>
                        <p style={{ color: "var(--color-text-secondary)" }}>{item.description}</p>
                    </Link>
                ))}
            </div>

            <div style={{ marginTop: "3rem" }}>
                <h2 style={{ marginBottom: "1rem" }}>Popular Routes & Destinations</h2>
                <div className="grid grid-4" style={{ gap: "1rem" }}>
                    <Link href="/routes" className="card" style={{ textAlign: "center" }}>
                        One Way Routes
                    </Link>
                    <Link href="/locations" className="card" style={{ textAlign: "center" }}>
                        District Coverage
                    </Link>
                    <Link href="/airport-taxi" className="card" style={{ textAlign: "center" }}>
                        Airport Transfers
                    </Link>
                    <Link href="/round-trip-taxi" className="card" style={{ textAlign: "center" }}>
                        Round Trip Packages
                    </Link>
                </div>
            </div>
        </div>
    );
}
