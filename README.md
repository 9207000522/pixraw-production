# PIXRAW Production

Static website for PIXRAW Production — creative production and digital solutions
from Edappal, Kerala, India.

## Stack

- Plain HTML, CSS and vanilla JavaScript
- No framework, build step or backend
- Cloudflare Pages compatible (`_headers`, `_redirects`, `functions/`)

## Structure

```
/
├── index.html
├── about.html
├── services.html
├── work.html
├── packages.html
├── contact.html
├── privacy-policy.html
├── terms.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── _headers
├── _redirects
├── functions/
└── assets/
    ├── css/
    │   ├── design-system.css
    │   ├── style.css
    │   └── responsive.css
    ├── js/
    │   └── main.js
    ├── images/
    │   └── webp/
    ├── video/
    │   └── webp/
    └── logo/
```

## Local testing

From the project root:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/pixraw
python3 -m http.server 8080
```

Open `http://localhost:8080/`.

An HTML server is required instead of opening files directly, because the site
uses root-relative asset paths and Cloudflare Pages conventions.

## Content rules

- Contact happens only through direct links: WhatsApp, phone, email and Instagram.
- No online enquiry form.
- Package pricing is not published; pricing and scope are discussed directly.
- Portfolio entries use only the four existing project images.
- The homepage hero uses the eight existing scene images in `assets/video/`.

## Deployment

Upload the static files to Cloudflare Pages without a build command. Keep the
existing `_headers`, `_redirects` and `functions/` files in place. The stylesheet
and script query strings (`?v=20261106v`) are used for cache busting; update them
when the corresponding files change.
