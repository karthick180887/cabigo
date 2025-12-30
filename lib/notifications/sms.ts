type SmsResult = {
    ok: boolean;
    error?: string;
};

function getSmsConfig() {
    const apiUrl = process.env.SMS_API_URL ?? "";
    const apiKey = process.env.SMS_API_KEY ?? "";

    if (!apiUrl || !apiKey) {
        return null;
    }

    return { apiUrl, apiKey };
}

export async function sendSmsReminder(to: string, message: string): Promise<SmsResult> {
    const config = getSmsConfig();
    if (!config) {
        return { ok: false, error: "missing-config" };
    }

    const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apiKey: config.apiKey,
        },
        body: JSON.stringify({
            to,
            message,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, error: errorText || "sms-error" };
    }

    return { ok: true };
}
