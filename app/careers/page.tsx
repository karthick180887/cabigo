import Link from "next/link";
import type { Metadata } from "next";
import { business } from "@/lib/data/business";

export const metadata: Metadata = {
    title: "Careers at Cabigo | Join Our Team",
    description:
        "Explore careers at Cabigo. We are hiring drivers, operations support, and customer service specialists across South India.",
    alternates: {
        canonical: "https://cabigo.in/careers",
    },
};

const roles = [
    {
        title: "Driver Partner",
        description: "Verified driver network for one way and drop taxi services.",
    },
    {
        title: "Customer Support",
        description: "24/7 support team to manage bookings and passenger queries.",
    },
    {
        title: "Operations Executive",
        description: "Coordinate fleets, permits, and on-ground travel logistics.",
    },
    {
        title: "Sales & Partnerships",
        description: "Corporate accounts and travel partnerships across South India.",
    },
];

export default function CareersPage() {
    return (
        <div className="container" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
            <nav className="breadcrumbs" style={{ marginBottom: "2rem" }}>
                <Link href="/">Home</Link> / <span>Careers</span>
            </nav>

            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", marginBottom: "1rem" }}>
                Join <span className="text-gradient">Cabigo</span>
            </h1>
            <p style={{ maxWidth: "720px", fontSize: "1.1rem", color: "var(--color-text-secondary)" }}>
                We are building South India&apos;s most reliable drop taxi network. If you love
                travel and service, we would love to hear from you.
            </p>

            <div className="grid grid-2" style={{ gap: "2rem", marginTop: "3rem" }}>
                {roles.map((role) => (
                    <div key={role.title} className="card" style={{ padding: "2rem" }}>
                        <h2 style={{ marginBottom: "0.75rem" }}>{role.title}</h2>
                        <p style={{ color: "var(--color-text-secondary)" }}>{role.description}</p>
                    </div>
                ))}
            </div>

            <div className="card card-glass" style={{ marginTop: "3rem", padding: "2rem" }}>
                <h2 style={{ marginBottom: "0.75rem" }}>Apply Now</h2>
                <p style={{ color: "var(--color-text-secondary)" }}>
                    Send your profile and location details to {business.email}. Our team will
                    respond within 48 hours.
                </p>
                <a href={`mailto:${business.email}`} className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
                    Email {business.email}
                </a>
            </div>
        </div>
    );
}
