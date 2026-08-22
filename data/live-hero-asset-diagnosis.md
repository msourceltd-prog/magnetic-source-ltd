# Live Hero Asset Diagnosis

Checked on 2026-08-22.

| URL checked | Result |
| --- | --- |
| `https://magneticsource.uk/` | The current homepage shell loads, but the hero photograph is missing from the live desktop view. |
| `https://magneticsource.uk/manus-storage/magnetic-source-hero-packing-supplies_59ed26c5.jpg` | Resolves to the application’s public 404 page, not to an image file. |

Conclusion: the private project storage path used in the hero works in preview but is not served by the Cloudflare deployment. The hero must use publicly served image URLs instead.
