# Carbone Templates

This directory contains Carbone template files used for document generation. Carbone
uses `{c.field_name}` syntax for JSON data placeholders. Templates must be created
in Microsoft Word (`.docx`) or Microsoft Excel (`.xlsx`).

## Creating Templates

### 1. brochure.docx
Create in Microsoft Word. This is the property brochure template for buyer/seller
marketing materials.

**Carbone tags used:**

```
{c.property_name}
{c.property_address}
{c.property_type}
{c.bedrooms}
{c.bathrooms}
{c.floor_area}
{c.lot_area}
{c.price}
{c.description}
{c.features}
{c.cover_image}
{c.property_images}
{c.agent_name}
{c.agent_phone}
{c.agent_email}
{c.agency_logo}
{c.agency_name}
{c.generated_date}
```

**Conditional blocks (use Carbone `{c.showBlock}` syntax):**
- `{c.show_floor_plan}` — controls floor plan image visibility
- `{c.show_virtual_tour}` — controls virtual tour link visibility
- `{c.price_prefix}` — "For Sale" or "For Lease"

**Loops (use Carbone arrays):**
- `{c.features}` — array of property feature strings
- `{c.property_images}` — array of image URLs

---

### 2. cma-report.docx
Create in Microsoft Word. Comparative Market Analysis report for sellers.

**Carbone tags used:**

```
{c.property_name}
{c.property_address}
{c.details}
{c.comparables}
{c.market_trends}
{c.recommended_range}
{c.valuation_summary}
{c.market_conditions}
{c.avg_days_on_market}
{c.price_per_sqft}
{c.neighborhood_overview}
{c.agent_name}
{c.agent_photo}
{c.agent_phone}
{c.agent_email}
{c.agency_logo}
{c.generated_date}
```

**Loops (arrays):**
- `{c.comparables}` — array of comparable property objects, each with:
  - `{c.address}`, `{c.sold_price}`, `{c.sold_date}`, `{c.bedrooms}`, `{c.bathrooms}`, `{c.sqft}`, `{c.image}`
- `{c.market_trends}` — array of trend objects, each with:
  - `{c.month}`, `{c.median_price}`, `{c.volume}`

**Conditional blocks:**
- `{c.show_chart}` — controls market trend chart visibility
- `{c.is_buyers_market}` — toggles buyer/seller market messaging

---

### 3. comparison-table.xlsx
Create in Microsoft Excel. Side-by-side property comparison spreadsheet.

**Sheet structure:**
- **Row 1:** Property names (`{c.property_1_name}`, `{c.property_2_name}`, `{c.property_3_name}`, `{c.property_4_name}`)
- **Row 2:** Property images (`{c.property_1_image}`, `{c.property_2_image}`, ...)
- **Row 3:** Price (`{c.property_1_price}`, ...)
- **Row 4:** Address (`{c.property_1_address}`, ...)
- **Row 5:** Bedrooms (`{c.property_1_bedrooms}`, ...)
- **Row 6:** Bathrooms (`{c.property_1_bathrooms}`, ...)
- **Row 7:** Floor area (`{c.property_1_floor_area}`, ...)
- **Row 8:** Lot area (`{c.property_1_lot_area}`, ...)
- **Row 9:** Year built (`{c.property_1_year_built}`, ...)
- **Row 10:** Features (`{c.property_1_features}`, ...)
- **Row 11:** Notes (`{c.property_1_notes}`, ...)

**Additional tags:**
- `{c.comparison_title}`
- `{c.generated_date}`

---

## Carbone Tag Format

All data placeholders use the `{c.field_name}` syntax:

| Syntax | Description |
|--------|-------------|
| `{c.field}` | Simple field replacement |
| `{c.field:format}` | Format modifier (e.g., `{c.price:formatNumber(2, '.', ',')}` for PHP 1,234.56) |
| `{c.field:ifEmpty(N/A)}` | Fallback value if field is empty |
| `{c.field:showIf(condition)}` | Conditional visibility |
| `{c.image_url}` | Insert an image (set `type: 'image'` in Carbone options) |

## Data Format

The JSON payload sent to Carbone should be structured like:

```json
{
  "property_name": "123 Main Street",
  "bedrooms": 4,
  "bathrooms": 3,
  "price": 450000,
  "features": ["Pool", "Garden", "Garage"],
  "generated_date": "July 16, 2026"
}
```

## Testing Templates

1. Place your `.docx`/`.xlsx` template in this directory
2. Start the dev server: `npm run dev`
3. Hit the generate endpoint with test data
4. Download and inspect the generated file
