import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { vehicles } from "@/lib/data/vehicles";
import { business } from "@/lib/data/business";
import {
    getServiceDistrictBySlug,
    getServiceDistrictsByStateSlug,
    getServiceSubdistrictsByDistrictSlug,
} from "@/lib/data/service-areas";
import styles from "./DistrictPage.module.css";

type PageMode = "standard" | "one-way";

const HUBS_BY_STATE: Record<string, string[]> = {
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy"],
    Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode"],
    Karnataka: ["Bengaluru", "Mysuru", "Mangaluru"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Tirupati"],
    Telangana: ["Hyderabad", "Warangal", "Nizamabad"],
};

const FAQS = [
    {
        question: "Do you provide one way drop taxi from all taluks?",
        answer:
            "Yes. We provide pickup and drop taxi coverage across taluks in the district. Share your pickup point and we will confirm availability instantly.",
    },
    {
        question: "Are tolls and driver charges included?",
        answer:
            "We provide all-inclusive quotes for one-way drops. Toll and driver charges are disclosed upfront during booking.",
    },
    {
        question: "Can I book late night or early morning trips?",
        answer:
            "Yes, Cabigo runs 24/7. Night or early morning trips are available with advance booking.",
    },
];

function buildKeywords(name: string, stateName: string) {
    const hubs = HUBS_BY_STATE[stateName] ?? ["Chennai", "Bengaluru"];
    return [
        `one way taxi ${name}`,
        `drop taxi ${name}`,
        `one way cab ${name}`,
        `${name} taxi service`,
        `${name} to ${hubs[0]} taxi`,
        `${name} to ${hubs[1] ?? hubs[0]} taxi`,
        `outstation cab ${name}`,
        `${stateName} one way taxi`,
    ];
}

export function generateServiceAreaDistrictMetadata(
    slug: string,
    mode: PageMode = "standard"
): Metadata {
    const district = getServiceDistrictBySlug(slug);
    if (!district) return { title: "Location Not Found" };

    const baseTitle =
        mode === "one-way"
            ? `One Way & Drop Taxi in ${district.name}, ${district.stateName}`
            : `Taxi Service in ${district.name}, ${district.stateName}`;

    const description =
        mode === "one-way"
            ? `Book one way drop taxi from ${district.name} in ${district.stateName}. Fast pickups, verified drivers, and transparent pricing across the district.`
            : `Cabigo taxi service in ${district.name}, ${district.stateName}. One way drops, round trips, and airport transfers across all taluks.`;

    const path =
        mode === "one-way"
            ? `/one-way-taxi-in-${district.slug}`
            : `/taxi-in-${district.slug}`;

    return {
        title: baseTitle,
        description,
        keywords: buildKeywords(district.name, district.stateName),
        openGraph: {
            title: baseTitle,
            description,
            url: `https://cabigo.in${path}`,
            type: "website",
        },
        alternates: {
            canonical: `https://cabigo.in${path}`,
        },
    };
}

interface Props {
    slug: string;
    mode?: PageMode;
}

export default function ServiceAreaDistrictPage({ slug, mode = "standard" }: Props) {
    const district = getServiceDistrictBySlug(slug);
    if (!district) notFound();

    const subdistricts = getServiceSubdistrictsByDistrictSlug(slug);
    const nearbyDistricts = getServiceDistrictsByStateSlug(district.stateSlug).filter(
        (item) => item.slug !== district.slug
    );

    const pickupAreas = subdistricts.slice(0, 16);
    const hubs = HUBS_BY_STATE[district.stateName] ?? ["Chennai", "Bengaluru"];

    const path =
        mode === "one-way"
            ? `/one-way-taxi-in-${district.slug}`
            : `/taxi-in-${district.slug}`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "TaxiService",
                name: `Cabigo ${district.name}`,
                description: `One way and drop taxi service in ${district.name}, ${district.stateName}.`,
                areaServed: {
                    "@type": "AdministrativeArea",
                    name: district.name,
                    containedInPlace: {
                        "@type": "AdministrativeArea",
                        name: district.stateName,
                    },
                },
                url: `https://cabigo.in${path}`,
                serviceType: "One Way Taxi, Drop Taxi, Outstation Cab",
                priceRange: "INR 12/km - INR 25/km",
                telephone: business.phone,
            },
            {
                "@type": "FAQPage",
                mainEntity: FAQS.map((faq) => ({
                    "@type": "Question",
                    name: faq.question,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: faq.answer,
                    },
                })),
            },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBackground}>
                    <div className={styles.heroGradient}></div>
                </div>
                <div className="container">
                    <nav className="breadcrumbs" aria-label="Breadcrumb">
                        <Link href="/">Home</Link> / <Link href="/locations">Locations</Link> /{" "}
                        <span>{district.name}</span>
                    </nav>

                    <h1 className={styles.heroTitle}>
                        {mode === "one-way" ? "One Way & Drop Taxi in " : "Taxi Service in "}
                        {district.name}
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Serving {district.name}, {district.stateName}. Pickups available across{" "}
                        {subdistricts.length} taluks and towns with 24/7 support.
                    </p>

                    <div className={styles.heroActions}>
                        <Link href="/book" className="btn btn-primary">
                            Book Taxi in {district.name}
                        </Link>
                        <a href={`tel:${business.phoneHref}`} className="btn btn-secondary">
                            Call Now
                        </a>
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <section className="section">
                <div className="container">
                    <div className={styles.contentGrid}>
                        <div className={styles.mainContent}>
                            <div className={styles.contentBlock}>
                                <h2>Pickup Areas in {district.name}</h2>
                                <p>
                                    We provide one way and drop taxi coverage across all taluks in{" "}
                                    {district.name}. Popular pickup areas include:
                                </p>
                                <div className={styles.tagCloud}>
                                    {pickupAreas.map((area) => (
                                        <Link
                                            key={area.slug}
                                            href={`/taxi-in-${district.slug}/${area.slug}`}
                                            className={styles.districtTag}
                                        >
                                            {area.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.contentBlock}>
                                <h2>Popular One Way Routes</h2>
                                <p>
                                    Book direct drops from {district.name} to major hubs across South
                                    India. Choose your pickup point and travel with verified drivers.
                                </p>
                                <div className={`grid grid-2 ${styles.touristGrid}`}>
                                    {hubs.map((hub) => (
                                        <div key={hub} className={styles.touristCard}>
                                            <span className={styles.placeType}>Route</span>
                                            <h3>
                                                {district.name} to {hub}
                                            </h3>
                                            <p className={styles.placeDist}>One way drop taxi</p>
                                            <p className={styles.placeBest}>
                                                Airport, business, and outstation travel
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.vehicleSection}>
                                <h2>Available Cab Types</h2>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.vehicleTable}>
                                        <thead>
                                            <tr>
                                                <th>Vehicle Type</th>
                                                <th>One Way Rate (INR/km)</th>
                                                <th>Capacity</th>
                                                <th>Luggage</th>
                                                <th>Ideal For</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vehicles.map((vehicle) => (
                                                <tr key={vehicle.id}>
                                                    <td>
                                                        <strong>{vehicle.name}</strong>
                                                        <br />
                                                        <span className={styles.fuelTag}>
                                                            {vehicle.fuelType}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {vehicle.oneWayRatePerKm
                                                            ? `INR ${vehicle.oneWayRatePerKm}/km`
                                                            : "Ask for Quote"}
                                                        {vehicle.driverBeta ? (
                                                            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                                                                Driver bata INR {vehicle.driverBeta}
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                    <td>{vehicle.capacity}</td>
                                                    <td>{vehicle.luggage}</td>
                                                    <td>{vehicle.idealFor.slice(0, 2).join(", ")}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className={styles.faqSection}>
                                <h2>Taxi FAQs - {district.name}</h2>
                                <div className={styles.faqList}>
                                    {FAQS.map((faq) => (
                                        <details key={faq.question} className={styles.faqItem}>
                                            <summary>{faq.question}</summary>
                                            <p>{faq.answer}</p>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <aside className={styles.sidebar}>
                            <div className={styles.stickyCard}>
                                <h3>Top Search Keywords</h3>
                                <ul className={styles.keywordList}>
                                    {buildKeywords(district.name, district.stateName)
                                        .slice(0, 6)
                                        .map((keyword) => (
                                            <li key={keyword}>{keyword}</li>
                                        ))}
                                </ul>
                            </div>

                            <div className={styles.linkCard}>
                                <h3>Nearby Districts</h3>
                                <div className={styles.tagCloud}>
                                    {nearbyDistricts.slice(0, 12).map((item) => (
                                        <Link
                                            key={item.slug}
                                            href={`/taxi-in-${item.slug}`}
                                            className={styles.districtTag}
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </>
    );
}
