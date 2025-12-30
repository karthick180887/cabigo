export interface Vehicle {
    id: string;
    name: string;
    capacity: string;
    luggage: string;
    fuelType: string;
    features: string[];
    idealFor: string[];
    oneWayRatePerKm?: number;
    driverBeta?: number;
}

export const vehicles: Vehicle[] = [
    {
        id: "mini",
        name: "Mini (3+1)",
        capacity: "4 Seats",
        luggage: "0 Bags",
        fuelType: "Petrol",
        features: ["AC", "Compact", "Budget Friendly"],
        idealFor: ["Solo Travelers", "City Rides"],
        oneWayRatePerKm: 12,
        driverBeta: 300,
    },
    {
        id: "sedan",
        name: "Sedan (4+1)",
        capacity: "4 Seats",
        luggage: "3 Bags",
        fuelType: "Petrol",
        features: ["AC", "Spacious Boot", "Comfort"],
        idealFor: ["Small Families", "Outstation"],
        oneWayRatePerKm: 13,
        driverBeta: 300,
    },
    {
        id: "etios",
        name: "Etios (4+1)",
        capacity: "5 Seats",
        luggage: "3 Bags",
        fuelType: "Petrol",
        features: ["AC", "Extra Legroom", "Reliable"],
        idealFor: ["Long Distance", "Senior Citizens"],
        oneWayRatePerKm: 14,
        driverBeta: 300,
    },
    {
        id: "sedan-non-cng",
        name: "Sedan (4+1) (Non-CNG)",
        capacity: "5 Seats",
        luggage: "0 Bags",
        fuelType: "Petrol",
        features: ["AC", "Full Boot Space", "No Smell"],
        idealFor: ["Airport Drops", "Sensitive Travelers"],
        oneWayRatePerKm: 14,
        driverBeta: 300,
    },
    {
        id: "suv",
        name: "SUV (7+1) (6+1)",
        capacity: "8 Seats",
        luggage: "4 Bags",
        fuelType: "Petrol",
        features: ["AC", "High Seating", "Carrier"],
        idealFor: ["Large Groups", "Hills"],
        oneWayRatePerKm: 18,
        driverBeta: 300,
    },
    {
        id: "innova",
        name: "Innova (6+1) (7+1)",
        capacity: "7 Seats",
        luggage: "4 Bags",
        fuelType: "Petrol",
        features: ["AC", "Captain Seats", "Recliner"],
        idealFor: ["Comfort Travel", "Family Trips"],
        oneWayRatePerKm: 19,
        driverBeta: 300,
    },
    {
        id: "innova-crysta",
        name: "Innova Crysta (6+1)",
        capacity: "7 Seats",
        luggage: "4 Bags",
        fuelType: "Petrol",
        features: ["AC", "Premium Interiors", "Stereo"],
        idealFor: ["VIPs", "Luxury Travel"],
        oneWayRatePerKm: 25,
        driverBeta: 300,
    },
];
