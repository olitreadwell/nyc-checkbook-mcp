# API surface probing

## What this is for

The Checkbook NYC API tells you its own specification if you ask wrong. Errors `1101` (bad request parameter) and `1106` (bad response column) enumerate the **full valid set** for the resolved domain. Sending one deliberately invalid name per domain per axis therefore returns the real spec.

```bash
bash scripts/probe-api-spec.sh   # writes probe-results.txt, ~24 paced requests, ~40s
```

**Build against this output, not against the published documentation.** That distinction is not academic: it is the difference between a working release and a broken one. See *Documentation defects* below, and the `SUB_VENDOR_COLUMNS` comment in `src/tools.ts`.

## Two things to know before trusting the output

**The enumeration is a floor, not a ceiling.** `fiscal_year` on `Registered Contracts(expense) All Years`, and `calendar_year` on `Payroll`, are both **absent from their domain's valid list yet both return `<result>success</result>`.** Passing them appears to resolve a *different* domain rather than error.

So absence from a valid-values list is **not** proof a parameter is rejected. Test it. A test built on "the API listed these, therefore only these" will be wrong in this specific way.

**The rate limit is 1 request per second, and it is documented nowhere.** The script paces at 1.5s and aborts on the first non-200. Exceeding the limit does not throttle: it trips an Imperva block at the edge that persists well past the burst and returns 403 to everything on that IP, an ordinary browser included.

Two further cautions, both learned the hard way:

- **Do not re-run to check whether you are blocked.** Every extra request extends the block. Wait, then send a single request.
- **The pacer in `src/checkbook.ts` and the pacing here are both per-process.** Running this script while an MCP client is live can exceed the limit no matter how well either behaves. Run it alone. (Issue #28.)

## Documentation defects in the Comptroller's published docs

All four are defects in the published documentation, not in this server. Recorded here because each one is a trap for anyone building against this API.

1. **`sub_contract_registration_date` is documented as a valid contracts response column** on `/contract-api`. The live API rejects it with `1106`. Because one invalid response column fails the *entire* request, this single token broke `include_sub_vendors` on every call from v1.2.0 through v1.6.0. Fixed in v1.6.1. **The docs overstate the API.**
2. **`payee_name` is documented as NYCEDC-only** on `/spending-api` ("Applicable Filters: Other Government Entities (NYCEDC)"). The live citywide `Spending` domain accepts it, and this server depends on that. **The docs understate the API** — the opposite direction from (1), which is why neither direction can be assumed.
3. **`max_records` is self-contradictory.** The General Information prose says "up to a maximum of 20000 records per call"; the parameter table on the same page says "fewer than 1000" and caps the field at four characters, which cannot express `20000`. Tested: **20,000 works.** This server uses it as the ceiling, with a default page size of 50.
4. **`records_from` vs `record_from`.** The prose uses `records_from`; the parameter table says `record_from`. **`records_from` is what works**, and pagination offsets correctly with it.

## Citywide contracts have no vendor-name filter

Confirmed, unchanged. The domain rejects `prime_vendor`:

```
1101: Provided request parameter 'prime_vendor' is not valid for
'Registered Contracts(expense) All Years' domain.
```

Vendors are filtered only by `vendor_code`, and **`payee_code` is a valid *request* parameter on Spending but not a valid *response* column** — so there is no API path that yields a vendor code you could then filter contracts by. `VENDOR_NAME_UNSUPPORTED_MESSAGE` is accurate and should stay.

Worth telling users about: the **public web UI** at `/advanced-search` and `/data-feeds` *does* offer a Vendor text field for citywide contracts, plus an Award Method dropdown and an All Years option. **The web front end can express queries the public API cannot.**

## Re-run cadence

Re-run after any Checkbook release, and before trusting any claim in this file. The point of the script is that these facts are cheap to regenerate and expensive to assume.
