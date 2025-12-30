import serviceAreasJson from "./service-areas.json";

export interface ServiceAreaState {
    code: string;
    name: string;
    slug: string;
}

export interface ServiceAreaDistrict {
    code: string;
    stateCode: string;
    stateName: string;
    stateSlug: string;
    name: string;
    slug: string;
}

export interface ServiceAreaSubdistrict {
    code: string;
    districtCode: string;
    districtName: string;
    districtSlug: string;
    stateCode: string;
    stateName: string;
    stateSlug: string;
    name: string;
    slug: string;
}

export interface ServiceAreasData {
    states: ServiceAreaState[];
    districts: ServiceAreaDistrict[];
    subdistricts: ServiceAreaSubdistrict[];
}

export const serviceAreas = serviceAreasJson as ServiceAreasData;

const stateBySlug = new Map(serviceAreas.states.map((state) => [state.slug, state]));
const districtBySlug = new Map(serviceAreas.districts.map((district) => [district.slug, district]));
const subdistrictByKey = new Map(
    serviceAreas.subdistricts.map((sub) => [`${sub.districtSlug}::${sub.slug}`, sub])
);

const districtsByStateSlug = new Map<string, ServiceAreaDistrict[]>();
for (const district of serviceAreas.districts) {
    const list = districtsByStateSlug.get(district.stateSlug) ?? [];
    list.push(district);
    districtsByStateSlug.set(district.stateSlug, list);
}

const subdistrictsByDistrictSlug = new Map<string, ServiceAreaSubdistrict[]>();
for (const subdistrict of serviceAreas.subdistricts) {
    const list = subdistrictsByDistrictSlug.get(subdistrict.districtSlug) ?? [];
    list.push(subdistrict);
    subdistrictsByDistrictSlug.set(subdistrict.districtSlug, list);
}

for (const list of districtsByStateSlug.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
}

for (const list of subdistrictsByDistrictSlug.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
}

export function getServiceStateBySlug(slug: string) {
    return stateBySlug.get(slug);
}

export function getServiceDistrictBySlug(slug: string) {
    return districtBySlug.get(slug);
}

export function getServiceDistrictsByStateSlug(stateSlug: string) {
    return districtsByStateSlug.get(stateSlug) ?? [];
}

export function getServiceSubdistrictBySlugs(districtSlug: string, subdistrictSlug: string) {
    return subdistrictByKey.get(`${districtSlug}::${subdistrictSlug}`);
}

export function getServiceSubdistrictsByDistrictSlug(districtSlug: string) {
    return subdistrictsByDistrictSlug.get(districtSlug) ?? [];
}
