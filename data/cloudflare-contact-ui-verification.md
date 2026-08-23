# Cloudflare Contact UI Verification

Date: 23 August 2026

## Verified local render

| Viewport | Result |
|---|---|
| Desktop, 1280 × 720 | The existing Contact hero, contact details, form fields, topic selector, message field, Send enquiry button, and footer all render correctly. |
| Mobile, 390 × 844 | The unchanged form fields stack correctly, remain legible, and retain the existing Send enquiry action and footer layout. |

## Delivery implementation

The Contact page now submits the same named fields directly to the FormSubmit AJAX endpoint, so a static Cloudflare deployment does not rely on `/api/trpc`, Gmail SMTP credentials, or server hosting. The form keeps client-side message-length validation, a hidden honeypot field, a pending state, a success state, and a safe customer-facing error message.

## Deliberate limitation

No live email was submitted during verification because the owner asked to avoid unnecessary test enquiries. FormSubmit requires the recipient to confirm its first activation email after the first real submission.
