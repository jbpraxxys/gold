/**
 * Test PPTX generation directly without AI.
 * Run: node scripts/test-pptx.js
 *
 * Uses sample slide data matching the broker template schema.
 * Outputs a .pptx file to the generated directory.
 */

import { executePresentation } from "../services/ai/tools/presentation.ts";

const result = await executePresentation({
    template: "toprealty-luxury",
    title: "QC Condo Market Overview",
    format: "pptx",
    slides: [
        {
            layout: "broker:title",
            content: {
                property_name: "Quezon City Condo Market",
                price: "₱2.6M – ₱12.8M",
            },
        },
        {
            layout: "broker:property-overview",
            content: {
                property_name: "Accolade Place by DMCI Homes",
                specs: "Feature|Detail\nLocation|P. Tuazon Blvd., Cubao\nUnit Types|2BR (59 sqm) & 3BR (104 sqm)\nPrice|₱7.5M – ₱12.8M\nDeveloper|DMCI Homes",
                highlights:
                    "Boutique resort-style living\nOnly 130 units in 6 floors\nNear Cubao commercial hub\n24/7 security. Pool & gym",
            },
        },
        {
            layout: "broker:property-overview",
            content: {
                property_name: "Avida Towers Sola (Vertis North)",
                specs: "Feature|Detail\nLocation|Vertis North, QC\nUnit Types|Studio to 3BR\nPrice|₱4.0M – ₱9.8M\nDeveloper|Avida Land (Ayala)",
                highlights:
                    "Prime CBD beside Trinoma Mall\nMRT-3 & MRT-7 access\nSky garden. Pool. Gym\nGround-floor retail",
            },
        },
        {
            layout: "broker:comparison",
            content: {
                left_name: "Accolade Place (DMCI)",
                left_details:
                    "Price: ₱7.5M–₱12.8M\nSize: 59–104 sqm\nLocation: Cubao, QC\nType: Boutique mid-rise\nUnits: 130 only",
                right_name: "Avida Towers Sola (Avida)",
                right_details:
                    "Price: ₱4.0M–₱9.8M\nSize: 22–129 sqm\nLocation: Vertis North, QC\nType: High-rise tower\nUnits: Multi-tower",
            },
        },
        {
            layout: "broker:investment",
            content: {
                property_name: "Quezon City Investment Outlook",
                price_range: "₱2.6M – ₱12.8M",
                rental_yield: "5–7% gross annually",
                appreciation: "5–8% per year",
                key_points:
                    "MRT-3 & MRT-7 driving demand\nVertis North BPO expansion\nStudent rental market from UP, Ateneo\nInfrastructure boom: Skyway Stage 3",
            },
        },
        {
            layout: "broker:end",
            content: {
                message: "Thank You!",
                agent: "TopRealty AI • www.toprealty.ai",
            },
        },
    ],
});

console.log("✅ PPTX generated:", JSON.stringify(result, null, 2));
