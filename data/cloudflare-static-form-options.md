# Cloudflare Static Contact Form Options

The owner chose to keep `magneticsource.uk` hosted on Cloudflare rather than move the domain to the server-backed project.

## Verified options

| Option | How it works | Owner setup |
|---|---|---|
| FormSubmit | A named HTML form posts to a FormSubmit endpoint; the service emails the submission to the chosen inbox. The first submission requires recipient-email confirmation. | Confirm the first activation email sent to `msourceltd@gmail.com`. |
| EmailJS | Browser JavaScript sends form data through an EmailJS email-service/template configuration. | Create a free EmailJS account, connect Gmail, create a template, and provide public service/template/key identifiers. |

## Sources

- FormSubmit documentation: <https://formsubmit.co/>. It documents direct email delivery for HTML forms with no backend, named fields, and first-submission recipient confirmation.
- EmailJS contact-form tutorial: <https://www.emailjs.com/docs/tutorial/creating-contact-form/>. It documents browser-side email form delivery using service, template, and public key identifiers.

## Recommended owner path

For the owner’s request—a single unchanged Contact form that emails `msourceltd@gmail.com` on an existing static Cloudflare site—FormSubmit is the lighter option because it needs no account or browser-exposed email service setup. It will require the owner to confirm the first activation email.
