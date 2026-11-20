# SBI General — GCV (Goods Carrying Vehicle) integration

SBI product **CMVGC01**. Source kit: `Downloads/GCV (1)/GCV/GCV` (Policy Model v1.69, payload sheet, Postman collections, master data).

## Where things live

| Path | What |
|---|---|
| `src/lib/sbiGcv/constants.ts` | Product/agreement codes, endpoints, cover codes, code tables |
| `src/lib/sbiGcv/masterMatch.ts` | RC/free text → SBI make/model/variant, RTO → `LOC_xxx`, pincode → city/district |
| `src/lib/sbiGcv/requestBuilder.ts` | QuickQuote / FullQuote / Issuance bodies + response summary |
| `src/lib/sbiGcv/client.ts` | POST helper (shared SBI token, same creds as 4W) |
| `src/lib/sbiGcv/cvJourney.ts` | Browser helper: CV localStorage → API input |
| `src/lib/sbiGcv/masterData/` | Generated from the kit's `Master data/CMVGC01` + `pin_code.csv` |
| `src/pages/api/sbi/gcv/` | `quick-quote`, `full-quote`, `razorpay-order`, `razorpay-verify`, `issuance`, `policy-pdf`, `master` |
| `src/pages/CommercialVehicle/SbiGcv/` | `checkout` and `success` pages |

CKYC reuses the shared SBI routes in `src/pages/api/sbi/ckyc/*` and the `CkycDialog` component.

## Flow

CV1 (RC lookup) → CV5 shows the SBI card (`/quick-quote`) → `SbiGcv/checkout`: CKYC → `/full-quote` (QuotationNo) → Razorpay → `/issuance` (PolicyNo) → `SbiGcv/success` → `/policy-pdf`.

## Behaviour confirmed on UAT (2026-11-20)

- QuickQuote and FullQuote both work. FullQuote returned QuotationNo `QCMVGC01000000238558` with underwriting `Success`.
- Issuance is refused with "No Valid CKYC" until CKYC has been completed (expected).
- `IsNewVehicle` takes `"1"`/`"0"` (Yes/No) on FullQuote, not the New/Used table.
- NCB is applied only through `NCBCarryForward` (0.2–0.5). `NCB` and `NCBPrePolicy` are ignored.
- A rollover FullQuote checks the registration number against IIB, so it needs a real registration number.
- For a new vehicle, the registration date must not be earlier than the risk start date (UW U8114).
- Private carriers (subclass 18/20) and the vehicles in `GCV01DeclineVeh.xlsx` are declined by SBI. The error is shown to the user.
- PolicyType `1` = Package, `2` = Liability Only. This follows the samples; the raw code table lists them the other way round.

## Regenerating master data

Re-run the extraction from the kit's `.xls` files if SBI sends new masters. Only active variants are kept. `rtoCodeMap.json` is built by matching location names from the 4W RTO master (`src/lib/sbiMasterData/rtoLocation.json`) and covers about 92% of codes. Unmapped codes fall back to fuzzy matching on the place name.
