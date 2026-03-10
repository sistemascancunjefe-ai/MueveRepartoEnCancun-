use axum::{extract::State, http::StatusCode, Json};
use sqlx::PgPool;

use crate::models::{AuthResponse, OtpRequest, OtpVerify};
use crate::middleware::auth::create_token;
use crate::state::AppState;

/// Returns `true` if `code` is a structurally valid OTP (exactly 6 ASCII digits).
/// In production, the caller must also verify the code against a time-based store.
fn is_valid_otp_format(code: &str) -> bool {
    code.len() == 6 && code.chars().all(|c| c.is_ascii_digit())
}

pub async fn request_otp(
    State(_pool): State<PgPool>,
    Json(payload): Json<OtpRequest>,
) -> Result<StatusCode, StatusCode> {
    // Stub: En un sistema real, aquí llamarías a Twilio/WhatsApp API.
    // The phone number is logged for observability; the OTP code is never logged.
    tracing::info!("OTP requested for phone: {}", payload.phone);
    Ok(StatusCode::OK)
}

pub async fn verify_otp(
    State(state): State<AppState>,
    Json(payload): Json<OtpVerify>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Stub: In production, validate the OTP code against a time-based store
    // (e.g. Redis) and enforce rate limiting. The code is intentionally NOT
    // logged here to prevent PII/secret leakage.

    // Basic structural validation: codes must be exactly 6 ASCII digits.
    if !is_valid_otp_format(&payload.code) {
        return Err(StatusCode::UNPROCESSABLE_ENTITY);
    }

    let user_id = match sqlx::query!(
        "SELECT id FROM users WHERE phone = $1",
        payload.phone
    )
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    {
        Some(record) => record.id,
        None => {
            // Register new user
            let new_user = sqlx::query!(
                "INSERT INTO users (phone) VALUES ($1) RETURNING id",
                payload.phone
            )
            .fetch_one(&state.pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            new_user.id
        }
    };

    let token = create_token(user_id, &state.jwt_secret)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(AuthResponse { token }))
}

