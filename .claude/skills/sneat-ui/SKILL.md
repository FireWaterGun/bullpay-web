---
name: sneat-ui
description: Generate UI components using Sneat Bootstrap 5 theme classes and patterns used in this project. Use when creating or modifying JSX views, pages, modals, tables, forms, cards, or any UI element.
---

# Sneat Bootstrap 5 UI Theme Guide

You are generating UI for a React 19 SPA using the **Sneat Bootstrap 5 HTML Admin Template**. All CSS/JS is loaded globally from `index.html` — never import jQuery, Bootstrap JS, or theme CSS in components.

## Key Rules

1. **Use Sneat/Bootstrap classes** — never write custom CSS for standard patterns (spacing, flex, grid, colors, badges, buttons, modals, cards, tables, forms)
2. **Icons** — Use Boxicons: `<i className="bx bx-{name}"></i>`. Available globally via CDN.
3. **No jQuery** — Use React state/refs for interactivity. Theme JS handles sidebar/menu behavior.
4. **Dark mode** — Handled automatically via `data-bs-theme` attribute. Use theme-aware classes (`bg-label-*`, `text-body`, `bg-footer-theme`, `bg-navbar-theme`).
5. **Page wrapper** — Every page view should use: `<div className="container-xxl flex-grow-1 container-p-y">`
6. **Charts** — Use `window.ApexCharts` via `useEffect`, not imported.

## Layout Structure

```
layout-wrapper > layout-container > layout-page
  ├── layout-navbar (top navbar)
  ├── layout-menu (sidebar)
  └── content-wrapper
       ├── container-xxl flex-grow-1 container-p-y (page content)
       └── content-footer footer bg-footer-theme
```

## Common Patterns

For detailed class reference and code examples, see [reference.md](reference.md).

### Status Badge
```jsx
<span className={`badge rounded-pill ${
  status === 'active' ? 'bg-label-success' :
  status === 'pending' ? 'bg-label-warning' :
  status === 'error' ? 'bg-label-danger' :
  'bg-label-secondary'
}`}>{status}</span>
```

### Card Page
```jsx
<div className="container-xxl flex-grow-1 container-p-y">
  <div className="card">
    <div className="card-header d-flex justify-content-between align-items-center">
      <h5 className="card-title mb-0">Title</h5>
      <button className="btn btn-primary btn-sm">Action</button>
    </div>
    <div className="card-body">Content</div>
  </div>
</div>
```

### Data Table with Filters
```jsx
<div className="card">
  <div className="card-body">
    {/* Filters */}
    <div className="row g-3 mb-4">
      <div className="col-md-3">
        <label className="form-label">Status</label>
        <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
        </select>
      </div>
    </div>
    <div className="d-flex gap-2 mb-4">
      <button className="btn btn-primary" onClick={applyFilters}>Apply</button>
      <button className="btn btn-outline-secondary" onClick={resetFilters}>Reset</button>
    </div>

    {/* Table */}
    <div className="table-responsive">
      <table className="table table-hover border-top">
        <thead><tr><th>Column</th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}><td>{item.name}</td></tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div className="text-muted small">Showing {start}-{end} of {total}</div>
      <div className="btn-group">
        <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={prevPage}>Previous</button>
        <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages} onClick={nextPage}>Next</button>
      </div>
    </div>
  </div>
</div>
```

### Modal (React-managed, no jQuery)
```jsx
{showModal && (
  <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Title</h5>
          <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
        </div>
        <div className="modal-body">Content</div>
        <div className="modal-footer">
          <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  </div>
)}
```

### Form with Validation
```jsx
<div className="mb-3">
  <label className="form-label">Email</label>
  <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} {...register('email')} />
  {errors.email && <div className="invalid-feedback d-block">{errors.email.message}</div>}
</div>
```

### Loading Spinner
```jsx
<div className="d-flex justify-content-center align-items-center py-5">
  <div className="spinner-border text-primary" role="status">
    <span className="visually-hidden">Loading...</span>
  </div>
</div>
```

### Empty State
```jsx
<div className="text-center py-5">
  <i className="bx bx-folder-open" style={{ fontSize: '3rem', color: '#a1acb8' }}></i>
  <p className="text-muted mt-2">No items found</p>
</div>
```

### Action Buttons (icon buttons in table rows)
```jsx
<div className="d-flex gap-1 justify-content-end">
  <button className="btn btn-icon btn-sm text-secondary" title="View" onClick={handleView}>
    <i className="bx bx-show" style={{ fontSize: '1rem' }}></i>
  </button>
  <button className="btn btn-icon btn-sm text-secondary" title="Edit" onClick={handleEdit}>
    <i className="bx bx-edit" style={{ fontSize: '1rem' }}></i>
  </button>
  <button className="btn btn-icon btn-sm text-danger" title="Delete" onClick={handleDelete}>
    <i className="bx bx-trash" style={{ fontSize: '1rem' }}></i>
  </button>
</div>
```

### Alert / Error Banner
```jsx
{error && <div className="alert alert-danger mb-4"><i className="bx bx-error me-1"></i>{error}</div>}
```

### Copy-to-Clipboard Button (use shared utility)
```jsx
import { copyToClipboard as copyText } from '../../utils/clipboard'

<button className="btn btn-icon btn-sm btn-text-secondary" onClick={async () => {
  const ok = await copyText(value)
  if (ok) toast.success('Copied!')
}}>
  <i className="bx bx-copy"></i>
</button>
```

### Coin/Token Display (use shared component)
```jsx
import CoinImg from '../../components/CoinImg'

<div className="d-flex align-items-center">
  <CoinImg coin={coin} symbol={coin?.symbol?.toUpperCase()} networkSymbol={network?.symbol?.toUpperCase()} className="me-3" />
  <div>
    <div>{coin?.symbol?.toUpperCase()}</div>
    <small className="text-muted">{network?.name}</small>
  </div>
</div>
```

## Color Reference

| Name | Class prefix | Use for |
|------|-------------|---------|
| Primary | `*-primary` | Main actions, active states |
| Secondary | `*-secondary` | Neutral, muted elements |
| Success | `*-success` | Paid, active, confirmed |
| Danger | `*-danger` | Errors, delete, failed |
| Warning | `*-warning` | Pending, attention needed |
| Info | `*-info` | Informational, processing |

**Label variants** (`bg-label-*`) = light background with colored text. Use for badges, status pills.
**Solid variants** (`bg-*`) = full color background. Use for buttons, highlights.
