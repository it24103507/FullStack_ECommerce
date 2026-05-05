import Constants from "expo-constants";

const DEFAULT_API_URL = "http://localhost:3000/api";

let cachedApiUrl: string | null = null;

function normalizeBaseUrl(url: string) {
    return url.replace(/\/$/, "");
}

function getHostCandidates() {
    const candidates: string[] = [];

    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl) {
        candidates.push(envUrl);
    }

    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const host = hostUri.split(":")[0];
        candidates.push(`http://${host}:3000/api`);
    }

    candidates.push(
        DEFAULT_API_URL,
        "http://127.0.0.1:3000/api",
        "http://10.0.2.2:3000/api"
    );

    return Array.from(new Set(candidates.map(normalizeBaseUrl)));
}

export function getApiBaseUrl() {
    return cachedApiUrl || getHostCandidates()[0];
}

export async function resolveApiBaseUrl() {
    if (cachedApiUrl) {
        return cachedApiUrl;
    }

    for (const candidate of getHostCandidates()) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);
            const response = await fetch(`${candidate}/health`, {
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (response.ok) {
                cachedApiUrl = candidate;
                return candidate;
            }
        } catch {
            continue;
        }
    }

    cachedApiUrl = getHostCandidates()[0];
    return cachedApiUrl;
}
