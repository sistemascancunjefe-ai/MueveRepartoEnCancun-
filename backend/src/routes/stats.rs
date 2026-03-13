use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;

use crate::{middleware::device::DeviceId, models::*};

#[derive(Deserialize)]
pub struct StatsQuery {
    #[serde(default = "default_days")]
    pub days: i32,
}

fn default_days() -> i32 {
    7
}

/// GET /stats?days=7 — Estadísticas de los últimos N días (máx 90)
pub async fn get_stats(
    DeviceId(user_id): DeviceId,
    State(pool): State<PgPool>,
    Query(q): Query<StatsQuery>,
) -> Result<Json<Vec<DailyStats>>, StatusCode> {
    let days = q.days.clamp(1, 90);

    let user_uuid = uuid::Uuid::parse_str(&user_id).unwrap_or_default();
    let stats = sqlx::query_as!(
        DailyStats,
        r#"
        SELECT id, user_id::text as "user_id!", date, deliveries, 0::INT4 AS "total!",
               income, 0.0::FLOAT8 AS distance_km, 0::INT4 AS duration_min
        FROM daily_stats
        WHERE user_id = $1
          AND date >= CURRENT_DATE - ($2::integer * INTERVAL '1 day')
        ORDER BY date DESC
        "#,
        user_uuid,
        days
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(stats))
}

