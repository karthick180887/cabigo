import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
    getServiceDistrictBySlug,
    getServiceSubdistrictBySlugs,
    getServiceSubdistrictsByDistrictSlug,
} from "@/lib/data/service-areas";
import { business } from "@/lib/data/business";
import styles from "./DistrictPage.module.css";

const FAQS = [
    {
        question: "Do you offer one way taxi from this area?",
        answer:
            "Yes. Cabigo offers one way and drop taxi pickups from all major towns and taluks in this area.",
    },
    {
        question: "How do I book a pickup?",
        answer:
            "Share your pickup point and drop location. We will confirm driver availability and fare instantly.",
    },
];

function buildKeywords(name: string, districtName: string) {
    return [
        `one way taxi ${name}`,
        `drop taxi ${name}`,
        `${name} taxi service`,
        `${name} to ${districtName} taxi`,
        `outstation cab ${name}`,
    ];
}

export function generateServiceAreaSubdistrictMetadata(
    districtSlug: string,
    subdistrictSlug: string
): Metadata {
    const subdistrict = getServiceSubdistrictBySlugs(districtSlug, subdistrictSlug);
    if (!subdistrict) return { title: "Location Not Found" };

    const title = `One Way & Drop Taxi in ${subdistrict.name}, ${subdistrict.districtName}`;
    const description = `Book one way drop taxi from ${subdistrict.name}, ${subdistrict.districtName} in ${subdistrict.stateName}. 24/7 pickups and verified drivers.`;

    return {
        title,
        description,
        keywords: buildKeywords(subdistrict.name, subdistrict.districtName),
        openGraph: {
            title,
            description,
            url: `https://cabigo.in/taxi-in-${subdistrict.districtSlug}/${subdistrict.slug}`,
            type: "website",
        },
        alternates: {
            canonical: `https://cabigo.in/taxi-in-${subdistrict.districtSlug}/${subdistrict.slug}`,
        },
    };
}

interface Props {
    districtSlug: string;
    subdistrictSlug: string;
}

export default function ServiceAreaSubdistrictPage({ districtSlug, subdistrictSlug }: Props) {
    const district = getServiceDistrictBySlug(districtSlug);
    const subdistrict = getServiceSubdistrictBySlugs(districtSlug, subdistrictSlug);

    if (!district || !subdistrict) notFound();

    const siblings = getServiceSubdistrictsByDistrictSlug(districtSlug).filter(
        (item) => item.slug !== subdistrict.slug
    );

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "TaxiService",
                name: `Cabigo ${subdistrict.name}`,
                description: `One way and drop taxi service in ${subdistrict.name}, ${district.name}.`,
                areaServed: {
                    "@type": "AdministrativeArea",
                    name: subdistrict.name,
                    containedInPlace: {
                        "@type": "AdministrativeArea",
                        name: district.name,
                        containedInPlace: {
                            "@type": "AdministrativeArea",
                            name: district.stateName,
                        },
                    },
                },
                url: `https://cabigo.in/taxi-in-${district.slug}/${subdistrict.slug}`,
                serviceType: "One Way Taxi, Drop Taxi",
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

            <section className={styles.hero}>
                <div className={styles.heroBackground}>
                    <div className={styles.heroGradient}></div>
                </div>
                <div className="container">
                    <nav className="breadcrumbs" aria-label="Breadcrumb">
                        <Link href="/">Home</Link> /{" "}
                        <Link href={`/taxi-in-${district.slug}`}>{district.name}</Link> /{" "}
                        <span>{subdistrict.name}</span>
                    </nav>

                    <h1 className={styles.heroTitle}>
                        One Way & Drop Taxi in {subdistrict.name}
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Serving {subdistrict.name} in {district.name}, {district.stateName}. Fast
                        pickups, transparent pricing, and verified drivers.
                    </p>

                    <div className={styles.heroActions}>
                        <Link href="/book" className="btn btn-primary">
                            Book Taxi in {subdistrict.name}
                        </Link>
                        <a href={`tel:${business.phoneHref}`} className="btn btn-secondary">
                            Call Now
                        </a>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className={styles.contentGrid}>
                        <div className={styles.mainContent}>
                            <div className={styles.contentBlock}>
                                <h2>Taxi Service Coverage</h2>
                                <p>
                                    Cabigo covers pickups from all major villages and towns around{" "}
                                    {subdistrict.name}. We provide one way drop taxi, round trip, and
                                    airport transfers from this area.
                                </p>
                            </div>

                            <div className={styles.contentBlock}>
                                <h2>Nearby Pickup Areas</h2>
                                <div className={styles.tagCloud}>
                                    {siblings.slice(0, 20).map((item) => (
                                        <Link
                                            key={item.slug}
                                            href={`/taxi-in-${district.slug}/${item.slug}`}
                                            className={styles.districtTag}
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.faqSection}>
                                <h2>Taxi FAQs - {subdistrict.name}</h2>
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
                                    {buildKeywords(subdistrict.name, district.name).map((keyword) => (
                                        <li key={keyword}>{keyword}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className={styles.linkCard}>
                                <h3>Back to District</h3>
                                <div className={styles.tagCloud}>
                                    <Link
                                        href={`/taxi-in-${district.slug}`}
                                        className={styles.districtTag}
                                    >
                                        {district.name} Taxi
                                    </Link>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </>
    );
}
