"""Tools the agent can call to read real catalogue and inventory data.

Everything here reads from the SQLite database read-only, so the agent can
never change prices, stock, or accounts. These functions are the *only* source
of truth the agent should use for products, prices, and stock.
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from models import ProductCard, ProductDetails, SizeStock, StockAnswer

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "campus_customs.db"
SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"]


def _db() -> sqlite3.Connection:
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


# Map the many raw garment_type labels into a few clean categories.
CATEGORY_ORDER = ["T-Shirts", "Hoodies", "Crewnecks", "Quarter-Zips", "Jackets", "Others"]


def categorize(garment_type: str) -> str:
    g = garment_type.lower()
    if "hood" in g:  # hoodie / hooded sweatshirt / full-zip hooded
        return "Hoodies"
    if "quarter-zip" in g or "1-4-zip" in g or "1 4 zip" in g or "1/4" in g:
        return "Quarter-Zips"
    if "jacket" in g or "bomber" in g:
        return "Jackets"
    if "crew" in g or "raglan" in g or "mockneck" in g:
        return "Crewnecks"
    if "t-shirt" in g or "tee" in g or "shirt" in g:
        return "T-Shirts"
    return "Others"


def catalogue_summary() -> dict:
    """Authoritative counts of our catalogue: the exact total number of products
    and how many we carry in each category. Use this for any 'how many products
    do you have' question — never guess the number."""
    with _db() as conn:
        rows = conn.execute("SELECT garment_type FROM catalogue").fetchall()
    total = len(rows)
    by_category: dict[str, int] = {c: 0 for c in CATEGORY_ORDER}
    for r in rows:
        by_category[categorize(r["garment_type"])] += 1
    return {
        "total_products": total,
        "by_category": {k: v for k, v in by_category.items() if v > 0},
    }


def _card(row: sqlite3.Row) -> ProductCard:
    return ProductCard(
        product_id=row["product_id"],
        name=row["name"],
        garment_type=row["garment_type"],
        price=row["price"],
        image_url="/images/" + Path(row["image_file_path"]).name,
        description=row["description"],
    )


def search_products(query: str, limit: int = 30) -> list[ProductCard]:
    """Search the catalogue by keyword across name, garment type, description,
    colors, and search tags. Returns matching products (possibly empty)."""
    q = f"%{query.strip().lower()}%"
    with _db() as conn:
        rows = conn.execute(
            """SELECT * FROM catalogue
               WHERE lower(name) LIKE ?
                  OR lower(garment_type) LIKE ?
                  OR lower(description) LIKE ?
                  OR lower(colors) LIKE ?
                  OR lower(search_tags) LIKE ?
               ORDER BY name
               LIMIT ?""",
            (q, q, q, q, q, limit),
        ).fetchall()
    return [_card(r) for r in rows]


def list_products(limit: int = 12) -> list[ProductCard]:
    """List catalogue products (use when the customer wants to browse)."""
    with _db() as conn:
        rows = conn.execute("SELECT * FROM catalogue ORDER BY name LIMIT ?", (limit,)).fetchall()
    return [_card(r) for r in rows]


def _inventory_for(conn: sqlite3.Connection, product_id: str) -> list[SizeStock]:
    stock = conn.execute(
        "SELECT size, quantity FROM inventory WHERE product_id = ?", (product_id,)
    ).fetchall()
    ordered = sorted(
        stock,
        key=lambda s: SIZE_ORDER.index(s["size"]) if s["size"] in SIZE_ORDER else 99,
    )
    return [SizeStock(size=s["size"], quantity=s["quantity"]) for s in ordered]


def get_product_details(product_id: str) -> ProductDetails | None:
    """Full details for one product, including price, colors, and live stock by
    size. Returns None if the product_id is not found."""
    with _db() as conn:
        row = conn.execute(
            "SELECT * FROM catalogue WHERE product_id = ?", (product_id,)
        ).fetchone()
        if row is None:
            return None
        inv = _inventory_for(conn, product_id)
    return ProductDetails(
        product_id=row["product_id"],
        name=row["name"],
        garment_type=row["garment_type"],
        description=row["description"],
        colors=json.loads(row["colors"]),
        price=row["price"],
        inventory=inv,
        image_url="/images/" + Path(row["image_file_path"]).name,
    )


def check_stock(product_id: str, size: str | None = None) -> StockAnswer:
    """Check live stock for a product. If `size` is given, report that size;
    otherwise report every size. Always use this for stock questions — never
    guess availability."""
    details = get_product_details(product_id)
    if details is None:
        return StockAnswer(found=False, product_id=product_id)
    inv = details.inventory
    if size:
        size = size.strip().upper()
        match = next((s for s in inv if s.size == size), None)
        return StockAnswer(
            found=True,
            product_id=product_id,
            name=details.name,
            size=size,
            in_stock=bool(match and match.quantity > 0),
            quantity=match.quantity if match else 0,
        )
    return StockAnswer(
        found=True,
        product_id=product_id,
        name=details.name,
        sizes=inv,
        total=sum(s.quantity for s in inv),
    )
