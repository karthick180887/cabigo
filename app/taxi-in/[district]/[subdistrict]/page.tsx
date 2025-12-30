import { serviceAreas } from "@/lib/data/service-areas";
import ServiceAreaSubdistrictPage, {
    generateServiceAreaSubdistrictMetadata,
} from "@/components/ServiceAreaSubdistrictPage";

interface PageProps {
    params: Promise<{ district: string; subdistrict: string }>;
}

export async function generateStaticParams() {
    return serviceAreas.subdistricts.map((subdistrict) => ({
        district: subdistrict.districtSlug,
        subdistrict: subdistrict.slug,
    }));
}

export async function generateMetadata({ params }: PageProps) {
    const { district, subdistrict } = await params;
    return generateServiceAreaSubdistrictMetadata(district, subdistrict);
}

export default async function Page({ params }: PageProps) {
    const { district, subdistrict } = await params;
    return (
        <ServiceAreaSubdistrictPage districtSlug={district} subdistrictSlug={subdistrict} />
    );
}
