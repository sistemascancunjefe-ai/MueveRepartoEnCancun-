use axum::extract::FromRef;
use sqlx::PgPool;
use std::sync::Arc;

/// Shared application state injected into every handler.
/// `jwt_secret` is loaded once at startup rather than per-request.
/// Using `Arc<str>` ensures per-request extraction only clones the `Arc`
/// pointer rather than allocating a new `String`.
#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub jwt_secret: Arc<str>,
}

/// Allow handlers that only need the pool to keep `State<PgPool>` extractors.
impl FromRef<AppState> for PgPool {
    fn from_ref(state: &AppState) -> PgPool {
        state.pool.clone()
    }
}

/// Newtype wrapper so `AuthUser` can extract the JWT secret from any state `S`
/// that implements `FromRef<S> for JwtSecret`.
#[derive(Clone)]
pub struct JwtSecret(pub Arc<str>);

impl FromRef<AppState> for JwtSecret {
    fn from_ref(state: &AppState) -> Self {
        JwtSecret(Arc::clone(&state.jwt_secret))
    }
}
