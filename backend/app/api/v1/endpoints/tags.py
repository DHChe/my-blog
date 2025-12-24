from fastapi import APIRouter

from app.api.deps import DbSession
from app.crud.tag import get_tags
from app.schemas import TagResponse

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagResponse])
async def list_tags(db: DbSession) -> list[TagResponse]:
    """Get all tags.

    Args:
        db: Database session.

    Returns:
        List of all tags sorted alphabetically.
    """
    tags = await get_tags(db)
    return [TagResponse.model_validate(tag) for tag in tags]
