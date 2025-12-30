import csv
import json
import re
import urllib.request
from pathlib import Path


STATES = {
    "TAMIL NADU": "Tamil Nadu",
    "KERALA": "Kerala",
    "KARNATAKA": "Karnataka",
    "ANDHRA PRADESH": "Andhra Pradesh",
    "TELANGANA": "Telangana",
}

BASE_URL = (
    "https://raw.githubusercontent.com/planemad/india-local-government-directory/"
    "master/administrative"
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "lib" / "data" / "service-areas.json"


def fetch_csv(name: str) -> list[list[str]]:
    url = f"{BASE_URL}/{name}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        content = resp.read().decode("utf-8", errors="ignore")
    reader = csv.reader(content.splitlines())
    return list(reader)


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = value.replace("&", "and")
    value = re.sub(r"[()']", "", value)
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value)
    return value.strip("-")


def title_case(value: str) -> str:
    parts = re.split(r"\s+", value.strip().lower())
    return " ".join([p.capitalize() if p else "" for p in parts])


def load_reserved_slugs() -> set[str]:
    districts_path = ROOT / "lib" / "data" / "districts.ts"
    if not districts_path.exists():
        return set()
    content = districts_path.read_text(encoding="utf-8", errors="ignore")
    return set(re.findall(r'slug:\s+"([^"]+)"', content))


def main() -> None:
    reserved_slugs = load_reserved_slugs()

    states_rows = fetch_csv("1-state.csv")
    districts_rows = fetch_csv("2-district.csv")
    subdistrict_rows = fetch_csv("3-subdistrict.csv")

    states = []
    state_by_code = {}

    for row in states_rows[1:]:
        state_name = row[3].strip().upper()
        if state_name not in STATES:
            continue
        code = row[1].strip()
        name = STATES[state_name]
        slug = slugify(name)
        states.append({"code": code, "name": name, "slug": slug})
        state_by_code[code] = {"name": name, "slug": slug}

    districts = []
    district_by_code = {}
    used_district_slugs = set(reserved_slugs)

    for row in districts_rows[1:]:
        state_code = row[0].strip()
        if state_code not in state_by_code:
            continue
        district_code = row[2].strip()
        district_name = title_case(row[3].strip())
        state_slug = state_by_code[state_code]["slug"]
        slug = slugify(district_name)
        if slug in used_district_slugs:
            slug = f"{slug}-{state_slug}"
        used_district_slugs.add(slug)
        district = {
            "code": district_code,
            "stateCode": state_code,
            "stateName": state_by_code[state_code]["name"],
            "stateSlug": state_slug,
            "name": district_name,
            "slug": slug,
        }
        districts.append(district)
        district_by_code[district_code] = district

    subdistricts = []
    subdistrict_slug_map: dict[str, set[str]] = {}

    for row in subdistrict_rows[1:]:
        state_code = row[1].strip()
        if state_code not in state_by_code:
            continue
        district_code = row[3].strip()
        if district_code not in district_by_code:
            continue
        subdistrict_name = title_case(row[7].strip())
        district = district_by_code[district_code]
        base_slug = slugify(subdistrict_name)
        used = subdistrict_slug_map.setdefault(district_code, set())
        slug = base_slug
        if slug in used:
            slug = f"{base_slug}-{district['slug']}"
        used.add(slug)
        subdistricts.append(
            {
                "code": row[5].strip(),
                "districtCode": district_code,
                "districtName": district["name"],
                "districtSlug": district["slug"],
                "stateCode": state_code,
                "stateName": district["stateName"],
                "stateSlug": district["stateSlug"],
                "name": subdistrict_name,
                "slug": slug,
            }
        )

    payload = {
        "states": states,
        "districts": districts,
        "subdistricts": subdistricts,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")
    print(
        f"Generated {len(states)} states, {len(districts)} districts, "
        f"{len(subdistricts)} subdistricts -> {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
