# Live Hero Asset Diagnosis

Checked on 2026-08-22.

| URL checked | Result |
| --- | --- |
| `https://magneticsource.uk/` | The current homepage shell loads, but the hero photograph is missing from the live desktop view. |
| `https://magneticsource.uk/manus-storage/magnetic-source-hero-packing-supplies_59ed26c5.jpg` | Resolves to the application’s public 404 page, not to an image file. |

Conclusion: the private project storage path used in the hero works in preview but is not served by the Cloudflare deployment. The hero must use publicly served image URLs instead.

Follow-up check after pushing commit `1e984f6`: the replacement public CDN image itself is directly accessible, but `https://magneticsource.uk/?hero=1e984f6` continued to render the prior white hero field. This shows that the live Cloudflare deployment had not yet consumed the newest GitHub revision at the time of the check.

A further live check after the deployment window confirmed the correction: `https://magneticsource.uk/?hero=1e984f6-recheck` displays the wholesale hero photography on the deployed desktop site. The current mobile layout also renders the same public hero image successfully.
