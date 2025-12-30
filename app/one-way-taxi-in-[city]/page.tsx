
import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";
import ServiceAreaDistrictPage, {
    generateServiceAreaDistrictMetadata,
} from "@/components/ServiceAreaDistrictPage";
import { districts, getDistrictBySlug } from "@/lib/data/districts";
import { serviceAreas } from "@/lib/data/service-areas";

export async function generateStaticParams() {
    const allSlugs = new Set<string>();
    districts.forEach((district) => allSlugs.add(district.slug));
    serviceAreas.districts.forEach((district) => allSlugs.add(district.slug));
    return Array.from(allSlugs).map((slug) => ({
        city: slug,
    }));
}

export async function generateMetadata(props: { params: Promise<{ city: string }> }) {
    const params = await props.params;
    const district = getDistrictBySlug(params.city);
    if (!district) {
        return generateServiceAreaDistrictMetadata(params.city, "one-way");
    }
    return generateOneWayDistrictMetadata(params.city);
}

export default async function Page(props: { params: Promise<{ city: string }> }) {
    const params = await props.params;
    const district = getDistrictBySlug(params.city);
    if (!district) {
        return <ServiceAreaDistrictPage slug={params.city} mode="one-way" />;
    }
    return <OneWayDistrictPage slug={params.city} />;
}
