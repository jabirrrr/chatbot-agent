from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from fastapi import HTTPException, status
import math

from app.models.user import User
from app.models.organization import Organization
from app.models.conversation import Conversation
from app.models.ai_usage import AIUsageRecord
from app.models.organization_member import OrganizationMember
from app.schemas.admin_overview import AdminOverviewResponse
from app.schemas.admin_users import AdminUsersResponse, AdminUserItem
from app.schemas.admin_analytics import AdminAnalyticsResponse, AnalyticsInterval, AnalyticsTimeseriesPoint

async def get_overview_metrics(db: AsyncSession) -> AdminOverviewResponse:
    # Get total organizations
    orgs_res = await db.execute(select(func.count()).select_from(Organization))
    total_orgs = orgs_res.scalar() or 0

    # Get total users
    users_res = await db.execute(select(func.count()).select_from(User))
    total_users = users_res.scalar() or 0

    # Get total conversations
    convs_res = await db.execute(select(func.count()).select_from(Conversation))
    total_convs = convs_res.scalar() or 0

    # Get total ai cost
    cost_res = await db.execute(select(func.sum(AIUsageRecord.estimated_cost_usd)))
    total_cost = cost_res.scalar() or Decimal("0.00")

    return AdminOverviewResponse(
        total_organizations=total_orgs,
        total_users=total_users,
        total_conversations=total_convs,
        total_ai_cost_usd=Decimal(str(total_cost))
    )

async def get_users_paginated(
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None
) -> AdminUsersResponse:
    if page < 1:
        page = 1
    if size < 1 or size > 100:
        size = 20

    # Base query for users
    base_query = select(User)
    
    if search:
        search_term = f"%{search}%"
        base_query = base_query.where(
            (User.email.ilike(search_term)) | 
            (User.full_name.ilike(search_term))
        )

    # Count total
    count_query = select(func.count()).select_from(base_query.subquery())
    count_res = await db.execute(count_query)
    total = count_res.scalar() or 0

    # Paginate
    offset = (page - 1) * size
    stmt = base_query.order_by(User.created_at.desc()).offset(offset).limit(size)
    result = await db.execute(stmt)
    users = result.scalars().all()

    # Get organization count for each user
    items = []
    for u in users:
        org_count_stmt = select(func.count()).select_from(OrganizationMember).where(OrganizationMember.user_id == u.id)
        org_count_res = await db.execute(org_count_stmt)
        org_count = org_count_res.scalar() or 0

        items.append(
            AdminUserItem(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                is_active=u.is_active,
                is_verified=u.is_verified,
                is_superuser=u.is_superuser,
                created_at=u.created_at,
                organization_count=org_count
            )
        )

    pages = math.ceil(total / size) if total > 0 else 1

    return AdminUsersResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

async def get_analytics_timeseries(
    db: AsyncSession,
    start_date: datetime,
    end_date: datetime,
    interval: AnalyticsInterval
) -> AdminAnalyticsResponse:
    
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be after end_date"
        )
    
    # Enforce maximum range of 365 days
    if (end_date - start_date).days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum date range allowed is 365 days"
        )
        
    # We aggregate by UTC time. Use Postgres date_trunc
    trunc_interval = interval.value
    
    # 1. New Users
    users_stmt = select(
        func.date_trunc(trunc_interval, User.created_at).label('bucket'),
        func.count().label('count')
    ).where(
        User.created_at >= start_date,
        User.created_at <= end_date
    ).group_by('bucket')
    
    users_res = await db.execute(users_stmt)
    users_data = {row.bucket.strftime('%Y-%m-%dT%H:%M:%SZ'): row.count for row in users_res.all()}

    # 2. New Organizations
    orgs_stmt = select(
        func.date_trunc(trunc_interval, Organization.created_at).label('bucket'),
        func.count().label('count')
    ).where(
        Organization.created_at >= start_date,
        Organization.created_at <= end_date
    ).group_by('bucket')
    
    orgs_res = await db.execute(orgs_stmt)
    orgs_data = {row.bucket.strftime('%Y-%m-%dT%H:%M:%SZ'): row.count for row in orgs_res.all()}

    # 3. New Conversations
    convs_stmt = select(
        func.date_trunc(trunc_interval, Conversation.created_at).label('bucket'),
        func.count().label('count')
    ).where(
        Conversation.created_at >= start_date,
        Conversation.created_at <= end_date
    ).group_by('bucket')
    
    convs_res = await db.execute(convs_stmt)
    convs_data = {row.bucket.strftime('%Y-%m-%dT%H:%M:%SZ'): row.count for row in convs_res.all()}

    # 4. AI Cost
    cost_stmt = select(
        func.date_trunc(trunc_interval, AIUsageRecord.created_at).label('bucket'),
        func.sum(AIUsageRecord.estimated_cost_usd).label('cost')
    ).where(
        AIUsageRecord.created_at >= start_date,
        AIUsageRecord.created_at <= end_date
    ).group_by('bucket')
    
    cost_res = await db.execute(cost_stmt)
    cost_data = {row.bucket.strftime('%Y-%m-%dT%H:%M:%SZ'): row.cost for row in cost_res.all()}
    
    # Merge buckets
    all_buckets = set()
    all_buckets.update(users_data.keys())
    all_buckets.update(orgs_data.keys())
    all_buckets.update(convs_data.keys())
    all_buckets.update(cost_data.keys())
    
    sorted_buckets = sorted(list(all_buckets))
    
    points = []
    for b in sorted_buckets:
        points.append(AnalyticsTimeseriesPoint(
            date=b,
            new_users=users_data.get(b, 0),
            new_organizations=orgs_data.get(b, 0),
            new_conversations=convs_data.get(b, 0),
            ai_cost_usd=Decimal(str(cost_data.get(b, 0.00)))
        ))
        
    return AdminAnalyticsResponse(
        interval=interval,
        data=points
    )
