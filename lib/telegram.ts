"use server";

const TELEGRAM_BOT_TOKEN = "8389411471:AAHx84QNI4bKIynBELxVQVoWBZWQ3ZihVtg";
const TELEGRAM_CHAT_ID = "1516806261";

export async function sendTelegramNotification(message: string): Promise<boolean> {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "HTML",
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[Telegram] Failed to send message:", errorData);
            return false;
        }

        return true;
    } catch (error) {
        console.error("[Telegram] Error sending notification:", error);
        return false;
    }
}

export async function formatBookingMessage(booking: {
    pickup: string;
    drop: string;
    phone: string;
    tripType?: string | null;
    pickupDate?: string | null;
    pickupTime?: string | null;
    source?: string | null;
}): Promise<string> {
    const tripTypeLabel = booking.tripType
        ? booking.tripType.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Not specified";

    const dateTime = [booking.pickupDate, booking.pickupTime].filter(Boolean).join(" at ") || "Not specified";

    return `🚕 <b>New Cabigo Booking!</b>

📍 <b>Pickup:</b> ${booking.pickup}
📍 <b>Drop:</b> ${booking.drop}
📞 <b>Phone:</b> +91${booking.phone.replace(/^(\+91|91)/, '')}
🚗 <b>Trip Type:</b> ${tripTypeLabel}
📅 <b>Date/Time:</b> ${dateTime}
🌐 <b>Source:</b> ${booking.source || "Website"}

━━━━━━━━━━━━━━━━━━━━
<i>Received at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</i>`;
}
