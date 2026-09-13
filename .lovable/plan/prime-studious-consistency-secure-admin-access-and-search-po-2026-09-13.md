# Prime Studious consistency, secure admin access, and search polish

## What will change
- Replace all visible and metadata branding with **Prime Studious**, including image descriptions and account messages.
- Point canonical, Open Graph, and JSON-LD website URLs to `https://primestudious.lovable.app/` while preserving the existing Google verification tag.
- Remove the hardcoded admin PIN from both the website and server function.
- Store the PIN as a protected Lovable Cloud secret and validate the full admin flow on the server before granting the admin role.
- Improve story search with delayed queries, stale-result protection, error feedback, and a custom gold-and-blue “turning pages” animation instead of a circular spinner.
- Keep the search available in both user views and preserve title-based partial matching.

## Security details
- Require a signed-in user for every admin verification step.
- Issue short-lived, one-time verification tickets between password, OTP, and final role-grant steps so users cannot skip directly to the grant request.
- Validate the time PIN server-side rather than trusting the browser clock.
- Remove development OTP disclosure from responses and the on-screen message.
- Rate-limit failed admin attempts and avoid returning sensitive verification details.
- Keep admin roles in the existing dedicated role table.

## Verification
- Run the relevant checks and inspect the dashboard at desktop and mobile sizes.
- Confirm story matches navigate correctly, the custom search animation appears, branding is consistent, and direct admin-role grant attempts fail.
