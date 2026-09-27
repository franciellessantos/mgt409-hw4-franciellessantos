"""Structured types shared by the agent, tools, and the FastAPI routes."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ProductCard(BaseModel):
    """A single product the chat widget can render as a card.

    Mirrors what the front end already knows how to show, so the same
    shape flows from the catalogue -> agent -> chat panel.
    """

    product_id: str
    name: str
    garment_type: str
    price: float
    image_url: str
    description: str = ""


class SizeStock(BaseModel):
    """Stock for one size of one product, read straight from `inventory`."""

    size: str
    quantity: int


class ProductDetails(BaseModel):
    """Full, authoritative product info the agent uses to answer questions.

    Every field comes directly from `campus_customs.db`. The agent must use
    these values verbatim and never invent prices or quantities.
    """

    product_id: str
    name: str
    garment_type: str
    description: str
    colors: list[str]
    price: float
    inventory: list[SizeStock]
    image_url: str


class StockAnswer(BaseModel):
    """Result of a stock lookup, so the agent quotes exact quantities."""

    found: bool
    product_id: str
    name: str = ""
    size: str | None = None
    in_stock: bool | None = None
    quantity: int | None = None
    sizes: list[SizeStock] = Field(default_factory=list)
    total: int | None = None


class ChatReply(BaseModel):
    """The agent's structured answer for one customer message."""

    message: str = Field(description="The assistant's reply, in Campus Customs voice.")
    products: list[ProductCard] = Field(
        default_factory=list,
        description="Products to display as cards alongside the reply (may be empty).",
    )


# ----- API request/response wrappers (what the front end sends/receives) -----
class ChatMessageIn(BaseModel):
    role: str
    content: str


class PageContext(BaseModel):
    """What the customer is currently looking at on the website."""

    product_id: str | None = None


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessageIn] = Field(default_factory=list)
    # Set when the customer is logged in, so we can save/reload their history
    # and let the agent greet them by name.
    user_id: int | None = None
    # What page/product the customer is viewing, for resolving vague questions.
    page: PageContext | None = None


class ChatResponse(BaseModel):
    # `products` = the (up to 4) best matches shown as cards in the chat bubble.
    # `all_products` = every matching product, for the website Products page.
    message: str
    products: list[ProductCard] = Field(default_factory=list)
    all_products: list[ProductCard] = Field(default_factory=list)


class StoredChatMessage(BaseModel):
    """A past chat message reloaded from the database for a returning customer."""

    role: str
    content: str
    products: list[ProductCard] = Field(default_factory=list)
    created_at: str
