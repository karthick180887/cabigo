import nodemailer from "nodemailer";

type EmailResult = {
    ok: boolean;
    error?: string;
};

function getEmailConfig() {
    const host = process.env.SMTP_HOST ?? "";
    const portRaw = process.env.SMTP_PORT ?? "";
    const secureRaw = process.env.SMTP_SECURE ?? "false";
    const user = process.env.SMTP_USER ?? "";
    const pass = process.env.SMTP_PASS ?? "";
    const from = process.env.REMINDER_EMAIL_FROM ?? user;

    const port = Number(portRaw);
    const secure = secureRaw === "true";

    if (!host || !port || !user || !pass || !from) {
        return null;
    }

    return { host, port, secure, user, pass, from };
}

export async function sendEmailReminder(
    to: string,
    subject: string,
    text: string
): Promise<EmailResult> {
    const config = getEmailConfig();
    if (!config) {
        return { ok: false, error: "missing-config" };
    }

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    try {
        await transporter.sendMail({
            from: config.from,
            to,
            subject,
            text,
        });
        return { ok: true };
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : "email-error",
        };
    }
}
