# Breadcrumb Recipe

Breadcrumb is consumer-owned presentation, not a packaged primitive. These registry
items install editable source composed directly from OpenTUI Box and Text
nodes:

- `core.ts` exports the imperative `createBreadcrumb`, `createBreadcrumbList`, `createBreadcrumbItem`, `createBreadcrumbLink`, `createBreadcrumbPage`, `createBreadcrumbSeparator`, and `createBreadcrumbEllipsis` recipes.
- `react.tsx` exports the React `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, and `BreadcrumbEllipsis` recipes.
- `solid.tsx` exports the Solid `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, and `BreadcrumbEllipsis` recipes.

The recipes define navigation trail structure, separators (`›`), active page indicators,
and theme-reactive colors. Applications can customize any crumb element or edit the source
directly without wrapping an opaque package component.
