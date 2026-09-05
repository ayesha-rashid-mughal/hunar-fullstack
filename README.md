# Hunar Marketplace — professional rebuild

This is a Node.js + Express + MySQL rebuild of your handicrafts marketplace,
one level up from the PHP version: a real REST API with hashed passwords
and JWT-based login instead of raw PHP sessions, a database-backed cart
and wishlist (not `$_SESSION`), and a transaction-safe checkout.

```
hunar-fullstack/
├── backend/
│   ├── config/       db.js (connection pool), schema.sql, seed.sql
│   ├── controllers/   one file per resource — the actual logic
│   ├── middleware/    auth.js — JWT verification (requireAuth, requireAdmin)
│   ├── routes/        thin route → controller mappings
│   └── server.js      entry point
└── frontend/          Plain HTML/CSS/JS, no build step
    ├── index.html, shop.html, product.html, cart.html,
    │   wishlist.html, auth.html, account.html, admin.html
    ├── css/style.css
    ├── js/            one file per page, plus shared api.js + nav.js
    └── assets/images/  your real product & category photos
```

## 1. Set up the database

```bash
mysql -u root -p < backend/config/schema.sql
mysql -u root -p hunar_marketplace < backend/config/seed.sql
```

This creates a fresh `hunar_marketplace` database (dropping any old one of
that name first) with your 7 seeded products, using your actual category
names and image paths.

## 2. Configure and run the backend

```bash
cd backend
cp .env.example .env
```
Open `.env` and set `DB_PASSWORD` to your MySQL password. You should also
change `JWT_SECRET` to any long random string — it's what signs login
tokens.

```bash
npm install
npm start
```

The API runs at `http://localhost:5000` and also serves the frontend
directly — open `http://localhost:5000` in a browser once it's running.
No separate frontend server needed.

## 3. Log in

Seed data creates two accounts:

| Role | Email | Password |
|---|---|---|
| Customer | buyer@example.com | Customer123! |
| Admin | admin@hunar.pk | Admin123! |

Admin login is a separate form, reachable from the "Are you the admin?"
link at the bottom of the login/register page (auth.html).

## 4. What changed vs. the PHP version, and why

| PHP version | This version | Why it's more professional |
|---|---|---|
| PHP session for login | JWT token in localStorage, sent as Authorization: Bearer | Stateless — works across multiple servers/devices, standard for any real API |
| Plain mysqli queries, some string-built | Parameterized queries everywhere (mysql2) | No SQL injection risk |
| Passwords likely plain or weakly hashed | bcrypt via bcryptjs, 10 rounds | Passwords can't be reversed even if the database leaks |
| Cart lived only in PHP session | Real cart_items table | Cart survives logout/login, works across devices |
| Checkout: multiple separate queries | Wrapped in a database transaction | If anything fails mid-checkout, nothing is half-saved — it's all-or-nothing |
| One shared codebase mixing HTML + PHP + SQL | Separate backend (API) and frontend (static files) | This is the standard REST API + client shape used in real companies |

## 5. Tested end-to-end

Before handing this over, a real MySQL instance was stood up, the schema
and seed files were run against it, the server was booted, and the actual
API was exercised: registered/logged in a customer, added to cart,
checked out (verified stock decremented and the order was created),
logged in as admin, pulled dashboard stats, and confirmed a customer's
token is correctly rejected on admin-only routes (403 response). All of
it passed against the exact code in this zip.

## 6. Natural next steps

- Product image uploads — right now the admin panel takes an image path
  (text), not a file upload. A library like multer would add real uploads.
- Email on order confirmation — currently silent; Nodemailer could send
  a receipt.
- Pagination — GET /api/products returns everything at once; fine for a
  small catalog, would need LIMIT/OFFSET at scale.
