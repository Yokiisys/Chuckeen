# Greenbrook Poultry

A chicken shop website with no cart and no payments. Visitors browse, then contact the farm to reserve.

## Open it in VS Code
1. Unzip the folder and open it in VS Code (File > Open Folder).
2. Install the **Live Server** extension, right-click `index.html`, choose **Open with Live Server**.
   You can also just double-click `index.html`. No build step, no npm.

## Pages (all inside index.html, switched by the URL hash)
| URL | What it shows |
| --- | --- |
| `#home` | Introduction, age groups, featured chickens, visit info |
| `#shop`, `#shop-4`, `#shop-5`, `#shop-6` | Listings, filtered by age group, with search and sort |
| `#chicken-<id>` | Product details |
| `#admin` | Admin dashboard |

## Admin
- Go to `#admin`. Starter password: `admin123`. Change it under **Farm details**.
- Add, edit, delete, hide, feature, re-categorize, change price, and adjust stock.
- You can upload a photo per chicken, or use the built-in illustration.

**Important:** listings are saved in the browser's `localStorage`. That means the admin edits are
visible only in the browser that made them, and the password check is not real security.
To make edits visible to every visitor, replace the `Store` object in `js/data.js` with calls to a
real backend (Firebase, Supabase, or your own API).

## Files
- `index.html` page shell
- `css/styles.css` design tokens (the three brand colors are at the top) and layout
- `js/data.js` sample chickens, storage, helpers, chicken illustrations
- `js/app.js` pages, routing, admin

## Customize
- Currency, categories, sample chickens: top of `js/data.js`
- Colors: `--aqua`, `--lime`, `--olive` at the top of `css/styles.css`
