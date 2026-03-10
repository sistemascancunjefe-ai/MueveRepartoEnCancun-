use axum::{extract::State, http::StatusCode, Json};
use chrono::Utc;
use hex;
use jsonwebtoken::{encode, EncodingKey, Header};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::PgPool;

use crate::models::{AuthResponse, OtpRequest, OtpVerify};
use crate::middleware::auth::create_token;
use crate::state::AppState;

/// Returns `true` if `code` is a structurally valid OTP (exactly 6 ASCII digits).
/// In production, the caller must also verify the code against a time-based store.
fn is_valid_otp_format(code: &str) -> bool {
    code.len() == 6 && code.chars().all(|c| c.is_ascii_digit())
}

/// Returns a masked representation of a phone number where, if the number
/// is longer than 4 characters, all but the last 4 characters are replaced
/// with '*'. Shorter numbers are returned unchanged.
fn mask_phone(phone: &str) -> String {
    let len = phone.chars().count();
    if len <= 4 {
        return phone.to_string();
    }
    let mask_len = len - 4;
    let masked_prefix = "*".repeat(mask_len);
    let suffix: String = phone.chars().skip(mask_len).collect();
    format!("{}{}", masked_prefix, suffix)
}

pub async fn request_otp(
    State(_pool): State<PgPool>,
    Json(payload): Json<OtpRequest>,
) -> Result<StatusCode, StatusCode> {
    // Stub: En un sistema real, aquí llamarías a Twilio/WhatsApp API.
    // The phone number is logged for observability; the OTP code is never logged.
    tracing::info!("OTP requested for phone: {}", mask_phone(&payload.phone));
    Ok(StatusCode::OK)
}

/// POST /auth/verify-otp
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

/// GET /auth/me — requiere JWT
pub async fn me(AuthUser(claims): AuthUser) -> Json<MeResponse> {
    Json(MeResponse {
        user_id: claims.sub,
        phone: claims.phone,
        plan: claims.plan,
    })
}

