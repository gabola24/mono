from __future__ import annotations
import uuid
from datetime import datetime, timezone
from pathlib import Path

import sqlalchemy as sa
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session, references
from app.db.vectorstore import add_reference, delete_reference, reference_count
from app.models.reference import TextReferenceRequest, ReferenceResponse, ReferenceStats
from app.services.embeddings import embed_text, describe_image
from app.services.skill_discovery import process_skill_discovery

router = APIRouter(tags=["references"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def _trust_level(count: int) -> float:
    if count == 0:
        return 0.0
    if count <= 5:
        return 0.2
    if count <= 15:
        return 0.4
    if count <= 30:
        return 0.6
    if count <= 50:
        return 0.8
    return 1.0


@router.post("/references/text", response_model=ReferenceResponse)
async def add_text_reference(
    req: TextReferenceRequest, session: AsyncSession = Depends(get_session)
):
    ref_id = str(uuid.uuid4())
    title = req.title or req.content[:60].strip()
    now = datetime.now(timezone.utc)

    embedding = await embed_text(req.content)
    add_reference(
        ref_id=ref_id,
        embedding=embedding,
        document=req.content,
        metadata={"type": "text", "title": title, "created_at": now.isoformat()},
    )

    await session.execute(
        references.insert().values(
            id=ref_id,
            type="text",
            title=title,
            content=req.content,
            file_path=None,
            created_at=now,
        )
    )
    await session.commit()

    await process_skill_discovery(session, req.content)

    return ReferenceResponse(
        id=ref_id, type="text", title=title, content=req.content, created_at=now.isoformat()
    )


@router.post("/references/image", response_model=ReferenceResponse)
async def add_image_reference(
    file: UploadFile = File(...),
    title: str = Form(""),
    session: AsyncSession = Depends(get_session),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        from fastapi import HTTPException

        raise HTTPException(400, f"Unsupported image type: {file.content_type}")

    ref_id = str(uuid.uuid4())
    ext = file.filename.rsplit(".", 1)[-1] if file.filename else "jpg"
    file_path = UPLOAD_DIR / f"{ref_id}.{ext}"
    file_path.write_bytes(await file.read())

    description = await describe_image(str(file_path))
    title = title or f"Image: {file.filename or 'upload'}"
    now = datetime.now(timezone.utc)

    embedding = await embed_text(description)
    add_reference(
        ref_id=ref_id,
        embedding=embedding,
        document=description,
        metadata={"type": "image", "title": title, "created_at": now.isoformat()},
    )

    await session.execute(
        references.insert().values(
            id=ref_id,
            type="image",
            title=title,
            content=description,
            file_path=str(file_path),
            created_at=now,
        )
    )
    await session.commit()

    await process_skill_discovery(session, description)

    return ReferenceResponse(
        id=ref_id,
        type="image",
        title=title,
        content=description,
        file_path=f"/uploads/{ref_id}.{ext}",
        created_at=now.isoformat(),
    )


@router.get("/references", response_model=list[ReferenceResponse])
async def list_references(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        sa.select(references).order_by(references.c.created_at.desc())
    )
    return [
        ReferenceResponse(
            id=row.id,
            type=row.type,
            title=row.title,
            content=row.content,
            file_path=f"/uploads/{Path(row.file_path).name}" if row.file_path else None,
            created_at=str(row.created_at),
        )
        for row in result.fetchall()
    ]


@router.delete("/references/{ref_id}")
async def remove_reference(ref_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        sa.select(references.c.file_path).where(references.c.id == ref_id)
    )
    row = result.fetchone()
    if row and row.file_path:
        fp = Path(row.file_path)
        if fp.exists():
            fp.unlink()

    await session.execute(sa.delete(references).where(references.c.id == ref_id))
    await session.commit()
    delete_reference(ref_id)
    return {"status": "deleted"}


@router.get("/references/stats", response_model=ReferenceStats)
async def get_stats(session: AsyncSession = Depends(get_session)):
    total = reference_count()
    text_result = await session.execute(
        sa.select(sa.func.count()).where(references.c.type == "text")
    )
    image_result = await session.execute(
        sa.select(sa.func.count()).where(references.c.type == "image")
    )
    return ReferenceStats(
        total_count=total,
        text_count=text_result.scalar() or 0,
        image_count=image_result.scalar() or 0,
        trust_level=_trust_level(total),
    )
