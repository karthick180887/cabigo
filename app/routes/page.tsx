import Link from "next/link";
import type { Metadata } from "next";
import { routes, getEnrichedRouteBySlug, type EnrichedRoute } from "@/lib/data/routes";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "All Taxi Routes in South India | One Way & Drop Taxi Pricing",
    description:
        "Browse Cabigo's verified taxi routes across Tamil Nadu and nearby states. See distance, duration, and one-way pricing for popular drop taxi routes.",
    keywords: [
        "one way taxi routes",
        "drop taxi routes",
        "chennai to bangalore taxi",
        "coimbatore to ooty taxi",
        "tamilnadu taxi distance chart",
        "inter city cab rates",
    ],
    alternates: {
        canonical: "https://cabigo.in/routes",
    },
};

const baseUrl = "https://cabigo.in";

export default function RoutesPage() {
    const enrichedRoutes = routes
        .map((route) => getEnrichedRouteBySlug(route.slug))
        .filter((route): route is EnrichedRoute => Boolean(route));

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Cabigo Taxi Routes",
        description: "Verified one-way and drop taxi routes across South India",
        itemListElement: enrichedRoutes.map((route, index) => {
            const originName = route.origin?.name || route.originId;
            const destName = route.destination?.name || route.destinationId;
            return {
                "@type": "ListItem",
                position: index + 1,
                item: {
                    "@type": "TaxiTrip",
                    name: `${originName} to ${destName} Taxi`,
                    url: `${baseUrl}/taxi-${route.slug}`,
                },
            };
        }),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className="container">
                    <nav className="breadcrumbs" aria-label="Breadcrumb">
                        <Link href="/">Home</Link>
                        <span>/</span>
                        <span aria-current="page">Routes</span>
                    </nav>
                    <h1 className={styles.heroTitle}>
                        Taxi Route <span className="text-gradient">Network</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Verified drop taxi routes with transparent pricing and duration.
                        {` ${enrichedRoutes.length}`} popular routes listed.
                    </p>
                </div>
            </section>

            {/* Routes Grid */}
            <section className="section">
                <div className="container">
                    <div className={`grid grid-2 ${styles.routesGrid}`}>
                        {enrichedRoutes.map((route) => {
                            const originName = route.origin?.name || route.originId;
                            const destName = route.destination?.name || route.destinationId;
                            return (
                                <Link
                                    key={route.id}
                                    href={`/taxi-${route.slug}`}
                                    className={styles.routeCard}
                                >
                                    <div className={styles.routeHeader}>
                                        <div className={styles.routePoints}>
                                            <span className={styles.origin}>{originName}</span>
                                            <div className={styles.routeLine}>
                                                <span className={styles.distance}>
                                                    {route.distance.km} km
                                                </span>
                                                <svg
                                                    width="100%"
                                                    height="2"
                                                    viewBox="0 0 100 2"
                                                    preserveAspectRatio="none"
                                                >
                                                    <line
                                                        x1="0"
                                                        y1="1"
                                                        x2="100"
                                                        y2="1"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeDasharray="4 2"
                                                    />
                                                </svg>
                                                <span className={styles.arrowIcon}>-&gt;</span>
                                            </div>
                                            <span className={styles.destination}>{destName}</span>
                                        </div>
                                    </div>

                                    <div className={styles.routeFooter}>
                                        <div className={styles.pricing}>
                                            <span className={styles.priceLabel}>One Way Fare</span>
                                            <span className={styles.priceValue}>
                                                INR {route.pricing.sedan.toLocaleString()}
                                            </span>
                                        </div>
                                        <span className={styles.cta}>Book Cab</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}
