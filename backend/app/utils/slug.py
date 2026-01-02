from typing import Optional

from slugify import slugify


def generate_slug(title: str, existing_slugs: Optional[list[str]] = None) -> str:
    """Generate a URL-safe slug from a title.

    Args:
        title: The title to convert to a slug.
        existing_slugs: List of existing slugs to check for duplicates.

    Returns:
        A unique URL-safe slug.
    """
    if existing_slugs is None:
        existing_slugs = []

    base_slug = slugify(title, lowercase=True, max_length=100)

    if not base_slug:
        base_slug = "post"

    slug = base_slug
    counter = 1

    while slug in existing_slugs:
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug
