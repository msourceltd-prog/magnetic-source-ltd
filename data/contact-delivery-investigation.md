# Contact Delivery Investigation

Date: 23 August 2026

## Confirmed observations

| Area | Finding |
|---|---|
| Cloudflare Email Routing | The owner’s screenshot shows `msourceltd@gmail.com` as a **Verified** destination address. This confirms Cloudflare can forward messages addressed to the website domain; it does not activate or deliver Contact-form submissions. |
| Contact-form provider | The current public form posts its data through FormSubmit’s AJAX endpoint to `msourceltd@gmail.com`. |
| FormSubmit activation | FormSubmit’s official help states that first submissions are retained until the recipient confirms the form, and that an activation email is normally sent for each unactivated submission. |
| Connected browser inbox | The currently open Gmail browser session identifies itself as `boom93217@gmail.com`, rather than the configured recipient mailbox `msourceltd@gmail.com`; an initial FormSubmit search in this inbox showed no loaded conversations. |

## Working diagnosis

The Cloudflare routing screen is functioning but is unrelated to the FormSubmit activation email. The next check is whether the recipient mailbox `msourceltd@gmail.com` has received the FormSubmit activation message in Inbox, Spam, or All Mail. No additional Contact form submission has been sent during this investigation.

## Browser-session follow-up

The available connected Gmail session either identifies a different account or is no longer signed in when reopened. The configured recipient mailbox cannot therefore be inspected or activated by the assistant through the currently available browser session. This is an account-access limitation, not an error shown by Cloudflare Email Routing.

On a later Gmail inbox check, the account switcher displayed an already-signed-in `Magnetic source ltd` profile with the configured recipient address `msourceltd@gmail.com`. The next action is to switch to that existing profile and search Inbox/Spam for FormSubmit, without creating another Contact submission.

## Cloudflare Email Sending availability

The owner’s Cloudflare Email Sending dashboard was checked on 23 August 2026. It reports that the native Email Sending feature is available only on the **Workers Paid** plan. It cannot therefore be enabled on the account’s current plan without an external paid-plan purchase. The existing static site and domain remain unaffected by this finding.

## Selected free delivery route

The owner created and signed in to a Resend account using `msourceltd@gmail.com`. The account has no verified sending domains yet. The next preparation step is to add `magneticsource.uk` in Resend, retrieve the required sender-authentication DNS records, and add those exact records in the existing Cloudflare DNS zone before a production API key and Contact endpoint are configured.

The owner confirmed adding `magneticsource.uk` to Resend. The domain creation completed and the setup presented both automatic and manual DNS setup choices. The owner also confirmed automatic configuration; the initial browser attempt did not surface a Cloudflare authorization prompt or completion state, so the exact DNS values will be retrieved through the manual view before any further DNS change is attempted.

The manual domain page confirms these required sender-authentication records for `magneticsource.uk`: a DKIM TXT record at `resend._domainkey`; an MX record at `send` with priority 10 pointing to the Resend-provided `feedback-smtp.<region>.amazonses.com` target; and an SPF TXT record at `send` with the Resend-provided Amazon SES include value. The setup also offers an optional DMARC record. The exact long values are available through the account’s copy controls and will be transferred directly rather than manually retyped. The owner confirmed the automatic DNS configuration intent; no resulting completion state has been observed yet.

## DNS progress

The required DKIM TXT record for `resend._domainkey.magneticsource.uk` was added successfully to Cloudflare. The required MX record for `send.magneticsource.uk`, using the Resend-provided `feedback-smtp.ap-northeast-1.amazonses.com` server with priority 10, was also saved successfully. The remaining required sender record is the SPF TXT entry at `send` with `v=spf1 include:amazonses.com ~all`; it is separate from the existing apex SPF record and should not overwrite it.

The SPF TXT record at `send.magneticsource.uk` was subsequently added successfully. Resend was instructed to verify the new DNS configuration and reports `Pending` while checking the records. This is an expected propagation state; no Contact-form message was sent during this verification step.

The Cloudflare static Worker was upgraded to a Worker-plus-assets deployment and now serves the same storefront with a private `/api/contact` endpoint. A restricted Resend key, scoped to sending from `magneticsource.uk`, has been created and saved in the live `magnetic-sourceeltd` Worker as the encrypted `RESEND_API_KEY` secret. The key is not stored in source control, browser-visible site code, or project environment files.

An owner-approved controlled request to the public Contact endpoint was attempted after the secret save. It returned `503 Contact delivery is not configured`, so the request stopped before any email was sent. A second check after the normal secret propagation window returned the same safe non-delivery response. The next action is to trigger a fresh Cloudflare deployment so the live Worker version reloads the newly saved encrypted binding before repeating any actual email test.

After the fresh Cloudflare deployment, the owner-approved controlled request returned `200 {"ok":true}`. The owner then confirmed receipt of the email in `msourceltd@gmail.com`. The Contact form is therefore verified to deliver through the existing Cloudflare-hosted website without FormSubmit activation, Manus hosting, or exposed credentials.

Following a later report that a visible success state did not correspond to an email receipt, the Contact form and Worker were corrected so the honeypot path returns a clear error rather than a false success. All type, build, Worker-bundle, and ten unit tests passed. The owner then approved one final controlled request; it returned `200 {"ok":true}` and the owner confirmed the email was received in `msourceltd@gmail.com`.

The owner then supplied a screenshot proving that a browser autofilled the hidden `website` field, which blocked a genuine enquiry before it reached the email endpoint. The hidden field and associated blocking logic were removed from both the React Contact page and Cloudflare Worker. The revised implementation passed type checking, ten unit tests, the production build, and Worker-bundle compilation. A final owner-approved request returned `200 {"ok":true}`, and the owner confirmed the resulting email arrived in `msourceltd@gmail.com`.

## Sources

- <https://formsubmit.co/help>
- <https://formsubmit.co/ajax-documentation>
