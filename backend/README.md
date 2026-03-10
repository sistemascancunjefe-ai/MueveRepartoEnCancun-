# Mueve Reparto Backend API

Backend escrito en Rust (Axum, SQLx) para el PWA Mueve Reparto.
Sincroniza y almacena paradas e información en un entorno offline-first, guardando en PostgreSQL a nivel central.

## Tecnologías Utilizadas
- **Rust**
- **Axum 0.7** y **Tower-Http** (CORS / logging)
- **SQLx** para el ORM
- **PostgreSQL** para base de datos

## Setup Local

### Prerequisitos
- Instalar Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Instalar PostgreSQL
- Opcional: Instalar `sqlx-cli` para gestionar migraciones y regenerar la caché de queries
  ```sh
  cargo install sqlx-cli --no-default-features --features postgres
  ```

### Entorno (.env)
Debe crear un archivo `.env` en la ruta `backend/.env` con las siguientes variables:
```
DATABASE_URL=postgres://usuario:password@localhost/mueve_reparto
JWT_SECRET=supersecreta123
PORT=8080
ALLOWED_ORIGINS=http://localhost:4321
```

### Ejecutar Localmente

1. Crear la base de datos (Ejemplo en Postgres local o vía `sqlx db create`)
2. Las migraciones se ejecutan automáticamente por código al iniciar `create_pool()` (está hardcodeado con `sqlx::migrate!`), por lo que no es estrictamente necesario ejecutarlas a mano en caso de no usar `sqlx-cli`.
3. Iniciar en modo desarrollo
   ```sh
   cargo run
   ```

El servidor estará en `http://localhost:8080` de manera predeterminada.

### Compilación Offline con SQLx

Este repositorio incluye un directorio `.sqlx/` con la caché de queries generada por `cargo sqlx prepare`.
Esto permite compilar sin una base de datos activa al establecer la variable de entorno:

```sh
SQLX_OFFLINE=true cargo build
```

Si se modifican queries SQL (en `src/routes/`), la caché debe regenerarse con una base de datos activa:

```sh
# Con DATABASE_URL apuntando a una BD local con las migraciones aplicadas:
cargo sqlx prepare
```

Commitea el directorio `.sqlx/` actualizado para que los demás puedan compilar offline.
