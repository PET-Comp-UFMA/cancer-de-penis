-- The catalog key is the form's public address (/tela-avaliacao/<key>), looked
-- up case-insensitively across all accounts, so it must be globally unique.
create unique index if not exists admin_forms_catalog_key_global_idx
  on app_private.admin_forms (upper(catalog_key));
