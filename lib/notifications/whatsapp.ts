type WhatsAppTemplateParam = {
    type: "text";
    text: string;
};

type WhatsAppTemplatePayload = {
    messaging_product: "whatsapp";
    recipient_type: "individual";
    to: string;
    type: "template";
    template: {
        name: string;
        language: { code: string };
        components: Array<{
            type: "body";
            parameters: WhatsAppTemplateParam[];
        }>;
    };
};

function getWhatsAppConfig() {
    const apiUrl = process.env.WHATSAPP_API_URL ?? "";
    const apiToken = process.env.WHATSAPP_API_TOKEN ?? "";
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
    const templateName = process.env.WHATSAPP_TEMPLATE_REMINDER ?? "";

    if (!apiUrl || !apiToken || !phoneNumberId || !templateName) {
        return null;
    }

    return { apiUrl, apiToken, phoneNumberId, templateName };
}

export async function sendWhatsAppReminder(
    to: string,
    variables: WhatsAppTemplateParam[]
) {
    const config = getWhatsAppConfig();
    if (!config) {
        return { ok: false, error: "missing-config" };
    }

    const payload: WhatsAppTemplatePayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
            name: config.templateName,
            language: { code: "en" },
            components: [
                {
                    type: "body",
                    parameters: variables,
                },
            ],
        },
    };

    const response = await fetch(
        `${config.apiUrl}/v3/${config.phoneNumberId}/messages`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apiKey: config.apiToken,
            },
            body: JSON.stringify(payload),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, error: errorText || "whatsapp-error" };
    }

    return { ok: true };
}
