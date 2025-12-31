import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { loginAdmin } from "../actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string }>;
}) {
    const session = await getAdminSession();
    if (session) {
        redirect("/admin");
    }

    const params = await searchParams;
    let message = "";
    if (params?.error === "invalid") {
        message = "Invalid username or password.";
    } else if (params?.error === "missing-config") {
        message = "Admin credentials are not configured yet.";
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <p className={styles.kicker}>Cabigo Admin</p>
                <h1 className={styles.title}>Sign in</h1>
                <p className={styles.subtitle}>
                    Use your admin username and password to manage leads.
                </p>

                {message ? <div className={styles.alert}>{message}</div> : null}

                <form className={styles.form} action={loginAdmin}>
                    <label className={styles.label}>
                        Username
                        <input
                            name="username"
                            type="text"
                            className={styles.input}
                            autoComplete="username"
                            required
                        />
                    </label>
                    <label className={styles.label}>
                        Password
                        <input
                            name="password"
                            type="password"
                            className={styles.input}
                            autoComplete="current-password"
                            required
                        />
                    </label>
                    <div className={styles.actions}>
                        <button type="submit" className={styles.submit}>
                            Sign in
                        </button>
                        <a href="/" className={styles.homeButton}>
                            Home
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
