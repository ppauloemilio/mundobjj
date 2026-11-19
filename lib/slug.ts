export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function uniqueSlug(base: string) {
  const clean = slugify(base) || "perfil";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${clean}-${suffix}`;
}
