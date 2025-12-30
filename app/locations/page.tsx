import Link from "next/link";
import type { Metadata } from "next";
import { districts } from "@/lib/data/districts";
import { serviceAreas, getServiceDistrictsByStateSlug } from "@/lib/data/service-areas";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Taxi Services in South India Districts | One Way & Drop Taxi",
    description:
        "Find reliable one-way and drop taxi services across major districts in Tamil Nadu and nearby states. Chennai, Coimbatore, Madurai, Trichy, Salem, Vellore, and Puducherry coverage.",
    keywords: [
        "one way taxi",
        "drop taxi",
        "taxi tamilnadu",
        "chennai call taxi",
        "coimbatore cabs",
        "madurai taxi service",
        "tn district taxi",
    ],
    alternates: {
        canonical: "https://cabigo.in/locations",
    },
};

const STATE_LABELS: Record<string, string> = {
    bangalore: "Karnataka",
    tirupati: "Andhra Pradesh",
    pondicherry: "Puducherry",
};

const getStateLabel = (slug: string) => STATE_LABELS[slug] ?? "Tamil Nadu";

export default function LocationsPage() {
    const allServiceDistricts = serviceAreas.districts;
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Cabigo Service Areas",
        description: "Districts in South India where Cabigo offers taxi services",
        itemListElement: allServiceDistricts.map((district, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
                "@type": "City",
                name: district.name,
                url: `https://cabigo.in/taxi-in-${district.slug}`,
            },
        })),
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
                        <span aria-current="page">Locations</span>
                    </nav>
                    <h1 className={styles.heroTitle}>
                        Taxi Services in <span className="text-gradient">South India</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        One-way and drop taxi coverage across Tamil Nadu and nearby states.
                        Book reliable cabs for city pickups, outstation drops, and airport
                        transfers.
                    </p>
                </div>
            </section>

            {/* Locations Grid */}
            <section className="section">
                <div className="container">
                    <div className={`grid grid-3 ${styles.locationsGrid}`}>
                        {districts.map((district) => (
                            <Link
                                key={district.id}
                                href={`/taxi-in-${district.slug}`}
                                className={styles.locationCard}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardGradient}></div>
                                    <span className={styles.stateBadge}>
                                        {getStateLabel(district.slug)}
                                    </span>
                                </div>
                                <div className={styles.cardContent}>
                                    <h2 className={styles.cityName}>Taxi in {district.name}</h2>
                                    <p className={styles.cityDescription}>
                                        {district.metaDescription.substring(0, 100)}...
                                    </p>
                                    <div className={styles.cityMeta}>
                                        <span className={styles.landmark}>
                                            📍 Local & Outstation
                                        </span>
                                    </div>
                                    <div className={styles.services}>
                                        <span>Airport Pickup</span>
                                        <span>Temple Tours</span>
                                        <span>Drop Taxi</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* State Coverage */}
            <section className={`section ${styles.stateSection}`}>
                <div className="container">
                    <div className="section-header">
                        <h2>Service Areas by State</h2>
                        <p>All districts covered across South India</p>
                    </div>
                    <div className={`grid grid-2 ${styles.stateGrid}`}>
                        {serviceAreas.states.map((state) => {
                            const stateDistricts = getServiceDistrictsByStateSlug(state.slug);
                            return (
                                <div key={state.slug} className={styles.stateCard}>
                                    <h3 className={styles.stateTitle}>{state.name}</h3>
                                    <div className={styles.stateTags}>
                                        {stateDistricts.map((district) => (
                                            <Link
                                                key={district.slug}
                                                href={`/taxi-in-${district.slug}`}
                                                className={styles.stateTag}
                                            >
                                                {district.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Why Section */}
            <section className={`section ${styles.whySection}`}>
                <div className="container">
                    <div className="section-header">
                        <h2>Why Book with Cabigo TN?</h2>
                        <p>Trusted by locals and tourists alike</p>
                    </div>
                    <div className={`grid grid-4 ${styles.featuresGrid}`}>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🕉️</span>
                            <h3>Temple Expertise</h3>
                            <p>Drivers know darshan timings and dress codes</p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🛣️</span>
                            <h3>ECR Specialists</h3>
                            <p>Safe driving on East Coast Road scenic route</p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>⛰️</span>
                            <h3>Hill Driving</h3>
                            <p>Experts for Ooty, Kodaikanal, Yercaud hairpin bends</p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🗣️</span>
                            <h3>Language Support</h3>
                            <p>Drivers speak Tamil & English for easier communication</p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
