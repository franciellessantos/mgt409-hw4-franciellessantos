# Campus Customs — Harness

## Database: `data/campus_customs.db` (SQLite)

### `catalogue` — 102 products
| Field | Why it matters |
|---|---|
| `product_id` (TEXT, PK) | Stable slug ID. The shop uses it in URLs and as a join key, and the chatbot uses it to point to exactly which items to show on the page. |
| `name` | Display name. The shop shows it on product cards, and the chatbot uses it to refer to items in replies. |
| `garment_type` | Product category (hoodie, T-shirt, jacket…). The shop filters on it, and the chatbot uses it to answer questions like "what hoodies do you have?". Values aren't consistent (e.g., `t-shirt` vs `short-sleeve T-shirt`), so they need normalizing. |
| `description` | Full text about the item. The shop shows it on the detail page, and the chatbot uses it to answer questions about design and material. |
| `colors` (JSON list) | Available colors. The shop can filter by color, and the chatbot can answer "do you have it in pink?" accurately. |
| `search_tags` (JSON list) | Keywords (Yale, Harvard, bulldog…). They power the shop's search and let the chatbot match loose customer wording to products. |
| `image_file_path` | Path to the photo in `products/`. The shop shows the image, and the chatbot's product panel displays matching items with their pictures. |
| `price` (REAL, $32–$98) | Official price. The shop displays it, and the chatbot must always read it from the DB so price answers are 100% true. |

### `inventory` — 612 rows (102 products × 6 sizes)
| Field | Why it matters |
|---|---|
| `id` (PK) | Row ID. Internal only. |
| `product_id` (FK → catalogue) | Connects stock to a product. The shop and the chatbot both need it to look up availability for an item. |
| `size` (XS, S, M, L, XL, XXL) | Size variant. The shop uses it for size pickers, and the chatbot uses it to answer "do you have it in M?". |
| `quantity` (0–25) | Units on hand; 145 rows are 0 (sold out). The shop shows in stock or sold out, and the chatbot must query it live so stock answers are 100% true. |

### `users` — 3 accounts
| Field | Why it matters |
|---|---|
| `id` (PK) | User ID. It links accounts to their chat history. |
| `name` | Full name, used for display. |
| `first_name`, `last_name` | Split name fields. The shop uses them for its greeting, and the chatbot uses the first name to address the customer. |
| `email` (UNIQUE) | Login identifier. The shop uses it for sign-in and sign-up, and a user's email can't be duplicated. |
| `password_hash` | `pbkdf2_sha256$salt$hash`. The shop verifies passwords at login and hashes them the same way at sign-up; the chatbot must never expose it. |
| `created_at` | Signup timestamp. Used for auditing only. |

### `chat_messages` — 22 rows
| Field | Why it matters |
|---|---|
| `id` (PK) | Message ID, which keeps messages in order. |
| `user_id` (FK → users) | Ties each message to a customer. The shop restores their chat, and the chatbot gets conversation memory. |
| `role` (`user` / `assistant`) | Who wrote the message. The chatbot needs it to rebuild the conversation history for the model. |
| `content` | Message text, shown in the chat window and passed to the chatbot as context. |
| `products_json` | Products attached to an assistant reply. The shop re-renders the matching items panel with it when a chat is reloaded. |
| `created_at` | Timestamp, used for ordering and display. |

---

## Authentication (create account & login)

### What we ask for
- **Create account:** first name, last name, email, password.
- **Log in:** email, password.

### What we store in the `users` table
For each account we store: `first_name`, `last_name`, the full `name`, the
`email` (lower-cased), a `created_at` timestamp, and a `password_hash`.
**We never store the password itself.**

### How the password is protected
When someone sets a password, the server runs it through **PBKDF2-HMAC-SHA256**,
a standard, one-way password-hashing function, and stores only the result in
this format:

```
pbkdf2_sha256$<salt>$<hash>
```

- **One-way:** PBKDF2 cannot be reversed. The stored value cannot be turned
  back into the original password, so neither a person reading the database nor
  an AI with access to it can recover the password.
- **Unique salt per user:** every account gets its own random 16-byte salt
  (`secrets.token_hex`). Two people with the same password still get different
  stored values, which defeats precomputed "rainbow table" attacks.
- **Deliberately slow:** we use **260,000 iterations**, which makes brute-force
  guessing expensive while staying fast enough for a real login.

### How login is checked
The server never decrypts anything. It takes the password from the login
attempt, applies the **same** PBKDF2 process with the stored salt and iteration
count, and compares the result to the stored hash using a **constant-time**
comparison (`hmac.compare_digest`, which avoids leaking timing information).
Login succeeds only if the two match.

### Rules and safety behaviors
- **Email format:** rejected unless it looks like a real address
  (`name@domain.tld`), e.g. `xx` and `xx@xx` are refused; `test@test.com` is
  accepted. Validated with a standard regular expression.
- **Password length:** minimum 8 characters.
- **Duplicate email:** if the email already exists, the account is **not**
  created and the user is told the email already exists.
- **No user enumeration on login:** a wrong email and a wrong password return
  the **same** "Incorrect email or password" message, so the site never reveals
  which emails have accounts.
- **Never exposed:** the API's user responses return only id, name, and email —
  the `password_hash` is never sent to the browser, the chatbot, or logs.

### Where it lives in the code
- `backend/auth.py` — email validation, `hash_password`, `verify_password`.
- `backend/main.py` — `POST /api/auth/signup` and `POST /api/auth/login`.

### Verification performed
- Rejected invalid emails `xx`, `xx@xx`, `test@test` (missing top-level domain).
- Created a new account, confirmed the stored value is a hash (no plaintext),
  logged in with the correct password (success) and a wrong password (rejected),
  and confirmed a duplicate email is blocked — through both the API and the
  website UI. Test accounts were removed afterward, leaving the 3 seed users.

---

## Chatbot: front end ↔ FastAPI ↔ PydanticAI agent

### The path a message takes
1. The customer types in the **chat widget** (`frontend/src/components/ChatWidget.tsx`),
   our Handsome Dan bulldog in the bottom-right corner.
2. The widget calls `sendChat()` (`frontend/src/api.ts`), which does a
   `POST /api/chat` with `{ message, history }` (history = recent turns so the
   bot remembers the conversation). In dev, Vite proxies `/api` and `/images`
   to the FastAPI server on port 8000 (`frontend/vite.config.ts`).
3. **FastAPI** (`backend/main.py`, route `POST /api/chat`) receives it, formats
   the recent history, and calls the agent with `await agent.run(prompt)`.
4. The **agent** (`backend/agent.py`) answers, optionally calling tools to read
   real catalogue/inventory data, and returns a structured `ChatReply`.
5. FastAPI returns `{ message, products }`. The widget shows the reply text and
   renders each product as a clickable card that links to its product page.

### How the agent is loaded
- **Framework:** PydanticAI `Agent`, created once in `backend/agent.py`.
- **Model:** `gpt-6-astra`, served through the **Portkey gateway**
  (`https://api.portkey.ai/v1`). We build an `AsyncOpenAI` client pointed at
  Portkey with headers `x-portkey-api-key` and `x-portkey-provider: openai`,
  and wrap it in PydanticAI's `OpenAIResponsesModel` via `OpenAIProvider`.
  We use the **Responses** endpoint because `gpt-6-astra` requires it for
  function-tool calls.
- **API key:** `PORTKEY_API_KEY`, loaded with `python-dotenv` from the
  project-root `.env`. It is never hardcoded, logged, or returned to the client.
- **System prompt:** read at load time from `backend/prompts/prompt.md`
  (Campus Customs voice + safety/on-topic rules). Edit that file to grow the
  prompt — no code change needed.
- **Structured output:** the agent returns a `ChatReply` (`backend/models.py`):
  a `message` string plus a list of `ProductCard`s for the chat panel.

### Tools the agent can call (`backend/tools.py`, all read-only)
- `search_products(query)` — keyword search over name/type/description/colors/tags.
- `list_products()` — browse the catalogue.
- `get_product_details(product_id)` — description, colors, price, stock by size.
- `check_stock(product_id, size?)` — live, accurate availability.
These are the only source of truth for products/prices/stock, so answers stay
100% accurate and the agent never invents data.

### Staying on topic (protecting tokens)
The system prompt restricts Handsome Dan to Campus Customs shopping only. Any
off-topic request (coding, homework, general knowledge, etc.) gets a one-line
polite refusal that steers back to shopping — verified with coding and
general-knowledge questions, which were declined, while product/price/stock
questions were answered accurately.

### Running the backend (from the `backend/` folder)
```
uvicorn main:app --reload --port 8000
```
Files: `main.py` (API), `agent.py` (agent wiring), `tools.py` (tools),
`models.py` (types), `auth.py` (accounts), `prompts/prompt.md` (system prompt).

---

## Product info & stock tools (the agent's only source of truth)

All product/price/stock answers come from `campus_customs.db` through these
read-only tools (`backend/tools.py`). The agent is instructed to call them and
never invent prices or quantities; accuracy is prioritized over speed.

| Tool | Reads from | Returns | When the agent uses it |
|---|---|---|---|
| `search_products(query)` | `catalogue` | list of `ProductCard` | Find items by keyword (style, color, team, occasion) |
| `list_products()` | `catalogue` | list of `ProductCard` | Customer wants to browse |
| `get_product_details(product_id)` | `catalogue` + `inventory` | `ProductDetails` | Before quoting a specific item's price, colors, or description |
| `check_stock(product_id, size?)` | `inventory` (via details) | `StockAnswer` | Any availability / "in stock" / size question |

### Return types (`backend/models.py`) and why these fields
- **`ProductDetails`**: `product_id, name, garment_type, description, colors,
  price, inventory (list of SizeStock), image_url`.
  - `price` and `inventory` are the authoritative numbers — the agent quotes them
    verbatim, so prices and stock are always correct.
  - `description` and `colors` let the agent describe an item and answer color
    questions ("do you have it in navy?") without guessing.
  - `garment_type` helps it group/answer by category (hoodie, tee, jacket).
  - `image_url` + `product_id` feed the chat product cards and their links.
- **`SizeStock`**: `size, quantity` — the exact per-size count, so the agent can
  say "XL: 2 in stock" instead of a vague "available".
- **`StockAnswer`**: `found, name, size, in_stock, quantity, sizes, total` — a
  focused shape for stock questions. For a single size it fills
  `in_stock`/`quantity`; for the whole product it fills `sizes`/`total`.
- **`ProductCard`** (unchanged): the lightweight shape (`product_id, name,
  garment_type, price, image_url, description`) used for search results and the
  cards rendered in the chat panel.

### Why these fields for elaborating answers
The agent only needs enough to (1) identify the item, (2) state the exact price,
(3) describe it, and (4) give exact availability. `price` + `inventory`/`quantity`
guarantee correctness; `name` + `description` + `colors` + `garment_type` let it
write a natural, brief reply; `image_url` + `product_id` power the visual cards.
Fields not needed for answers (e.g. raw `search_tags`, `image_file_path`) are not
surfaced to the model, keeping responses focused and cheap.

### Verified (live, against the DB)
- Basic Hoodie Big Yale → **$68**, per-size counts XS15/S5/M5/L8/XL2/XXL25 — exact.
- Basic Hoodie Big Yale XL → "2 available" — exact.
- 2025 Yale Vs Harvard T Shirt → **$32**, size L "2 in stock" — exact.
Answers were brief and grounded entirely in tool output.

---

## Chat search that updates the page (API contract)

When a customer asks about a type of item in the chat, the matching products
appear on the website automatically. The flow:

1. **Agent side:** the system prompt requires the agent to call
   `search_products` for any category/type question and to place **every product
   to show** in the structured `products` field of its `ChatReply`
   (each a `ProductCard`: `product_id, name, price, image_url, description,
   garment_type`). The agent never invents products — only tool results go in.
2. **API contract:** `POST /api/chat` returns
   `{ "message": string, "products": ProductCard[], "all_products": ProductCard[] }`.
   - `products` = the **top 4 matches by units in stock**, shown as cards in the
     chat bubble (limited space). When more than 4 match, the `message` ends with
     "…and N more products matching this search."
   - `all_products` = **every** matching product (ranked by stock), for the
     website's Products page — so all hoodies/tees/etc. are shown, not just 4.
3. **Front end:** when the chat reply has products, `ChatWidget` shows `products`
   (up to 4) in the bubble, and saves `all_products` to a shared store
   (`ChatResultsProvider` / `useChatResults`), then navigates to `/products`.
4. **The page:** `Products.tsx` reads the store and renders **all** matched
   products as full cards — **image, name, price, and short description** — under
   a banner ("Handsome Dan found N items for '…'"), with a "Show all products"
   button to clear the filter and return to the full catalogue.
5. **Single-item page:** each card links to `/products/:productId`
   (`ProductDetail.tsx`), which shows the large image on the left and, on the
   right, the full description, large price, per-size stock, and the quantity
   picker — exactly as designed in Problem 3.

**Files:** `frontend/src/components/ChatWidget.tsx` (sends message, routes
results), `frontend/src/ChatResultsContext.tsx` (shared store),
`frontend/src/pages/Products.tsx` (renders matches),
`frontend/src/pages/ProductDetail.tsx` (single item),
`backend/prompts/prompt.md` (contract rules), `backend/models.py`
(`ChatReply`/`ProductCard`).

**Verified (live):** "which hoodies do you have?" in chat → navigated to
`/products`, banner showed "found 6 items", 6 cards rendered with image/name/
price/short description; clicking a card opened its single-item page with the
correct $68 price and exact per-size stock.

---

## Customer memory (identity, saved history, page context)

### The agent knows who is chatting (agent deps)
`backend/agent.py` defines a `ChatDeps` dataclass and the agent is created with
`deps_type=ChatDeps`. A dynamic `@agent.instructions` function injects, on every
run, either "chatting with a logged-in customer: <name> (<email>)" or "browsing
as a guest". So the agent can greet the customer by first name and personalize
replies. The email is used only for identity, never read back to the customer.

- The front end stores the logged-in user (`frontend/src/AuthContext.tsx`, kept
  in `localStorage`, so it survives refreshes/new sessions). Each `POST /api/chat`
  sends `user_id`. The backend looks up the user and fills `ChatDeps.user_name`
  and `ChatDeps.user_email`.

### Saved chat history (database table)
History is stored in the existing **`chat_messages`** table
(`user_id, role, content, products_json, created_at`).

- **Save:** on every chat turn from a logged-in customer, the backend inserts the
  customer's message and the assistant's reply (including the reply's product
  cards, serialized to `products_json`).
- **Reload:** `GET /api/chat/history?user_id=<id>` returns the saved
  conversation. When a logged-in customer opens the chat (even in a brand-new
  session), `ChatWidget` calls this and restores the full conversation and the
  product cards from `products_json`.
- Guests (not logged in) are **not** persisted; their chat is per-session only.

### Current-page context (resolving vague questions)
`ChatWidget` reads the current route. If the customer is on a product page
(`/products/:id`), it sends `page: { product_id }` with the chat request. The
backend confirms the product and fills `ChatDeps.page_product_id/name`, and the
`@agent.instructions` function tells the agent: if the customer asks something
vague (size, price, color, stock) without naming a product, assume they mean THIS
product and call the tools with that `product_id`.

### Files
- `backend/agent.py` — `ChatDeps`, dynamic `@agent.instructions`.
- `backend/main.py` — `POST /api/chat` (deps + save), `GET /api/chat/history`.
- `backend/models.py` — `ChatRequest` (`user_id`, `page`), `StoredChatMessage`.
- `frontend/src/AuthContext.tsx` — persisted logged-in user.
- `frontend/src/components/ChatWidget.tsx` — sends identity + page, reloads history.
- `frontend/src/components/Navbar.tsx` — greeting + log out.

### Verified (live)
- Logged-in demo user: agent replied "Hi, Francielle!" (knew the name); guest got
  a neutral reply.
- The exchange was saved to `chat_messages`; `GET /api/chat/history` returned it,
  including the 6 product cards on the hoodie reply; the UI restored the whole
  conversation on opening the chat in a fresh session.
- On the Baseball Left Chest Crewneck page, "is this available in size M?" (no
  product named) correctly resolved to that product: "size M, 5 in stock."

---

## Customer memory — reference summary

### Who can chat, and what persists
| Customer | Can chat? | History saved to DB? | On return |
|---|---|---|---|
| **Logged in** | Yes | **Yes** | Full conversation (text + product cards) reloads automatically |
| **Guest** (not logged in) | **Yes** | **No** | Nothing persists; each visit starts a fresh conversation (per-session only) |

Guests get the same shopping help; only persistence differs. Persistence is
keyed on `user_id`, which is `null` for guests, so nothing is written for them.

### How chat history is stored
- **Table:** `chat_messages` in `campus_customs.db`.
- **Columns:** `id`, `user_id` (FK → `users`), `role` (`user` | `assistant`),
  `content` (message text), `products_json` (the reply's product cards,
  JSON-serialized), `created_at` (timestamp).
- **When it's written:** on each turn from a logged-in customer, the backend
  inserts two rows — the customer's message, then the assistant's reply with its
  cards in `products_json` (`backend/main.py` → `_save_message`).
- **How it's read back:** `GET /api/chat/history?user_id=<id>` returns the rows
  ordered by `id`; the front end restores both the text and the cards
  (`products_json` → `ProductCard[]`). Guests never call this.

### Customer fields the agent can access
Passed into the agent as **deps** (`ChatDeps` in `backend/agent.py`), surfaced to
the model through a dynamic `@agent.instructions` string:

| Field | Source | Agent use |
|---|---|---|
| `user_name` | `users.first_name` (fallback `users.name`) | Greet the customer by first name; personalize |
| `user_email` | `users.email` | Identity only — the agent must **not** read it back to the customer |

For guests both are `None`, and the instructions say "browsing as a guest". The
agent never receives the password hash or any other account field.

### How page context is passed and used
1. **Front end** (`ChatWidget.tsx`) reads the current route. On a product page
   (`/products/:id`) it sends `page: { product_id }` in the `POST /api/chat` body.
2. **Backend** (`main.py`) verifies the `product_id` against `catalogue` and sets
   `ChatDeps.page_product_id` and `page_product_name`.
3. **Agent** (`@agent.instructions`) is told: if the customer asks something vague
   (size, price, color, stock) without naming a product, assume they mean the
   product on the current page and call the tools with that `product_id`.
- Off a product page, no `page` is sent and this context is simply absent.
- Example: on the Baseball Left Chest Crewneck page, "is this in size M?" → the
  agent answers about that crewneck ("size M, 5 in stock").

---

## System summary (final)

### How it works, end to end
The **React + Vite + TypeScript** front end (`frontend/`) talks to a **FastAPI**
back end (`backend/`). The back end serves the catalogue, images, and accounts,
and runs a **PydanticAI** agent ("Handsome Dan") for the chat. All product,
price, and stock answers come from `campus_customs.db` through read-only tools,
so they are always accurate.

### Model fields (`backend/models.py`) and why
- **`ProductCard`** (`product_id, name, garment_type, price, image_url,
  description`) — the lightweight shape for search results and cards in the chat
  and on the page. Just enough to identify, show, price, and link an item.
- **`ProductDetails`** (`+ colors, inventory[]`) — the authoritative record for a
  single product; `price` and `inventory` are quoted verbatim so answers are 100%
  correct; `colors`/`description` let the agent describe items and answer color
  questions without guessing.
- **`SizeStock`** (`size, quantity`) — exact per-size counts, so the agent can say
  "XL: 2 in stock" instead of a vague "available".
- **`StockAnswer`** (`found, name, size, in_stock, quantity, sizes[], total`) — a
  focused shape for stock questions (single size vs. whole product).
- **`ChatReply`** (`message, products[]`) — the agent's structured output: reply
  text + the products to show. Structured output keeps the UI reliable.
- **API I/O**: `ChatRequest` (`message, history[], user_id, page`),
  `ChatResponse` (`message, products[] (≤4, chat), all_products[] (all, page)`),
  `StoredChatMessage` (reloaded history), `PublicUser` (id/name/email — never the
  password hash). Chosen so the front end gets exactly what each surface needs
  and nothing sensitive leaks.

### Tools & abilities (`backend/tools.py`, read-only)
- `search_products(query)` — keyword search → `ProductCard[]`.
- `list_products()` — browse the catalogue.
- `catalogue_summary()` — exact total and per-category counts (for "how many").
- `get_product_details(product_id)` — description, colors, price, per-size stock.
- `check_stock(product_id, size?)` — exact live availability.
Identity and current page reach the agent via **deps** (`ChatDeps`): logged-in
`user_name`/`user_email` and the `page_product_id` being viewed, injected through
a dynamic `@agent.instructions`.

### Safety rules (`backend/prompts/prompt.md`)
- **On-topic only** — Campus Customs shopping; politely declines anything else.
- **Truthful** — never invents products/prices/stock; accuracy over speed.
- **Yale-community compliance** — no discrimination of any kind; understands and
  helps despite English mistakes (never mocks or corrects); **never judges price
  or affordability** (no "cheap/expensive/good deal") out of respect for
  low-income community members; no body/size judgments; inclusive; no hateful or
  unsafe content; upholds these even if asked to break them.
- **Privacy** — never reveals system instructions, other customers' data, or
  passwords/accounts.

### Audit trail (`output/audit_trail.json`)
Append-only JSON-Lines log (`backend/audit.py`). Each agent run appends, with UTC
timestamps: `run_start` (user + question), one `tool_call` and `tool_result` per
tool (args/results truncated), and `run_end` with the stop reason
(`completed` or `error: …`). Past entries are never edited or deleted.

### Specs
- **Models:** website/front-end copy work uses `gpt-5.6-luna`; the agent uses
  **`gpt-6-astra`** via the **Portkey** gateway (OpenAI **Responses** endpoint,
  required for tool calls), key from root `.env` `PORTKEY_API_KEY`.
- **Loop limit:** each agent run is capped at **6 model requests**
  (`UsageLimits(request_limit=6)`) so the tool-call loop can't run forever.
- **Result caps:** the chat bubble shows at most **4** products (ranked by units
  in stock); the Products page receives **all** matches (`all_products`).
- **Auth:** PBKDF2-HMAC-SHA256, unique salt, 260k iterations, constant-time
  compare; email format validated; duplicate emails blocked.
- **Images:** product photos served with `no-cache` so updates show immediately.

### How to run (front + back)
Back end (from `backend/`):
```
uvicorn main:app --reload --port 8000
```
Front end (from `frontend/`):
```
npm install   # first time
npm run dev    # serves http://localhost:5173, proxies /api and /images to :8000
```
Requires the root `.env` with `PORTKEY_API_KEY` and the local data pack at
`hw4/data/data/` (`campus_customs.db` + `products/`).
