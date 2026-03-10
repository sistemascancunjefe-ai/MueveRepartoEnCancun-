use axum::extract::FromRef;
use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub jwt_secret: Arc<str>,
    pub resend_api_key: Arc<str>,
    pub frontend_url: Arc<str>,
    pub http: reqwest::Client,
}

impl FromRef<AppState> for PgPool {
    fn from_ref(state: &AppState) -> PgPool {
        state.pool.clone()
    }
}

#[derive(Clone)]
pub struct JwtSecret(pub Arc<str>);

impl FromRef<AppState> for JwtSecret {
    fn from_ref(state: &AppState) -> Self {
        JwtSecret(Arc::clone(&state.jwt_secret))
    }
}
