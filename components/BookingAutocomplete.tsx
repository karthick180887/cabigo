"use client";

import { useEffect } from "react";

let googleMapsPromise: Promise<void> | null = null;
let mapsKeyPromise: Promise<string> | null = null;

declare global {
    interface Window {
        google?: any;
    }
}

function loadGoogleMaps(apiKey: string) {
    if (googleMapsPromise) return googleMapsPromise;

    googleMapsPromise = new Promise((resolve, reject) => {
        if (window.google?.maps?.places) {
            resolve();
            return;
        }

        const scriptId = "google-maps-places";
        const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => {
                googleMapsPromise = null;
                reject(new Error("Google Maps failed to load"));
            });
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=en&region=IN`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => {
            googleMapsPromise = null;
            reject(new Error("Google Maps failed to load"));
        };
        document.head.appendChild(script);
    });

    return googleMapsPromise;
}

function applyDistrictValue(
    autocomplete: any,
    input: HTMLInputElement,
    fallbackValue?: string
) {
    const place = autocomplete.getPlace();
    const components: Array<{ long_name: string; types: string[] }> =
        place?.address_components ?? [];

    const district =
        components.find((component) => component.types.includes("administrative_area_level_2"))
            ?.long_name ?? "";
    const city =
        components.find((component) => component.types.includes("locality"))?.long_name ?? "";
    const state =
        components.find((component) => component.types.includes("administrative_area_level_1"))
            ?.long_name ?? "";

    const value = district || city || place?.name || fallbackValue || "";
    const suffix = state ? `, ${state}` : "";
    if (value) {
        input.value = `${value}${suffix}`;
    }
}

interface BookingAutocompleteProps {
    pickupId: string;
    dropId: string;
    apiKey?: string;
}

async function fetchGoogleMapsKey() {
    if (mapsKeyPromise) return mapsKeyPromise;

    mapsKeyPromise = fetch("/api/public-config", { cache: "no-store" })
        .then(async (response) => {
            if (!response.ok) return "";
            const data = (await response.json()) as { googleMapsKey?: string };
            return data.googleMapsKey?.trim() ?? "";
        })
        .catch(() => "")
        .finally(() => {
            mapsKeyPromise = null;
        });

    return mapsKeyPromise;
}

export default function BookingAutocomplete({
    pickupId,
    dropId,
    apiKey,
}: BookingAutocompleteProps) {
    useEffect(() => {
        let cancelled = false;

        const setupAutocomplete = async (resolvedKey: string) => {
            try {
                await loadGoogleMaps(resolvedKey);
                if (cancelled) return;

                const pickupInput = document.getElementById(pickupId) as HTMLInputElement | null;
                const dropInput = document.getElementById(dropId) as HTMLInputElement | null;

                if (!pickupInput || !dropInput) return;
                if (!window.google?.maps) {
                    console.warn("[BookingAutocomplete] Google Maps not available.");
                    return;
                }

                if (!window.google.maps.places?.Autocomplete && window.google.maps.importLibrary) {
                    await window.google.maps.importLibrary("places");
                }

                if (!window.google.maps.places?.Autocomplete) {
                    console.warn("[BookingAutocomplete] Places library not available.");
                    return;
                }

                const options = {
                    componentRestrictions: { country: "in" },
                    types: ["(regions)"],
                    fields: ["address_components", "formatted_address", "name", "place_id", "types"],
                };

                const pickupAutocomplete = new window.google.maps.places.Autocomplete(
                    pickupInput,
                    options
                );
                const dropAutocomplete = new window.google.maps.places.Autocomplete(
                    dropInput,
                    options
                );

                pickupAutocomplete.addListener("place_changed", () => {
                    applyDistrictValue(pickupAutocomplete, pickupInput, pickupInput.value);
                });

                dropAutocomplete.addListener("place_changed", () => {
                    applyDistrictValue(dropAutocomplete, dropInput, dropInput.value);
                });
            } catch (error) {
                if (!cancelled) {
                    console.warn("[BookingAutocomplete] Google Maps failed to load.", error);
                }
            }
        };

        const initialKey = apiKey?.trim() || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (initialKey) {
            setupAutocomplete(initialKey);
        } else {
            fetchGoogleMapsKey().then((fetchedKey) => {
                if (cancelled) return;
                if (!fetchedKey) {
                    console.warn(
                        "[BookingAutocomplete] Missing Google Maps API key. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."
                    );
                    return;
                }
                setupAutocomplete(fetchedKey);
            });
        }

        return () => {
            cancelled = true;
        };
    }, [pickupId, dropId, apiKey]);

    return null;
}
