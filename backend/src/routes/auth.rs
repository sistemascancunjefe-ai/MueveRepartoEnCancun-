use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use chrono::Utc;
use hex;
use rand::Rng;
use serde_json::json;
use sha2::{Digest, Sha256};

use crate::middleware::auth::create_token;
use crate::models::{AuthResponse, MagicLinkRequest, MagicLinkSent, VerifyQuery};
use crate::state::AppState;

/// POST /auth/magic-link — envía email con enlace de acceso único
pub async fn send_magic_link(
    State(state): State<AppState>,
    Json(payload): Json<MagicLinkRequest>,
) -> Result<Json<MagicLinkSent>, StatusCode> {
    let email = payload.email.trim().to_lowercase();

    // Validación básica
    if !email.contains('@') || email.len() < 5 || email.len() > 254 {
        return Err(StatusCode::UNPROCESSABLE_ENTITY);
    }

    // Rate limit: máx 3 solicitudes por email por hora
    let recent: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM magic_tokens \
         WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'",
        email
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .unwrap_or(0);

    if recent >= 3 {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    // Limpiar tokens expirados del mismo email (housekeeping)
    let _ = sqlx::query!(
        "DELETE FROM magic_tokens WHERE email = $1 AND expires_at < NOW()",
        email
    )
    .execute(&state.pool)
    .await;

    // Token aleatorio seguro: 40 bytes alfanuméricos
    let raw_token: String = rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(40)
        .map(char::from)
        .collect();

    let token_hash = hex::encode(Sha256::digest(raw_token.as_bytes()));
    let expires_at = Utc::now() + chrono::Duration::minutes(15);

    sqlx::query!(
        "INSERT INTO magic_tokens (email, token_hash, expires_at) VALUES ($1, $2, $3)",
        email,
        token_hash,
        expires_at
    )
    .execute(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Enviar email via Resend
    let verify_url = format!("{}/auth/verify?token={}", state.frontend_url, raw_token);

    let email_html = format!(
        r#"<div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;background:#060A0E;color:#E2E8F0;border-radius:12px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
    <span style="font-size:1.5rem;font-weight:900;color:#00E8A2">Mueve Reparto</span>
  </div>
  <h2 style="font-size:1.125rem;font-weight:700;margin:0 0 8px;color:#E2E8F0">
    Tu enlace de acceso
  </h2>
  <p style="color:#94A3B8;font-size:0.9rem;margin:0 0 24px;line-height:1.6">
    Haz clic en el botón para entrar a tu cuenta de repartidor.
    Este enlace expira en <strong style="color:#E2E8F0">15 minutos</strong>.
  </p>
  <a href="{verify_url}"
     style="display:inline-block;background:#00E8A2;color:#060A0E;
            padding:13px 28px;border-radius:8px;font-weight:800;
            font-size:0.9375rem;text-decoration:none;letter-spacing:-0.01em">
    Entrar a mi cuenta →
  </a>
  <p style="color:#475569;font-size:0.8rem;margin:24px 0 0;line-height:1.5">
    Si no solicitaste este acceso, ignora este correo — tu cuenta está segura.<br>
    El enlace solo funciona una vez.
  </p>
</div>"#
    );

    let body = json!({
        "from": "Mueve Reparto <onboarding@resend.dev>",
        "to": [email],
        "subject": "Entra a Mueve Reparto",
        "html": email_html,
    });

    let res = state
        .http
        .post("https://api.resend.com/emails")
        .bearer_auth(state.resend_api_key.as_ref())
        .json(&body)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Resend HTTP error: {e}");
            StatusCode::BAD_GATEWAY
        })?;

    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        tracing::error!("Resend API {status}: {body}");
        return Err(StatusCode::BAD_GATEWAY);
    }

    tracing::info!("Magic link enviado a {}", mask_email(&email));
    Ok(Json(MagicLinkSent { message: "ok".into() }))
}

/// GET /auth/verify?token=xxx — valida el token y devuelve JWT
pub async fn verify_magic_link(
    State(state): State<AppState>,
    Query(params): Query<VerifyQuery>,
) -> Result<Json<AuthResponse>, StatusCode> {
    if params.token.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let token_hash = hex::encode(Sha256::digest(params.token.as_bytes()));

    let record = sqlx::query!(
        "SELECT id, email, expires_at, used \
         FROM magic_tokens \
         WHERE token_hash = $1 AND used = FALSE AND expires_at > NOW()",
        token_hash
    )
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::UNAUTHORIZED)?;

    // Marcar token como usado (idempotente si se llama dos veces)
    sqlx::query!("UPDATE magic_tokens SET used = TRUE WHERE id = $1", record.id)
        .execute(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Upsert usuario por email
    let user = sqlx::query!(
        "INSERT INTO users (email) VALUES ($1) \
         ON CONFLICT (email) DO UPDATE SET updated_at = NOW() \
         RETURNING id, COALESCE(plan, 'free') AS plan",
        record.email
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let plan = user.plan.unwrap_or_else(|| "free".to_string());
    let jwt = create_token(user.id, &record.email, &plan, &state.jwt_secret)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    tracing::info!("Login exitoso: {}", mask_email(&record.email));

    Ok(Json(AuthResponse {
        token: jwt,
        plan,
        user_id: user.id.to_string(),
        email: record.email,
    }))
}

fn mask_email(email: &str) -> String {
    if let Some((local, domain)) = email.split_once('@') {
        let visible = local.chars().take(2).collect::<String>();
        format!("{}***@{}", visible, domain)
    } else {
        "***".to_string()
    }
}
