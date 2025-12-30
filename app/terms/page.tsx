import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | Cabigo",
    description:
        "Read Cabigo's terms of service for one way taxi, drop taxi, and outstation cab bookings across South India.",
    alternates: {
        canonical: "https://cabigo.in/terms",
    },
};

export default function TermsPage() {
    return (
        <div className="container" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
            <nav className="breadcrumbs" style={{ marginBottom: "2rem" }}>
                <Link href="/">Home</Link> / <span>Terms of Service</span>
            </nav>

            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", marginBottom: "1rem" }}>
                Terms of <span className="text-gradient">Service</span>
            </h1>
            <p style={{ maxWidth: "720px", fontSize: "1.05rem", color: "var(--color-text-secondary)" }}>
                These terms outline Cabigo&apos;s booking policies, payment guidelines, and
                customer responsibilities. Please review before placing a booking request.
            </p>

            <div className="card" style={{ padding: "2rem", marginTop: "2.5rem" }}>
                <h2>Booking & Confirmation</h2>
                <p>
                    All bookings are subject to vehicle availability. A booking is confirmed only
                    after we share the driver and vehicle details with you.
                </p>

                <h2 style={{ marginTop: "1.5rem" }}>Pricing & Payments</h2>
                <p>
                    Fare estimates are based on route, vehicle type, and travel date. Toll charges
                    and permits are either included or disclosed during confirmation.
                </p>

                <h2 style={{ marginTop: "1.5rem" }}>Cancellations</h2>
                <p>
                    Cancellations may incur charges depending on the pickup time and route. Please
                    call support for the latest cancellation policy.
                </p>

                <h2 style={{ marginTop: "1.5rem" }}>Passenger Responsibilities</h2>
                <p>
                    Passengers are responsible for carrying valid ID proof and following local
                    travel regulations. Any penalties for violations are the passenger&apos;s
                    responsibility.
                </p>

                <p style={{ marginTop: "1.5rem", color: "var(--color-text-muted)" }}>
                    Last updated: {new Date().toLocaleDateString("en-GB")}
                </p>
            </div>
        </div>
    );
}
