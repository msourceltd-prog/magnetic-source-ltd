# Magnetic Source Ltd — Design Direction

## Ground-truth reference specification

The supplied reference establishes the public ecommerce **information architecture and shopping rhythm** to be followed: a thin utility strip; a header with a centered brand mark, prominent SKU search, quick-order affordance, and basket status; a concise primary navigation row; a category navigation band; a desktop browsing rail; breadcrumb context; and practical wholesale product discovery. Magnetic Source will mirror this approximately **70% at the level of layout, navigation hierarchy, discovery workflow, and UX priorities**, while using wholly original brand assets, text, imagery, catalogue, component implementation, typography, and visual language. No reference-company name, logo, copy, product image, or proprietary brand device will be used.

## Chosen approach — Trade Ledger, Recut

### Design Movement

An **editorial reinterpretation of British trade-catalogue design**: functional like a wholesale ordering portal, but made considered through the calm confidence of contemporary packaging and material-led print design.

### Core Principles

1. **Speed made visible.** Search, category browsing, stock signals, and basket access are immediate and legible rather than ornamental.
2. **Industrial warmth.** Dark ink, bone paper, and saturated cobalt create a credible trade-supply atmosphere without reproducing the reference’s visual identity.
3. **Product evidence over decoration.** Large, quiet product imagery and decisive specification labels prove usefulness at a glance.
4. **An asymmetric browsing rhythm.** The persistent left rail, slim utility band, and content-led product bays make the shop feel operational and premium rather than like a generic marketing landing page.

### Color Philosophy

The foundation is **warm ledger paper** (#F6F2EA) rather than cold pure white, signalling an established British supplier. **Source Cobalt** (#124C9C) is the ownable navigational signal: it carries navigation, active states, and key calls to action with high legibility. **Graphite Ink** (#1A1E22) supplies authority for typography and specification information. A restrained **Signal Ochre** (#C97725) is reserved for availability, parcel, and momentum states so the interface never becomes a wall of blue badges.

### Layout Paradigm

The layout is a **trade desk** rather than a centred marketing grid. A utility strip sits above a three-part operating header. The shop layer uses a horizontal category band and a collapsible desktop rail that anchors browsing on the left, while generous product and editorial content occupies a fluid right-hand field. On small screens, the rail becomes a sheet and the header compresses into an explicit utility cluster, retaining the same decision-making sequence.

### Signature Elements

1. **Source Cobalt category tape:** a full-width navigational band with compact category labels and a fine dotted rule at its lower edge.
2. **Ledger labels:** compact mono-style SKU, stock, pack, and delivery details in bordered capsules or rule-separated rows.
3. **Cut-corner product markers:** a modest diagonal notch applied to selected image frames and callout blocks, suggesting packed cartons and forwarding labels.

### Interaction Philosophy

Interactions favour business confidence: controls respond instantly with a modest press state; search suggestions, category sheets, cart trays, and sort menus enter from their source edge; product cards reveal useful facts rather than decorative overlays. Keyboard focus is always apparent in cobalt and all commerce actions provide a plain-language confirmation.

### Animation

Motion is purposeful and restrained. Menu and cart panels use 180–240ms source-origin transitions with `cubic-bezier(0.23, 1, 0.32, 1)`. Product cards use a 140ms upward image shift and shadow refinement on hover. Page sections may reveal in 40ms staggers, only when `prefers-reduced-motion` allows it. No looping decorative movement or delayed transactional feedback will be used.

### Typography System

**DM Serif Display** provides confident, editorial headlines and selected product-family statements. **Manrope** provides the practical high-legibility interface system, using 500–800 weights for operational controls and 400–600 for reading. **IBM Plex Mono** is reserved for SKU, stock, price context, and micro-labels. Headline scale is fluid but left aligned; letterspacing becomes tighter as the scale increases, while navigation and labels use deliberate uppercase tracking.

### Brand Essence

**Magnetic Source Ltd is the curated UK trade source for small retailers and marketplace sellers who need low-friction, dependable stock without the noise of an overgrown wholesale portal.**

Personality: **considered, practical, assured**.

### Brand Voice

Headlines are direct and materially specific; CTAs are operational and calm; microcopy explains what happens next without hype. Avoid generic welcome language, superlatives, and false urgency.

> “Stock your next best-seller.”

> “Search by product, SKU or pack type.”

### Wordmark & Logo

The mark is a bold, text-free **magnetic field monogram**: two offset cobalt bars curve inward around a small graphite source dot, creating an abstract “M” and a visual pull. It is paired in the interface with a custom-spaced Magnetic Source wordmark in Manrope rather than a default-font lockup. The mark appears large and legible in the header and as the favicon.

### Signature Brand Color

**Source Cobalt — #124C9C**

## Feature boundary

The first release will cover only the user’s necessary brand-approval scope: catalogue discovery, product details, cart, a clearly labelled demo checkout and confirmation, supporting policy content, and a simple admin-ready route. It will intentionally exclude real payments, fictitious customer reviews or ratings, advanced warehouse/analytics tooling, and reference-specific excess features.

## Style Decisions

- All reference-derived behaviour remains at the interaction and information-architecture level; all visual assets and written content are original.
- Generated imagery is used only in visually prominent editorial positions and is never reused across unrelated sections.
- Product data is clearly presented as sample catalogue content for a brand-approval demo until a connected inventory source is available.
- The replacement catalogue will use a clean trade-card hierarchy: real product image, category signal, concise name, short factual description, visible ex-VAT GBP price, SKU, and pack quantity. Stock, promotions, brands, and RRP will appear only when owner-approved source data verifies them.
- The category navigation will remain dense and operational, but its labels, descriptions, and order will be unique to Magnetic Source. No Harrison’s Direct wording, logo, images, or checkout/trade-account behaviour will be reused.
