-- WEARO / Fashion Dream Try-On Shop
-- Extended live-schema reference snapshot generated from Supabase catalog on 2026-10-21.
-- REFERENCE ONLY: this is not a migration and must not be executed against production.
-- Exact historical migration bodies remain authoritative for replay and change tracking.
-- Includes table columns, constraints, indexes, RLS enablement, and current public-table policies.

-- -----------------------------------------------------------------------------
-- public.ai_usage_daily
-- -----------------------------------------------------------------------------
create table if not exists public."ai_usage_daily" (
  "usage_date" date default CURRENT_DATE not null,
  "client_key" text not null,
  "job_count" integer default 0 not null,
  "success_count" integer default 0 not null,
  "failure_count" integer default 0 not null,
  "updated_at" timestamp with time zone default now() not null,
  constraint "ai_usage_daily_failure_count_check" CHECK ((failure_count >= 0)),
  constraint "ai_usage_daily_job_count_check" CHECK ((job_count >= 0)),
  constraint "ai_usage_daily_pkey" PRIMARY KEY (usage_date, client_key),
  constraint "ai_usage_daily_success_count_check" CHECK ((success_count >= 0))
);
alter table public."ai_usage_daily" enable row level security;
CREATE INDEX ai_usage_daily_client_date_idx ON public.ai_usage_daily USING btree (client_key, usage_date DESC);
CREATE UNIQUE INDEX ai_usage_daily_pkey ON public.ai_usage_daily USING btree (usage_date, client_key);
create policy "service role can manage ai usage" on public."ai_usage_daily" as permissive for all to service_role using (true) with check (true);

-- -----------------------------------------------------------------------------
-- public.appearance_branding
-- -----------------------------------------------------------------------------
create table if not exists public."appearance_branding" (
  "id" text default 'global'::text not null,
  "brand_name" text default 'WEARO'::text not null,
  "monogram" text default 'WO'::text not null,
  "social_title" text default 'WEARO — AI Try-On'::text not null,
  "social_description" text default 'Wear it your way with AI-powered virtual try-on.'::text not null,
  "updated_at" timestamp with time zone default now() not null,
  "favicon_url" text,
  constraint "appearance_branding_pkey" PRIMARY KEY (id)
);
alter table public."appearance_branding" enable row level security;
CREATE UNIQUE INDEX appearance_branding_pkey ON public.appearance_branding USING btree (id);
create policy "Admins can insert appearance branding" on public."appearance_branding" as permissive for insert to authenticated with check (is_admin());
create policy "Admins can read appearance branding" on public."appearance_branding" as permissive for select to authenticated using (is_admin());
create policy "Admins can update appearance branding" on public."appearance_branding" as permissive for update to authenticated using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- public.appearance_palettes
-- -----------------------------------------------------------------------------
create table if not exists public."appearance_palettes" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "primary_color" text not null,
  "secondary_color" text not null,
  "background_color" text not null,
  "surface_color" text not null,
  "accent_color" text not null,
  "foreground_color" text not null,
  "created_by" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "status" text default 'draft'::text not null,
  "archived_at" timestamp with time zone,
  constraint "appearance_palettes_accent_color_check" CHECK ((accent_color ~ '^#[0-9A-Fa-f]{6}$'::text)),
  constraint "appearance_palettes_background_color_check" CHECK ((background_color ~ '^#[0-9A-Fa-f]{6}$'::text)),
  constraint "appearance_palettes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint "appearance_palettes_foreground_color_check" CHECK ((foreground_color ~ '^#[0-9A-Fa-f]{6}$'::text)),
  constraint "appearance_palettes_name_check" CHECK (((char_length(TRIM(BOTH FROM name)) >= 1) AND (char_length(TRIM(BOTH FROM name)) <= 80))),
  constraint "appearance_palettes_pkey" PRIMARY KEY (id),
  constraint "appearance_palettes_primary_color_check" CHECK ((primary_color ~ '^#[0-9A-Fa-f]{6}$'::text)),
  constraint "appearance_palettes_secondary_color_check" CHECK ((secondary_color ~ '^#[0-9A-Fa-f]{6}$'::text)),
  constraint "appearance_palettes_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'archived'::text]))),
  constraint "appearance_palettes_surface_color_check" CHECK ((surface_color ~ '^#[0-9A-Fa-f]{6}$'::text))
);
alter table public."appearance_palettes" enable row level security;
CREATE INDEX appearance_palettes_created_at_idx ON public.appearance_palettes USING btree (created_at DESC);
CREATE INDEX appearance_palettes_created_by_idx ON public.appearance_palettes USING btree (created_by);
CREATE INDEX appearance_palettes_name_idx ON public.appearance_palettes USING btree (lower(name));
CREATE UNIQUE INDEX appearance_palettes_pkey ON public.appearance_palettes USING btree (id);
CREATE INDEX appearance_palettes_status_idx ON public.appearance_palettes USING btree (status, updated_at DESC);
create policy "Admins can create appearance palettes" on public."appearance_palettes" as permissive for insert to authenticated with check ((( SELECT is_admin() AS is_admin) AND (( SELECT auth.uid() AS uid) = created_by)));
create policy "Admins can delete appearance palettes" on public."appearance_palettes" as permissive for delete to authenticated using (( SELECT is_admin() AS is_admin));
create policy "Admins can read appearance palettes" on public."appearance_palettes" as permissive for select to authenticated using (( SELECT is_admin() AS is_admin));
create policy "Admins can update appearance palettes" on public."appearance_palettes" as permissive for update to authenticated using (( SELECT is_admin() AS is_admin)) with check (( SELECT is_admin() AS is_admin));

-- -----------------------------------------------------------------------------
-- public.appearance_themes
-- -----------------------------------------------------------------------------
create table if not exists public."appearance_themes" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "scope" text default 'global'::text not null,
  "status" text default 'draft'::text not null,
  "theme_data" jsonb not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "published_at" timestamp with time zone,
  constraint "appearance_themes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint "appearance_themes_pkey" PRIMARY KEY (id),
  constraint "appearance_themes_scope_check" CHECK ((scope = 'global'::text)),
  constraint "appearance_themes_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);
alter table public."appearance_themes" enable row level security;
CREATE INDEX appearance_themes_created_by_idx ON public.appearance_themes USING btree (created_by);
CREATE UNIQUE INDEX appearance_themes_pkey ON public.appearance_themes USING btree (id);
CREATE UNIQUE INDEX appearance_themes_published_scope_uidx ON public.appearance_themes USING btree (scope) WHERE (status = 'published'::text);
CREATE INDEX appearance_themes_updated_at_idx ON public.appearance_themes USING btree (updated_at DESC);
create policy "Admins can create appearance themes" on public."appearance_themes" as permissive for insert to authenticated with check ((( SELECT is_admin() AS is_admin) AND ((created_by IS NULL) OR (( SELECT auth.uid() AS uid) = created_by))));
create policy "Admins can delete appearance themes" on public."appearance_themes" as permissive for delete to authenticated using (( SELECT is_admin() AS is_admin));
create policy "Admins can read all appearance themes" on public."appearance_themes" as permissive for select to authenticated using (is_admin());
create policy "Admins can update appearance themes" on public."appearance_themes" as permissive for update to authenticated using (( SELECT is_admin() AS is_admin)) with check (( SELECT is_admin() AS is_admin));
create policy "Public can read published appearance theme" on public."appearance_themes" as permissive for select to anon, authenticated using ((status = 'published'::text));

-- -----------------------------------------------------------------------------
-- public.cart_items
-- -----------------------------------------------------------------------------
create table if not exists public."cart_items" (
  "id" uuid default gen_random_uuid() not null,
  "cart_id" uuid not null,
  "variant_id" uuid not null,
  "quantity" integer not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  constraint "cart_items_cart_id_fkey" FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  constraint "cart_items_cart_id_variant_id_key" UNIQUE (cart_id, variant_id),
  constraint "cart_items_pkey" PRIMARY KEY (id),
  constraint "cart_items_quantity_check" CHECK (((quantity > 0) AND (quantity <= 99))),
  constraint "cart_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
);
alter table public."cart_items" enable row level security;
CREATE INDEX cart_items_cart_id_idx ON public.cart_items USING btree (cart_id);
CREATE UNIQUE INDEX cart_items_cart_id_variant_id_key ON public.cart_items USING btree (cart_id, variant_id);
CREATE UNIQUE INDEX cart_items_pkey ON public.cart_items USING btree (id);
CREATE INDEX cart_items_variant_id_idx ON public.cart_items USING btree (variant_id);
create policy "users manage own cart items" on public."cart_items" as permissive for all to authenticated using ((EXISTS ( SELECT 1
   FROM carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))) with check ((EXISTS ( SELECT 1
   FROM carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));

-- -----------------------------------------------------------------------------
-- public.carts
-- -----------------------------------------------------------------------------
create table if not exists public."carts" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  constraint "carts_pkey" PRIMARY KEY (id),
  constraint "carts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint "carts_user_id_key" UNIQUE (user_id)
);
alter table public."carts" enable row level security;
CREATE UNIQUE INDEX carts_pkey ON public.carts USING btree (id);
CREATE INDEX carts_user_id_idx ON public.carts USING btree (user_id);
CREATE UNIQUE INDEX carts_user_id_key ON public.carts USING btree (user_id);
create policy "users manage own carts" on public."carts" as permissive for all to authenticated using ((( SELECT auth.uid() AS uid) = user_id)) with check ((( SELECT auth.uid() AS uid) = user_id));

-- -----------------------------------------------------------------------------
-- public.inventory_movements
-- -----------------------------------------------------------------------------
create table if not exists public."inventory_movements" (
  "id" uuid default gen_random_uuid() not null,
  "variant_id" uuid not null,
  "delta" integer not null,
  "stock_before" integer not null,
  "stock_after" integer not null,
  "reason" text not null,
  "order_id" uuid,
  "actor_user_id" uuid,
  "metadata" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null,
  constraint "inventory_movements_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint "inventory_movements_delta_check" CHECK ((delta <> 0)),
  constraint "inventory_movements_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  constraint "inventory_movements_pkey" PRIMARY KEY (id),
  constraint "inventory_movements_reason_check" CHECK ((reason = ANY (ARRAY['sale'::text, 'manual_adjustment'::text, 'restock'::text, 'return'::text, 'correction'::text]))),
  constraint "inventory_movements_stock_after_check" CHECK ((stock_after >= 0)),
  constraint "inventory_movements_stock_before_check" CHECK ((stock_before >= 0)),
  constraint "inventory_movements_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
);
alter table public."inventory_movements" enable row level security;
CREATE INDEX inventory_movements_actor_user_id_idx ON public.inventory_movements USING btree (actor_user_id);
CREATE INDEX inventory_movements_order_idx ON public.inventory_movements USING btree (order_id) WHERE (order_id IS NOT NULL);
CREATE UNIQUE INDEX inventory_movements_pkey ON public.inventory_movements USING btree (id);
CREATE INDEX inventory_movements_variant_created_idx ON public.inventory_movements USING btree (variant_id, created_at DESC);
create policy "backoffice can read inventory movements" on public."inventory_movements" as permissive for select to authenticated using (( SELECT has_backoffice_role('staff'::app_role) AS has_backoffice_role));

-- -----------------------------------------------------------------------------
-- public.journal_articles
-- -----------------------------------------------------------------------------
create table if not exists public."journal_articles" (
  "id" uuid default gen_random_uuid() not null,
  "title" text not null,
  "slug" text not null,
  "category" text default 'STYLE GUIDE'::text not null,
  "excerpt" text default ''::text not null,
  "content" text default ''::text not null,
  "image_url" text,
  "seo_title" text default ''::text not null,
  "seo_description" text default ''::text not null,
  "status" text default 'draft'::text not null,
  "scheduled_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  constraint "journal_articles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id),
  constraint "journal_articles_pkey" PRIMARY KEY (id),
  constraint "journal_articles_slug_key" UNIQUE (slug),
  constraint "journal_articles_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'scheduled'::text]))),
  constraint "journal_scheduled_requires_date" CHECK (((status <> 'scheduled'::text) OR (scheduled_at IS NOT NULL)))
);
alter table public."journal_articles" enable row level security;
CREATE UNIQUE INDEX journal_articles_pkey ON public.journal_articles USING btree (id);
CREATE INDEX journal_articles_published_at_idx ON public.journal_articles USING btree (published_at DESC);
CREATE INDEX journal_articles_scheduled_at_idx ON public.journal_articles USING btree (scheduled_at);
CREATE UNIQUE INDEX journal_articles_slug_key ON public.journal_articles USING btree (slug);
CREATE INDEX journal_articles_status_idx ON public.journal_articles USING btree (status);
create policy "Admins can create journal articles" on public."journal_articles" as permissive for insert to authenticated with check ((( SELECT is_admin() AS is_admin) AND ((created_by IS NULL) OR (( SELECT auth.uid() AS uid) = created_by))));
create policy "Admins can delete journal articles" on public."journal_articles" as permissive for delete to authenticated using (( SELECT is_admin() AS is_admin));
create policy "Admins can read all journal articles" on public."journal_articles" as permissive for select to authenticated using (( SELECT is_admin() AS is_admin));
create policy "Admins can update journal articles" on public."journal_articles" as permissive for update to authenticated using (( SELECT is_admin() AS is_admin)) with check (( SELECT is_admin() AS is_admin));
create policy "Public can read published journal articles" on public."journal_articles" as permissive for select to anon, authenticated using (((status = 'published'::text) OR ((status = 'scheduled'::text) AND (scheduled_at IS NOT NULL) AND (scheduled_at <= now()))));

-- -----------------------------------------------------------------------------
-- public.product_reviews
-- -----------------------------------------------------------------------------
create table if not exists public."product_reviews" (
  "id" uuid default gen_random_uuid() not null,
  "product_id" text not null,
  "user_id" uuid not null,
  "rating" integer not null,
  "title" text,
  "body" text not null,
  "status" text default 'published'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  constraint "product_reviews_body_check" CHECK (((char_length(TRIM(BOTH FROM body)) >= 3) AND (char_length(TRIM(BOTH FROM body)) <= 2000))),
  constraint "product_reviews_pkey" PRIMARY KEY (id),
  constraint "product_reviews_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  constraint "product_reviews_product_id_user_id_key" UNIQUE (product_id, user_id),
  constraint "product_reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))),
  constraint "product_reviews_status_check" CHECK ((status = ANY (ARRAY['published'::text, 'hidden'::text]))),
  constraint "product_reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public."product_reviews" enable row level security;
CREATE UNIQUE INDEX product_reviews_pkey ON public.product_reviews USING btree (id);
CREATE UNIQUE INDEX product_reviews_product_id_user_id_key ON public.product_reviews USING btree (product_id, user_id);
CREATE INDEX product_reviews_product_idx ON public.product_reviews USING btree (product_id, created_at DESC);
CREATE INDEX product_reviews_user_idx ON public.product_reviews USING btree (user_id, created_at DESC);
create policy "product reviews delete own or backoffice" on public."product_reviews" as permissive for delete to authenticated using (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT has_backoffice_role('staff'::app_role) AS has_backoffice_role)));
create policy "product reviews insert verified buyer or backoffice" on public."product_reviews" as permissive for insert to authenticated with check ((( SELECT has_backoffice_role('staff'::app_role) AS has_backoffice_role) OR ((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1
   FROM (order_items oi
     JOIN orders o ON ((o.id = oi.order_id)))
  WHERE ((oi.product_id = product_reviews.product_id) AND (o.user_id = ( SELECT auth.uid() AS uid)) AND ((o.payment_status = 'paid'::text) OR (o.order_status = 'completed'::text))))))));
create policy "product reviews select published or backoffice" on public."product_reviews" as permissive for select to anon, authenticated using (((status = 'published'::text) OR ( SELECT has_backoffice_role('staff'::app_role) AS has_backoffice_role)));
create policy "product reviews update own or backoffice" on public."product_reviews" as permissive for update to authenticated using (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT has_backoffice_role('staff'::app_role) AS has_backoffice_role))) with check (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT has_backoffice_role('staff'::app_role) AS has_backoffice_role)));

-- -----------------------------------------------------------------------------
-- public.product_tags
-- -----------------------------------------------------------------------------
create table if not exists public."product_tags" (
  "product_id" text not null,
  "tag_id" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  constraint "product_tags_pkey" PRIMARY KEY (product_id, tag_id),
  constraint "product_tags_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  constraint "product_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
alter table public."product_tags" enable row level security;
CREATE UNIQUE INDEX product_tags_pkey ON public.product_tags USING btree (product_id, tag_id);
CREATE INDEX product_tags_tag_id_idx ON public.product_tags USING btree (tag_id);
create policy "Admins can create product tags" on public."product_tags" as permissive for insert to public with check (is_admin());
create policy "Admins can delete product tags" on public."product_tags" as permissive for delete to public using (is_admin());
create policy "Admins can read product tags" on public."product_tags" as permissive for select to public using (is_admin());

-- -----------------------------------------------------------------------------
-- public.site_content_settings
-- -----------------------------------------------------------------------------
create table if not exists public."site_content_settings" (
  "id" text default 'global'::text not null,
  "announcement_enabled" boolean default false not null,
  "announcement_text" text default ''::text not null,
  "hero_eyebrow" text default 'WEARO / 2026'::text not null,
  "hero_title" text default 'Mặc theo cách của riêng bạn'::text not null,
  "hero_description" text default 'Discover a wardrobe shaped around your identity.'::text not null,
  "hero_cta_label" text default 'EXPLORE COLLECTION'::text not null,
  "hero_cta_url" text default '/shop'::text not null,
  "social_title" text default 'WEARO — Wear it your way'::text not null,
  "social_description" text default 'Modern unisex fashion with AI-powered try-on.'::text not null,
  "favicon_url" text,
  "social_image_url" text,
  "updated_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "draft_content" jsonb,
  "published_content" jsonb,
  constraint "site_content_settings_pkey" PRIMARY KEY (id),
  constraint "site_content_settings_singleton" CHECK ((id = 'global'::text))
);
alter table public."site_content_settings" enable row level security;
CREATE UNIQUE INDEX site_content_settings_pkey ON public.site_content_settings USING btree (id);
CREATE INDEX site_content_settings_updated_at_idx ON public.site_content_settings USING btree (updated_at DESC);
create policy "site_content_settings_admin_insert" on public."site_content_settings" as permissive for insert to authenticated with check ((( SELECT is_admin() AS is_admin) AND (( SELECT auth.uid() AS uid) = updated_by)));
create policy "site_content_settings_admin_update" on public."site_content_settings" as permissive for update to authenticated using (( SELECT is_admin() AS is_admin)) with check (( SELECT is_admin() AS is_admin));
create policy "site_content_settings_public_read" on public."site_content_settings" as permissive for select to anon, authenticated using (true);

-- -----------------------------------------------------------------------------
-- public.site_theme_settings
-- -----------------------------------------------------------------------------
create table if not exists public."site_theme_settings" (
  "id" text default 'global'::text not null,
  "primary_color" text not null,
  "secondary_color" text not null,
  "background_color" text not null,
  "surface_color" text not null,
  "accent_color" text not null,
  "foreground_color" text not null,
  "updated_at" timestamp with time zone default now() not null,
  "updated_by" uuid,
  constraint "site_theme_settings_pkey" PRIMARY KEY (id),
  constraint "site_theme_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
alter table public."site_theme_settings" enable row level security;
CREATE UNIQUE INDEX site_theme_settings_pkey ON public.site_theme_settings USING btree (id);
CREATE INDEX site_theme_settings_updated_by_idx ON public.site_theme_settings USING btree (updated_by);
create policy "Admins can insert global theme" on public."site_theme_settings" as permissive for insert to authenticated with check (((id = 'global'::text) AND is_admin_user()));
create policy "Admins can update global theme" on public."site_theme_settings" as permissive for update to authenticated using (((id = 'global'::text) AND is_admin_user())) with check (((id = 'global'::text) AND is_admin_user()));
create policy "Public can read global theme" on public."site_theme_settings" as permissive for select to anon, authenticated using ((id = 'global'::text));

-- -----------------------------------------------------------------------------
-- public.tags
-- -----------------------------------------------------------------------------
create table if not exists public."tags" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "slug" text not null,
  "description" text,
  "status" text default 'active'::text not null,
  "created_by" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "archived_at" timestamp with time zone,
  constraint "tags_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id),
  constraint "tags_name_check" CHECK (((char_length(TRIM(BOTH FROM name)) >= 1) AND (char_length(TRIM(BOTH FROM name)) <= 60))),
  constraint "tags_pkey" PRIMARY KEY (id),
  constraint "tags_slug_check" CHECK ((slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
  constraint "tags_slug_key" UNIQUE (slug),
  constraint "tags_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);
alter table public."tags" enable row level security;
CREATE INDEX tags_created_by_idx ON public.tags USING btree (created_by);
CREATE INDEX tags_name_idx ON public.tags USING btree (name);
CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);
CREATE UNIQUE INDEX tags_slug_key ON public.tags USING btree (slug);
CREATE INDEX tags_status_idx ON public.tags USING btree (status);
create policy "Admins can create tags" on public."tags" as permissive for insert to authenticated with check ((( SELECT is_admin() AS is_admin) AND (( SELECT auth.uid() AS uid) = created_by)));
create policy "Admins can delete tags" on public."tags" as permissive for delete to authenticated using (( SELECT is_admin() AS is_admin));
create policy "Admins can read tags" on public."tags" as permissive for select to authenticated using (( SELECT is_admin() AS is_admin));
create policy "Admins can update tags" on public."tags" as permissive for update to authenticated using (( SELECT is_admin() AS is_admin)) with check (( SELECT is_admin() AS is_admin));

-- -----------------------------------------------------------------------------
-- public.user_roles
-- -----------------------------------------------------------------------------
create table if not exists public."user_roles" (
  "user_id" uuid not null,
  "role" app_role default 'customer'::app_role not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  constraint "user_roles_pkey" PRIMARY KEY (user_id),
  constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public."user_roles" enable row level security;
CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (user_id);
create policy "admins can delete user roles" on public."user_roles" as permissive for delete to authenticated using (( SELECT is_admin() AS is_admin));
create policy "admins can insert user roles" on public."user_roles" as permissive for insert to authenticated with check (( SELECT is_admin() AS is_admin));
create policy "admins can update user roles" on public."user_roles" as permissive for update to authenticated using (( SELECT is_admin() AS is_admin)) with check (( SELECT is_admin() AS is_admin));
create policy "users can read own role" on public."user_roles" as permissive for select to authenticated using (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT is_admin() AS is_admin)));

-- -----------------------------------------------------------------------------
-- public.user_vouchers
-- -----------------------------------------------------------------------------
create table if not exists public."user_vouchers" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "voucher_id" uuid not null,
  "status" text default 'available'::text not null,
  "claimed_at" timestamp with time zone default now() not null,
  "used_at" timestamp with time zone,
  constraint "user_vouchers_pkey" PRIMARY KEY (id),
  constraint "user_vouchers_status_check" CHECK ((status = ANY (ARRAY['available'::text, 'used'::text, 'expired'::text]))),
  constraint "user_vouchers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint "user_vouchers_user_id_voucher_id_key" UNIQUE (user_id, voucher_id),
  constraint "user_vouchers_voucher_id_fkey" FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
);
alter table public."user_vouchers" enable row level security;
CREATE UNIQUE INDEX user_vouchers_pkey ON public.user_vouchers USING btree (id);
CREATE UNIQUE INDEX user_vouchers_user_id_voucher_id_key ON public.user_vouchers USING btree (user_id, voucher_id);
CREATE INDEX user_vouchers_user_idx ON public.user_vouchers USING btree (user_id, status);
create policy "members can claim their vouchers" on public."user_vouchers" as permissive for insert to authenticated with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "members can read their vouchers" on public."user_vouchers" as permissive for select to authenticated using ((( SELECT auth.uid() AS uid) = user_id));
create policy "members can update their vouchers" on public."user_vouchers" as permissive for update to authenticated using ((( SELECT auth.uid() AS uid) = user_id)) with check ((( SELECT auth.uid() AS uid) = user_id));

-- -----------------------------------------------------------------------------
-- public.vouchers
-- -----------------------------------------------------------------------------
create table if not exists public."vouchers" (
  "id" uuid default gen_random_uuid() not null,
  "code" text not null,
  "title" text not null,
  "description" text,
  "discount_type" text not null,
  "discount_value" integer not null,
  "min_order_value" integer default 0 not null,
  "max_discount" integer,
  "usage_limit" integer,
  "used_count" integer default 0 not null,
  "active" boolean default true not null,
  "starts_at" timestamp with time zone default now() not null,
  "ends_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  constraint "vouchers_code_key" UNIQUE (code),
  constraint "vouchers_discount_type_check" CHECK ((discount_type = ANY (ARRAY['percent'::text, 'fixed'::text]))),
  constraint "vouchers_discount_value_check" CHECK ((discount_value > 0)),
  constraint "vouchers_min_order_value_check" CHECK ((min_order_value >= 0)),
  constraint "vouchers_pkey" PRIMARY KEY (id),
  constraint "vouchers_used_count_check" CHECK ((used_count >= 0))
);
alter table public."vouchers" enable row level security;
CREATE INDEX vouchers_active_dates_idx ON public.vouchers USING btree (active, starts_at, ends_at);
CREATE UNIQUE INDEX vouchers_code_key ON public.vouchers USING btree (code);
CREATE UNIQUE INDEX vouchers_pkey ON public.vouchers USING btree (id);
create policy "members can read active vouchers" on public."vouchers" as permissive for select to authenticated using (((active = true) AND (starts_at <= now()) AND ((ends_at IS NULL) OR (ends_at >= now()))));

-- -----------------------------------------------------------------------------
-- public.wishlist_items
-- -----------------------------------------------------------------------------
create table if not exists public."wishlist_items" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "product_id" text not null,
  "created_at" timestamp with time zone default now() not null,
  constraint "wishlist_items_pkey" PRIMARY KEY (id),
  constraint "wishlist_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  constraint "wishlist_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint "wishlist_items_user_id_product_id_key" UNIQUE (user_id, product_id)
);
alter table public."wishlist_items" enable row level security;
CREATE UNIQUE INDEX wishlist_items_pkey ON public.wishlist_items USING btree (id);
CREATE INDEX wishlist_items_product_id_idx ON public.wishlist_items USING btree (product_id);
CREATE INDEX wishlist_items_user_id_created_at_idx ON public.wishlist_items USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX wishlist_items_user_id_product_id_key ON public.wishlist_items USING btree (user_id, product_id);
create policy "Users can add to own wishlist" on public."wishlist_items" as permissive for insert to authenticated with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "Users can read own wishlist" on public."wishlist_items" as permissive for select to authenticated using ((( SELECT auth.uid() AS uid) = user_id));
create policy "Users can remove own wishlist" on public."wishlist_items" as permissive for delete to authenticated using ((( SELECT auth.uid() AS uid) = user_id));

-- This reference does not replace migration bodies or reproduce function bodies,
-- trigger definitions, grants, custom type definitions, or Storage policies.
