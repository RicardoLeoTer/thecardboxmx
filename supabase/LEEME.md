# Inventario + panel admin (Supabase)

Mientras no configures Supabase, la página sigue funcionando con el catálogo local
(`src/data/fallbackCatalog.js`). Cuando pongas las variables, lee todo de la base de datos.

## 1. Crear la base (una sola vez)
1. Crea un proyecto en supabase.com.
2. En **Authentication > Users** crea los usuarios de los dos socios (correo + contraseña).
3. En el **SQL Editor** corre, en este orden:
   - `01_schema.sql` — tablas, estados, segmentos, seguridad
   - `02_storage_y_socios.sql` — cambia antes los correos y nombres de los socios
   - `03_productos_actuales.sql` — sube los productos que ya estaban en la página

## 2. Variables de entorno
En **Supabase > Project Settings > API** copia la URL y la `anon` key.

- Local: crea `.env.local` copiando `.env.example`.
- Vercel: **Settings > Environment Variables**, agrega las dos y vuelve a desplegar.

La anon key es pública por diseño (la protegen las reglas RLS). Nunca uses la `service_role` key en la página.

## 3. Usarlo
- Tienda: `/catalogo`, `/catalogo/pokemon`, `/catalogo/deportes/mlb`, `/catalogo/ofertas`,
  filtros `?tipo=singles|gradeadas|sellado` y `?segmento=sir|full-art|parallel|autografo|rookie`.
- Panel: `/admin` (desde el celular). Inventario, alta con fotos, apartar, vender y resumen.

## Agregar cosas sin tocar código
```sql
-- Nueva liga / pestaña de deportes
insert into categories (parent_id, name, slug, sort_order) values (2, 'NHL', 'nhl', 6);
-- Nuevo segmento
insert into tags (name, slug, scope, sort_order) values ('Alt Art', 'alt-art', 'pokemon', 5);
```
