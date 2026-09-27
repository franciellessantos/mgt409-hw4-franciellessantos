"""Agent wiring: loads the system prompt, connects to our model through
Portkey, and registers the tools the agent may call.

Model: gpt-6-astra (served through the Portkey gateway using PORTKEY_API_KEY
from the root .env). The system prompt lives in prompts/prompt.md so we can
grow it without touching code.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider

import tools
from models import ChatReply, ProductCard, ProductDetails, StockAnswer


@dataclass
class ChatDeps:
    """Per-conversation context passed into the agent at run time."""

    # Who is chatting (only set when the customer is logged in).
    user_name: str | None = None
    user_email: str | None = None
    # The product page the customer is currently viewing, if any, so vague
    # questions ("what sizes?") can be resolved to that product.
    page_product_id: str | None = None
    page_product_name: str | None = None

# Load PORTKEY_API_KEY from the project-root .env (two levels up from backend/).
ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")

AGENT_MODEL = "gpt-6-astra"
PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "prompt.md"
PORTKEY_BASE_URL = "https://api.portkey.ai/v1"


def _build_model() -> OpenAIResponsesModel:
    api_key = os.environ.get("PORTKEY_API_KEY")
    if not api_key:
        raise RuntimeError(
            "PORTKEY_API_KEY is not set. Add it to the project-root .env file."
        )
    # Route OpenAI-compatible calls through the Portkey gateway.
    client = AsyncOpenAI(
        api_key=api_key,
        base_url=PORTKEY_BASE_URL,
        default_headers={
            "x-portkey-api-key": api_key,
            "x-portkey-provider": "openai",
        },
    )
    return OpenAIResponsesModel(AGENT_MODEL, provider=OpenAIProvider(openai_client=client))


def _load_system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


agent = Agent(
    _build_model(),
    output_type=ChatReply,
    deps_type=ChatDeps,
    system_prompt=_load_system_prompt(),
)


@agent.instructions
def customer_and_page_context(ctx: RunContext[ChatDeps]) -> str:
    """Inject who is chatting and what page they're on into every run."""
    deps = ctx.deps
    lines: list[str] = []
    if deps.user_name:
        who = deps.user_name
        if deps.user_email:
            who += f" ({deps.user_email})"
        lines.append(
            f"You are chatting with a logged-in customer: {who}. "
            f"You may greet them by first name. Never reveal their email or "
            f"any account details back to them beyond a friendly greeting."
        )
    else:
        lines.append("The customer is browsing as a guest (not logged in).")

    if deps.page_product_id:
        name = deps.page_product_name or deps.page_product_id
        lines.append(
            f"The customer is currently viewing the product page for "
            f'"{name}" (product_id: {deps.page_product_id}). If they ask a vague '
            f"question (e.g. about size, price, color, or stock) without naming a "
            f"product, assume they mean THIS product and call the tools with "
            f"product_id '{deps.page_product_id}'."
        )
    return "\n".join(lines)


# --- Tools available to the agent (real data only, read-only) ---------------
@agent.tool_plain
def search_products(query: str) -> list[ProductCard]:
    """Search Campus Customs products by keyword (style, color, team, occasion)."""
    return tools.search_products(query)


@agent.tool_plain
def list_products() -> list[ProductCard]:
    """List products for a customer who wants to browse the catalogue."""
    return tools.list_products()


@agent.tool_plain
def catalogue_summary() -> dict:
    """Get the exact total number of products and counts per category. Use this
    for any 'how many products / how many hoodies do you have' question."""
    return tools.catalogue_summary()


@agent.tool_plain
def get_product_details(product_id: str) -> ProductDetails | dict:
    """Get authoritative details for one product from the database: description,
    colors, exact price, and live stock for every size. Use this whenever the
    customer asks about a specific product's price, colors, or availability."""
    details = tools.get_product_details(product_id)
    return details or {"found": False, "product_id": product_id}


@agent.tool_plain
def check_stock(product_id: str, size: str | None = None) -> StockAnswer:
    """Check exact, live stock for a product from the database (optionally for a
    single size). Always use this for any availability question — never guess."""
    return tools.check_stock(product_id, size)
