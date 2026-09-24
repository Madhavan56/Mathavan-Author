# Mathavan Uma Mageshwari — Official Author Website

Official website for **Mathavan Uma Mageshwari**, independent author of **THE LAST BLADE** (2026), a cinematic revenge thriller.

## Stack

- Pure **HTML + CSS + vanilla JS** — zero dependencies, no build step
- Google Fonts: Cormorant Garamond (display) + Inter (body)
- Hand-crafted SVG book cover, OG image, and favicon

## Structure

```
index.html          Single page — hero, book, about, journey, contact, CTA, footer
css/styles.css      Design system + section styles
js/main.js          Nav toggle, scroll reveals, copy-email, active nav
assets/             book-cover.svg, og-image.svg, favicon.svg, apple-touch-icon.svg
robots.txt          Allow all crawlers
```

## Local preview

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset: **Other**. No build command, no output directory needed.
4. Deploy — done. Optionally attach a custom domain in Project → Settings → Domains.

No environment variables required.

## Notes

- Canonical URL and Open Graph image URLs currently use `https://mathavanumamageshwari.com/`. After deploying, replace every occurrence with your real domain (search for `mathavanumamageshwari.com` in `index.html`, `press.html`, `sitemap.xml`, `robots.txt`).
- Contact email shown on the site: `madhavan4356@gmail.com`
- Amazon link: https://amzn.in/d/0e9SRNmb

## Connecting the forms (one-time, free)

The contact form and newsletter signup use [Formspree](https://formspree.io) (free tier, no server needed):

1. Create a free Formspree account and make a new form — note the form ID.
2. In `index.html`, replace `YOUR_FORM_ID` in BOTH places (`data-contact-form` action and `data-newsletter-form` action) with your real ID, e.g. `https://formspree.io/f/abcd1234`.
3. Deploy, submit a test message, and confirm Formspree emails you.

Until connected, submitting shows a friendly notice instead of failing silently.

## Excerpt placeholder

The Excerpt section ships with placeholder guidance text — replace it with real lines from the manuscript (keep each quote under ~40 words). Search for `Replace this paragraph` in `index.html`.
