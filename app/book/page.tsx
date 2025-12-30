import Link from "next/link";
import type { Metadata } from "next";
import { business } from "@/lib/data/business";
import BookingAutocomplete from "@/components/BookingAutocomplete";
import { createBooking } from "@/app/actions/bookings";

export const metadata: Metadata = {
    title: "Book a Taxi | Cabigo",
    description:
        "Request a one way or drop taxi booking with Cabigo. Share pickup, drop, and travel time to get a fast confirmation.",
    alternates: {
        canonical: "https://cabigo.in/book",
    },
};

type BookPageProps = {
    searchParams?: {
        [key: string]: string | string[] | undefined;
    };
};

export default function BookPage({ searchParams }: BookPageProps) {
    const status = typeof searchParams?.status === "string" ? searchParams.status : "";
    const submitted =
        typeof searchParams?.submitted === "string" ? searchParams.submitted : "";
    const showSuccess = submitted === "1";
    const showMissing = status === "missing";
    const showError = status === "error";
    const showMissingConfig = status === "missing-config";
    const showUnauthorized = status === "unauthorized";
    const showForbidden = status === "forbidden";
    const showMissingTable = status === "missing-table";

    return (
        <div className="container" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
            <nav className="breadcrumbs" style={{ marginBottom: "2rem" }}>
                <Link href="/">Home</Link> / <span>Book</span>
            </nav>

            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", marginBottom: "1rem" }}>
                Book a <span className="text-gradient">Taxi</span>
            </h1>
            <p style={{ maxWidth: "720px", fontSize: "1.1rem", color: "var(--color-text-secondary)" }}>
                Share your trip details and we will confirm the best available cab. For instant
                bookings, call us on {business.phoneDisplay}.
            </p>
            {showSuccess && (
                <div
                    className="card"
                    role="status"
                    style={{
                        marginTop: "2rem",
                        padding: "1.25rem 1.5rem",
                        borderColor: "rgba(16, 185, 129, 0.4)",
                        background: "rgba(16, 185, 129, 0.08)",
                    }}
                >
                    <strong>Request received.</strong> Our team will call you shortly to confirm
                    your booking.
                </div>
            )}
            {showMissing && (
                <div
                    className="card"
                    role="alert"
                    style={{
                        marginTop: "2rem",
                        padding: "1.25rem 1.5rem",
                        borderColor: "rgba(245, 158, 11, 0.45)",
                        background: "rgba(245, 158, 11, 0.08)",
                    }}
                >
                    Please share pickup, drop, and contact number so we can confirm your request.
                </div>
            )}
            {showError && (
                <div
                    className="card"
                    role="alert"
                    style={{
                        marginTop: "2rem",
                        padding: "1.25rem 1.5rem",
                        borderColor: "rgba(239, 68, 68, 0.45)",
                        background: "rgba(239, 68, 68, 0.08)",
                    }}
                >
                    Something went wrong while saving your request. Please try again or call us.
                </div>
            )}
            {showMissingConfig && (
                <div
                    className="card"
                    role="alert"
                    style={{
                        marginTop: "2rem",
                        padding: "1.25rem 1.5rem",
                        borderColor: "rgba(245, 158, 11, 0.45)",
                        background: "rgba(245, 158, 11, 0.08)",
                    }}
                >
                    Supabase configuration is missing in the server environment. Set
                    SUPABASE_URL and SUPABASE_ANON_KEY, then restart the server.
                </div>
            )}
            {showUnauthorized && (
                <div
                    className="card"
                    role="alert"
                    style={{
                        marginTop: "2rem",
                        padding: "1.25rem 1.5rem",
                        borderColor: "rgba(245, 158, 11, 0.45)",
                        background: "rgba(245, 158, 11, 0.08)",
                    }}
                >
                    Supabase rejected the API key. Please confirm you are using a valid
                    publishable/anon key for this project.
                </div>
            )}
            {showForbidden && (
                <div
                    className="card"
                    role="alert"
                    style={{
                        marginTop: "2rem",
                        padding: "1.25rem 1.5rem",
                        borderColor: "rgba(245, 158, 11, 0.45)",
                        background: "rgba(245, 158, 11, 0.08)",
                    }}
                >
                    Supabase blocked the insert due to permissions or RLS policies. Check the
                    booking_requests table policies or use the service role key on the server.
                </div>
            )}
            {showMissingTable && (
                <div
                    className="card"
                    role="alert"
                    style={{
                        marginTop: "2rem",
                        padding: "1.25rem 1.5rem",
                        borderColor: "rgba(245, 158, 11, 0.45)",
                        background: "rgba(245, 158, 11, 0.08)",
                    }}
                >
                    The booking_requests table is missing in Supabase. Create it using the SQL in
                    supabase/booking-requests.sql.
                </div>
            )}

            <div className="grid grid-2" style={{ gap: "2rem", marginTop: "3rem" }}>
                <form
                    className="card"
                    style={{ padding: "2.5rem" }}
                    action={createBooking}
                    method="post"
                >
                    <h2 style={{ marginBottom: "1.5rem" }}>Trip Details</h2>
                    <div style={{ display: "grid", gap: "1rem" }}>
                        <input type="hidden" name="source" value="book" />
                        <div>
                            <label htmlFor="book-pickup">Pickup Location</label>
                            <input
                                id="book-pickup"
                                name="pickup"
                                type="text"
                                placeholder="Chennai, Coimbatore..."
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="book-drop">Drop Location</label>
                            <input
                                id="book-drop"
                                name="drop"
                                type="text"
                                placeholder="Bengaluru, Kochi..."
                                required
                            />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label htmlFor="book-date">Pickup Date</label>
                                <input id="book-date" name="date" type="date" required />
                            </div>
                            <div>
                                <label htmlFor="book-time">Pickup Time</label>
                                <input id="book-time" name="time" type="time" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="book-trip-type">Trip Type</label>
                            <select id="book-trip-type" name="tripType">
                                <option value="one-way">One Way Drop</option>
                                <option value="round-trip">Round Trip</option>
                                <option value="airport">Airport Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="book-phone">Contact Number</label>
                            <input
                                id="book-phone"
                                name="phone"
                                type="tel"
                                placeholder={business.phoneDisplay}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">
                            Request Quote
                        </button>
                    </div>
                    <BookingAutocomplete pickupId="book-pickup" dropId="book-drop" />
                </form>

                <div className="card card-glass" style={{ padding: "2.5rem" }}>
                    <h2 style={{ marginBottom: "1.5rem" }}>Why Book with Cabigo</h2>
                    <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "1rem" }}>
                        <li>Verified drivers and clean AC vehicles</li>
                        <li>Transparent pricing with upfront confirmation</li>
                        <li>One way and drop taxi specialists</li>
                        <li>24/7 support across South India</li>
                    </ul>
                    <div style={{ marginTop: "2rem" }}>
                        <a href={`tel:${business.phoneHref}`} className="btn btn-secondary">
                            Call Now: {business.phoneDisplay}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
