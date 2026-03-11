use axum::{
    http::{HeaderName, HeaderValue, Method},
    routing::{delete, get, patch, post},
    Router,
};
use std::{env, net::SocketAddr, sync::Arc};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod db;
mod middleware;
mod models;
mod routes;
mod state;

use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,mueve_reparto_api=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let pool = db::create_pool().await?;

    let jwt_secret = env::var("JWT_SECRET")
        .expect("JWT_SECRET debe estar configurada");

    let resend_api_key = env::var("RESEND_API_KEY")
        .expect("RESEND_API_KEY debe estar configurada (obtener en resend.com, gratis)");

    let frontend_url = env::var("FRONTEND_URL")
        .unwrap_or_else(|_| "https://mueverepartoencancun.onrender.com".to_string());

    let allowed_origin = env::var("ALLOWED_ORIGINS")
        .unwrap_or_else(|_| frontend_url.clone());

    let app_state = AppState {
        pool,
        jwt_secret: Arc::from(jwt_secret.as_str()),
        resend_api_key: Arc::from(resend_api_key.as_str()),
        frontend_url: Arc::from(frontend_url.as_str()),
        http: reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()?,
    };

    let cors = CorsLayer::new()
        .allow_origin(allowed_origin.parse::<HeaderValue>()?)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            HeaderName::from_static("content-type"),
            HeaderName::from_static("x-device-id"),
            HeaderName::from_static("authorization"),
        ]);

    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        // ── Auth (magic link) ──
        .route("/auth/magic-link", post(routes::auth::send_magic_link))
        .route("/auth/verify",     get(routes::auth::verify_magic_link))
        // ── Stops ──
        .route("/stops",           get(routes::stops::list_stops))
        .route("/stops",           post(routes::stops::create_stop))
        .route("/stops/sync",      post(routes::stops::sync_stops))
        .route("/stops/:id",       patch(routes::stops::update_stop))
        .route("/stops/:id",       delete(routes::stops::delete_stop))
        // ── Stats ──
        .route("/stats",           get(routes::stats::get_stats))
        .route("/stats",           post(routes::stats::upsert_stats))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(app_state);

    let port = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()?;

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Mueve Reparto API escuchando en {addr}");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
