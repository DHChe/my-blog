from uuid import UUID

from pydantic import BaseModel


class TagResponse(BaseModel):
    """Response schema for tag data."""

    id: UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}
