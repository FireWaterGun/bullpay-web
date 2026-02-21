# Sneat Bootstrap 5 — Class Reference

## Layout Classes

| Class | Purpose |
|-------|---------|
| `layout-wrapper` | Root layout container |
| `layout-container` | Inner layout wrapper |
| `layout-page` | Main page content area |
| `layout-navbar` | Top navbar container |
| `layout-menu` | Sidebar menu container |
| `layout-menu-toggle` | Menu toggle button |
| `layout-overlay` | Mobile menu overlay |
| `layout-menu-collapsed` | Collapsed sidebar state |
| `layout-menu-expanded` | Mobile menu open state |
| `layout-menu-hover` | Hover-expanded sidebar |
| `layout-navbar-fixed` | Fixed navbar |
| `layout-menu-fixed` | Fixed sidebar |
| `content-wrapper` | Main content wrapper |
| `content-footer` | Footer area |
| `content-backdrop` | Background overlay |
| `container-xxl` | Max-width container |
| `container-p-y` | Vertical padding |
| `container-p-x` | Horizontal padding |

## Sidebar Menu Classes

| Class | Purpose |
|-------|---------|
| `menu-vertical` | Vertical menu layout |
| `menu-inner` | Inner menu container |
| `menu-item` | Menu item |
| `menu-item.active` | Active/current item |
| `menu-item.open` | Expanded group |
| `menu-link` | Menu link |
| `menu-toggle` | Expandable group toggle |
| `menu-sub` | Submenu container |
| `menu-text` | Menu text |
| `menu-icon` | Icon area |

## Card Classes

| Class | Purpose |
|-------|---------|
| `card` | Card container |
| `card-header` | Header section |
| `card-body` | Body/content |
| `card-footer` | Footer section |
| `card-title` | Title text |
| `card-subtitle` | Subtitle text |
| `card-datatable` | Card wrapping a data table |
| `table-responsive` | Responsive table wrapper |

## Badge / Status Classes

```
badge                    — Base badge
badge rounded-pill       — Pill-shaped badge
badge-center             — Centered content badge (for icons)

bg-label-primary         — Light primary background
bg-label-secondary       — Light secondary
bg-label-success         — Light green (active, paid, confirmed)
bg-label-danger          — Light red (error, failed, rejected)
bg-label-warning         — Light orange (pending, attention)
bg-label-info            — Light cyan (processing, info)

bg-primary               — Solid primary
bg-success               — Solid green
bg-danger                — Solid red
bg-warning               — Solid orange
bg-info                  — Solid cyan
```

## Button Classes

```
btn                      — Base button
btn-primary              — Primary action
btn-secondary            — Secondary
btn-success              — Success/confirm
btn-danger               — Destructive
btn-warning              — Warning
btn-info                 — Info

btn-outline-primary      — Outlined primary
btn-outline-secondary    — Outlined secondary
btn-outline-danger       — Outlined danger

btn-sm                   — Small
btn-lg                   — Large
btn-icon                 — Icon-only (square)
btn-text-primary         — Text with primary color
btn-text-secondary       — Text with secondary color
btn-label-primary        — Label background
btn-close                — Close (X) button
btn-group                — Button group wrapper
rounded-pill             — Pill shape modifier
```

## Form Classes

```
form-control             — Text input, textarea
form-select              — Select dropdown
form-label               — Label
form-check               — Checkbox/radio wrapper
form-check-input         — Checkbox/radio input
form-check-label         — Checkbox/radio label
form-switch              — Toggle switch
form-password-toggle     — Password visibility toggle
is-invalid               — Invalid state (red border)
invalid-feedback         — Error message (shown with is-invalid)
form-control-lg          — Large input
```

## Modal Classes

```
modal fade show d-block  — Visible modal container
modal-dialog             — Dialog wrapper
modal-dialog-centered    — Vertically centered
modal-dialog-scrollable  — Scrollable body
modal-lg                 — Large modal
modal-content            — Content wrapper
modal-header             — Header
modal-title              — Title in header
modal-body               — Body content
modal-footer             — Footer (buttons)
btn-close                — Close button
```

## Dropdown Classes

```
dropdown                 — Wrapper
dropdown-toggle          — Toggle button
hide-arrow               — Hide toggle arrow
dropdown-menu            — Menu container
dropdown-menu-end        — Right-aligned
dropdown-item            — Menu item
dropdown-divider         — Separator line
dropdown-header          — Header text
dropdown-notifications   — Notification dropdown (custom)
```

## Table Classes

```
table                    — Base table
table-hover              — Row hover effect
table-borderless         — No borders
table-sm                 — Compact
table-responsive         — Horizontal scroll wrapper
table-light              — Light header
border-top               — Top border
card-datatable           — Table inside card (auto-styled)
invoice-list-table       — Invoice-specific table styling
```

## Alert Classes

```
alert alert-primary      — Primary info
alert alert-success      — Success message
alert alert-danger       — Error message
alert alert-warning      — Warning message
alert alert-info         — Info message
```

## Avatar Classes

```
avatar                   — Container
avatar-initial           — Text/initial avatar
avatar-online            — Online indicator
avatar-sm                — Small
avatar-lg                — Large
rounded-circle           — Circular
```

## Boxicons (Common)

### Navigation & Actions
```
bx-menu          bx-chevron-left    bx-chevron-right   bx-chevron-up
bx-chevron-down  bx-arrow-back      bx-refresh         bx-search
bx-filter        bx-edit            bx-trash           bx-copy
bx-download      bx-upload          bx-share-alt       bx-export
bx-link          bx-link-external   bx-qr              bx-plus
bx-minus         bx-dots-vertical-rounded               bx-show
```

### User & Account
```
bx-user          bx-user-circle     bx-user-plus       bx-user-check
bx-id-card       bx-log-out         bx-lock            bx-lock-open
bx-power-off     bx-key             bx-shield
```

### Finance & Payment
```
bx-wallet        bx-money           bx-money-withdraw   bx-dollar
bx-dollar-circle bx-receipt         bx-transfer         bx-bar-chart
bx-bar-chart-alt-2  bx-line-chart   bx-trending-up      bx-trending-down
bx-coin          bx-coin-stack
```

### Status & Info
```
bx-check         bx-check-circle    bx-check-double     bx-x
bx-x-circle      bx-info-circle     bx-error            bx-error-circle
bx-bell          bx-bell-off        bx-time             bx-timer
```

### Other
```
bx-home-alt      bx-book            bx-cog              bx-globe
bx-store         bx-group           bx-gas-pump         bx-mobile-alt
bx-history       bx-calendar        bx-envelope         bx-code-alt
bx-folder-open   bx-sun             bx-moon
```

### Icon Usage
```jsx
<i className="bx bx-{name}"></i>                    // Default size
<i className="bx bx-{name}" style={{ fontSize: '1rem' }}></i>  // Custom size
<i className="bx bx-{name} me-2"></i>               // With right margin
<i className="bx bx-{name} text-primary"></i>        // Colored
```

## Spacing (Bootstrap 5)

```
m-0 .. m-5       — Margin all sides
mt-* mb-* ms-* me-*  — Margin top/bottom/start/end
mx-auto          — Center horizontally
p-0 .. p-5       — Padding all sides
pt-* pb-* ps-* pe-*  — Padding top/bottom/start/end
px-* py-*        — Padding horizontal/vertical
g-2 g-3 g-4      — Grid gap
gap-1 gap-2 gap-3 — Flex gap
```

## Flexbox

```
d-flex           — Flex container
flex-row         — Row direction
flex-column      — Column direction
flex-wrap        — Allow wrapping
align-items-center    — Vertical center
align-items-start     — Align top
align-items-end       — Align bottom
justify-content-center    — Horizontal center
justify-content-between   — Space between
justify-content-end       — Align right
flex-grow-1      — Fill available space
flex-shrink-0    — Don't shrink
```

## Text

```
text-center      text-end         text-start
text-muted       text-primary     text-secondary
text-success     text-danger      text-warning      text-info
text-white       text-dark        text-body
text-truncate    text-nowrap      text-break        text-wrap
text-uppercase   text-capitalize  text-decoration-none
fw-bold          fw-medium        fw-semibold
small            fs-3  fs-5  fs-6
font-monospace
```

## Display & Visibility

```
d-block          d-inline         d-inline-block    d-none
d-flex           d-grid           d-inline-flex
d-md-none        d-md-block       d-md-flex
d-xl-none        d-xl-block
visually-hidden  — Screen reader only
```

## Borders & Radius

```
border           border-0         border-top        border-bottom
border-primary   border-secondary
rounded          rounded-1..4     rounded-circle    rounded-pill
shadow           shadow-sm        shadow-lg         shadow-none
```

## Grid

```
row              — Grid row
col-12           — Full width
col-md-3         — 25% at medium
col-md-4         — 33% at medium
col-md-6         — 50% at medium
col-sm-6         — 50% at small
col-lg-3         — 25% at large
col-xl-2         — 16% at XL
```

## Responsive Breakpoints

| Breakpoint | Min width | Prefix |
|-----------|----------|--------|
| sm | 576px | `col-sm-*`, `d-sm-*` |
| md | 768px | `col-md-*`, `d-md-*` |
| lg | 992px | `col-lg-*`, `d-lg-*` |
| xl | 1200px | `col-xl-*`, `d-xl-*` |
| xxl | 1400px | `col-xxl-*`, `d-xxl-*` |

## Dark Mode

Theme is set via `data-bs-theme` attribute on `<html>`:
- `"light"` — Light mode
- `"dark"` — Dark mode
- Stored in `localStorage` key `ui_theme`

Use theme-aware classes:
- `bg-footer-theme`, `bg-navbar-theme` — Auto-adapt
- `bg-label-*` — Adapt to dark/light
- `text-body` — Body text color (auto)
- `text-body-secondary` — Muted text (auto)
- Avoid hardcoded colors like `color: #333` — use `text-dark` or `text-body` instead
