use axum::{
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::state::JwtSecret;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,   // user UUID
    pub phone: String,
    pub plan: String,  // "free" | "pro"
    pub exp: usize,    // Unix timestamp de expiración
}

/// Extractor para rutas protegidas — devuelve 401 si el token falta o es inválido
pub struct AuthUser(pub Claims);

/// Extract an authenticated user from the Bearer token.
///
/// The JWT secret is pulled from the application state via `FromRef` so it is
/// loaded once at startup rather than reading `JWT_SECRET` from the environment
/// on every request (which would panic if the variable is absent).
#[axum::async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
    JwtSecret: FromRef<S>,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

        let JwtSecret(secret) = JwtSecret::from_ref(state);
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

        Ok(AuthUser(token_data.claims))
    }
}

/// Mint a signed JWT for the given user.  The caller supplies the secret so
/// this function never reads from the environment directly.
pub fn create_token(user_id: Uuid, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let exp = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::days(30))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims { sub: user_id, exp };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

