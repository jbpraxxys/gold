/**
 * Test PPTX generation directly without AI.
 * Run: npm run test-pptx
 * Outputs a .pptx file to the generated directory.
 */

import { executePresentation } from "../services/ai/tools/presentation.ts";

const result = await executePresentation({
    template: "toprealty-luxury",
    title: "Luxury QC Condo Showcase",
    format: "pptx",
    slides: [
        {
            layout: "luxury:title",
            content: {
                property_name: "Accolade Place by DMCI Homes",
                price: "₱7.5M – ₱12.8M",
                location: "Cubao, Quezon City",
            },
        },
        {
            layout: "luxury:overview",
            content: {
                property_name: "Property Overview",
                property_type: "Condominium",
                beds: "2-3",
                baths: "2",
                floor_area: "59-104 sqm",
                parking: "1 slot",
                description: "DMCI Homes boutique-style condominium with resort-inspired amenities.",
            },
        },
        {
            layout: "luxury:amenities",
            content: {
                property_name: "World-Class Amenities",
                amenities: "Resort-style swimming pool\nFitness gym\nFunction room\n24/7 security\nLandscaped gardens",
                premium_features: "Sky lounge\nSmart home ready\nFloor-to-ceiling windows",
            },
        },
        {
            layout: "luxury:location",
            content: {
                property_name: "Prime Cubao Location",
                landmarks: "Landmark|Distance\nMRT-3 Cubao|500m\nGateway Mall|800m\nAraneta Coliseum|1km",
                neighborhood_description: "Located in the heart of Cubao commercial district.",
            },
        },
        {
            layout: "luxury:investment",
            content: {
                property_name: "Investment Outlook",
                rental_yield: "5-7% gross",
                appreciation: "8-12% annually",
                rental_income: "₱25K-₱35K/month",
                market_trend: "QC remains a top investment destination with strong demand.",
                comparable_sales: "Unit 12A|₱7.8M\nUnit 15B|₱8.2M",
            },
        },
        {
            layout: "luxury:contact",
            content: {
                property_name: "Contact Us",
                agent_name: "Maria Santos",
                title: "Senior Property Consultant",
                phone: "+63 917 123 4567",
                email: "maria@toprealty.ai",
                cta_text: "Schedule a Private Viewing Today",
            },
        },
    ],
});

console.log("✅ PPTX generated:", JSON.stringify(result, null, 2));
