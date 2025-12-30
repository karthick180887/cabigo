import { MetadataRoute } from "next";
import { districts } from "@/lib/data/districts";
import { serviceAreas } from "@/lib/data/service-areas";
import { routes } from "@/lib/data/routes";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://cabigo.in";
    const currentDate = new Date();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: "weekly",
            priority: 1.0,
        },
        {
            url: `${baseUrl}/locations`,
            lastModified: currentDate,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/routes`,
            lastModified: currentDate,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/book`,
            lastModified: currentDate,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/one-way-taxi`,
            lastModified: currentDate,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/round-trip-taxi`,
            lastModified: currentDate,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/airport-taxi`,
            lastModified: currentDate,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: currentDate,
            changeFrequency: "monthly",
            priority: 0.6,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: currentDate,
            changeFrequency: "monthly",
            priority: 0.6,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: currentDate,
            changeFrequency: "weekly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/careers`,
            lastModified: currentDate,
            changeFrequency: "monthly",
            priority: 0.4,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: currentDate,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: currentDate,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/privacy/customer`,
            lastModified: currentDate,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/privacy/driver`,
            lastModified: currentDate,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/privacy/vendor`,
            lastModified: currentDate,
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];

    const richDistrictSlugs = new Set(districts.map((district) => district.slug));
    const allDistricts = [
        ...districts,
        ...serviceAreas.districts.filter((district) => !richDistrictSlugs.has(district.slug)),
    ];

    // District pages
    const districtPages: MetadataRoute.Sitemap = allDistricts.map((district) => ({
        url: `${baseUrl}/taxi-in-${district.slug}`,
        lastModified: currentDate,
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    const oneWayDistrictPages: MetadataRoute.Sitemap = allDistricts.map((district) => ({
        url: `${baseUrl}/one-way-taxi-in-${district.slug}`,
        lastModified: currentDate,
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    const subdistrictPages: MetadataRoute.Sitemap = serviceAreas.subdistricts.map((subdistrict) => ({
        url: `${baseUrl}/taxi-in-${subdistrict.districtSlug}/${subdistrict.slug}`,
        lastModified: currentDate,
        changeFrequency: "weekly" as const,
        priority: 0.6,
    }));

    // Dynamic route pages
    const routePages: MetadataRoute.Sitemap = routes.map((route) => ({
        url: `${baseUrl}/taxi-${route.slug}`,
        lastModified: currentDate,
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [
        ...staticPages,
        ...districtPages,
        ...oneWayDistrictPages,
        ...subdistrictPages,
        ...routePages,
    ];
}
