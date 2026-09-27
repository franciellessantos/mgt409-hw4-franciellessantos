"""Campus Customs API — serves catalogue, inventory, and product images."""

import json
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.responses import Response

from auth import hash_password, is_valid_email, verify_password
from models import (
    ChatMessageIn,
    ChatRequest,
    ChatResponse,
    ProductCard,
    StoredChatMessage,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "campus_customs.db"
SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"]

app = FastAPI(title="Campus Customs API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
class NoCacheStaticFiles(StaticFiles):
    """Serve product images without browser caching, so updated images
    (e.g. background changes) always appear without a hard refresh."""

    def is_not_modified(self, response_headers, request_headers) -> bool:  # noqa: ARG002
        return False

    async def get_response(self, path, scope):
        response: Response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return response


app.mount("/images", NoCacheStaticFiles(directory=DATA_DIR / "products"), name="images")


def get_db() -> sqlite3.Connection:
    # Read-only connection so the API can never modify catalogue or stock.
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def get_rw_db() -> sqlite3.Connection:
    # Read-write connection, used only for creating user accounts.
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def product_from_row(row: sqlite3.Row) -> dict:
    return {
        "product_id": row["product_id"],
        "name": row["name"],
        "garment_type": row["garment_type"],
        "description": row["description"],
        "colors": json.loads(row["colors"]),
        "search_tags": json.loads(row["search_tags"]),
        "image_url": "/images/" + Path(row["image_file_path"]).name,
        "price": row["price"],
    }


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class PublicUser(BaseModel):
    """User data safe to return to the client — never includes the hash."""

    id: int
    first_name: str
    last_name: str
    email: str


@app.post("/api/auth/signup", response_model=PublicUser, status_code=201)
def signup(req: SignupRequest) -> PublicUser:
    first = req.first_name.strip()
    last = req.last_name.strip()
    email = req.email.strip().lower()

    if not first or not last:
        raise HTTPException(status_code=400, detail="First and last name are required.")
    if not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    with get_rw_db() as conn:
        exists = conn.execute(
            "SELECT 1 FROM users WHERE lower(email) = ?", (email,)
        ).fetchone()
        if exists:
            raise HTTPException(
                status_code=409,
                detail="An account with that email already exists, so it cannot be created.",
            )
        cur = conn.execute(
            """INSERT INTO users (name, email, password_hash, first_name, last_name)
               VALUES (?, ?, ?, ?, ?)""",
            (f"{first} {last}", email, hash_password(req.password), first, last),
        )
        conn.commit()
        user_id = cur.lastrowid

    return PublicUser(id=user_id, first_name=first, last_name=last, email=email)


@app.post("/api/auth/login", response_model=PublicUser)
def login(req: LoginRequest) -> PublicUser:
    email = req.email.strip().lower()
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE lower(email) = ?", (email,)
        ).fetchone()

    # Same error whether the email is unknown or the password is wrong,
    # so we don't reveal which emails have accounts.
    if row is None or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return PublicUser(
        id=row["id"],
        first_name=row["first_name"] or "",
        last_name=row["last_name"] or "",
        email=row["email"],
    )


# ---------------------------------------------------------------------------
# Chat (Handsome Dan agent)
# ---------------------------------------------------------------------------
def _format_history(history: list[ChatMessageIn], limit: int = 10) -> str:
    recent = history[-limit:]
    if not recent:
        return ""
    lines = []
    for m in recent:
        who = "Customer" if m.role == "user" else "Handsome Dan"
        lines.append(f"{who}: {m.content}")
    return "Conversation so far:\n" + "\n".join(lines) + "\n\n"


def _lookup_user(user_id: int) -> sqlite3.Row | None:
    with get_db() as conn:
        return conn.execute(
            "SELECT id, first_name, last_name, name, email FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()


def _save_message(
    user_id: int, role: str, content: str, products: list[ProductCard] | None = None
) -> None:
    products_json = (
        json.dumps([p.model_dump() for p in products]) if products else None
    )
    with get_rw_db() as conn:
        conn.execute(
            """INSERT INTO chat_messages (user_id, role, content, products_json)
               VALUES (?, ?, ?, ?)""",
            (user_id, role, content, products_json),
        )
        conn.commit()


@app.get("/api/chat/history", response_model=list[StoredChatMessage])
def chat_history(user_id: int) -> list[StoredChatMessage]:
    """Reload a logged-in customer's saved conversation when they return."""
    with get_db() as conn:
        rows = conn.execute(
            """SELECT role, content, products_json, created_at
               FROM chat_messages WHERE user_id = ? ORDER BY id""",
            (user_id,),
        ).fetchall()
    out: list[StoredChatMessage] = []
    for r in rows:
        products = []
        if r["products_json"]:
            try:
                products = [ProductCard(**p) for p in json.loads(r["products_json"])]
            except (ValueError, TypeError):
                products = []
        out.append(
            StoredChatMessage(
                role=r["role"],
                content=r["content"],
                products=products,
                created_at=r["created_at"],
            )
        )
    return out


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Import here so the API (products/auth) still starts even if the model
    # provider or API key is unavailable during development.
    from agent import ChatDeps, agent

    # Identify the customer (if logged in) so the agent knows who's chatting.
    deps = ChatDeps()
    user_row = _lookup_user(req.user_id) if req.user_id else None
    if user_row is not None:
        deps.user_name = user_row["first_name"] or user_row["name"]
        deps.user_email = user_row["email"]

    # Resolve the current page's product so vague questions map to it.
    if req.page and req.page.product_id:
        details = None
        with get_db() as conn:
            details = conn.execute(
                "SELECT product_id, name FROM catalogue WHERE product_id = ?",
                (req.page.product_id,),
            ).fetchone()
        if details is not None:
            deps.page_product_id = details["product_id"]
            deps.page_product_name = details["name"]

    prompt = _format_history(req.history) + f"Customer's new message: {message}"
    from pydantic_ai.usage import UsageLimits

    from audit import log_run

    try:
        # request_limit caps the agent's tool-call loop so it can't run forever.
        result = await agent.run(
            prompt, deps=deps, usage_limits=UsageLimits(request_limit=6)
        )
    except Exception as exc:  # noqa: BLE001 - surface a friendly error
        log_run([], stop_reason=f"error: {type(exc).__name__}", user_id=req.user_id, question=message)
        raise HTTPException(
            status_code=502,
            detail="Handsome Dan is having trouble reaching the kennel right now.",
        ) from exc

    # Append-only audit of this run: tool calls, results, and why it stopped.
    log_run(
        result.all_messages(),
        stop_reason="completed",
        user_id=req.user_id,
        question=message,
    )

    reply = result.output

    # Rank every match by units in stock (most first). The chat shows only the
    # top 4 (limited space), but the website's Products page receives ALL matches
    # so it can display every hoodie/tee/etc., not just the 4.
    all_matches = list(reply.products)
    if all_matches:
        ids = [p.product_id for p in all_matches]
        placeholders = ",".join("?" * len(ids))
        with get_db() as conn:
            stock_rows = conn.execute(
                f"SELECT product_id, SUM(quantity) AS units FROM inventory "
                f"WHERE product_id IN ({placeholders}) GROUP BY product_id",
                ids,
            ).fetchall()
        units = {r["product_id"]: (r["units"] or 0) for r in stock_rows}
        all_matches = sorted(all_matches, key=lambda p: units.get(p.product_id, 0), reverse=True)

    # Chat bubble: only the 4 best (by stock); note how many more matched.
    chat_products = all_matches[:4]
    if len(all_matches) > 4:
        extra = len(all_matches) - 4
        noun = "product" if extra == 1 else "products"
        reply.message = f"{reply.message}\n\n…and {extra} more {noun} matching this search."

    # Persist the exchange for logged-in customers so it reloads next visit.
    if user_row is not None:
        _save_message(user_row["id"], "user", message)
        _save_message(user_row["id"], "assistant", reply.message, chat_products)

    # products = the 4 shown in chat; all_products = every match for the page.
    return ChatResponse(message=reply.message, products=chat_products, all_products=all_matches)


@app.get("/api/products")
def list_products() -> list[dict]:
    from tools import categorize

    with get_db() as conn:
        rows = conn.execute("SELECT * FROM catalogue ORDER BY name").fetchall()
        # Sizes that are actually in stock (quantity > 0), per product.
        stock_rows = conn.execute(
            "SELECT product_id, size FROM inventory WHERE quantity > 0"
        ).fetchall()
    available: dict[str, list[str]] = {}
    for s in stock_rows:
        available.setdefault(s["product_id"], []).append(s["size"])
    ordered = {"XS": 0, "S": 1, "M": 2, "L": 3, "XL": 4, "XXL": 5}
    products = []
    for r in rows:
        p = product_from_row(r)
        p["category"] = categorize(r["garment_type"])
        p["available_sizes"] = sorted(
            available.get(r["product_id"], []), key=lambda x: ordered.get(x, 99)
        )
        products.append(p)
    return products


@app.get("/api/products/{product_id}")
def get_product(product_id: str) -> dict:
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM catalogue WHERE product_id = ?", (product_id,)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Product not found")
        stock = conn.execute(
            "SELECT size, quantity FROM inventory WHERE product_id = ?", (product_id,)
        ).fetchall()
    product = product_from_row(row)
    product["inventory"] = sorted(
        ({"size": s["size"], "quantity": s["quantity"]} for s in stock),
        key=lambda s: SIZE_ORDER.index(s["size"]) if s["size"] in SIZE_ORDER else 99,
    )
    return product
