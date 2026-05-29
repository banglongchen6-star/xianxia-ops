import { createClient } from "./client";

// 实际存数据库的素材类型
export type MaterialType =
  | "image"
  | "selling_image"   // 卖点图片
  | "selling_video"   // 主播讲解视频
  | "demo_video"      // 产品功能讲解小视频
  | "promo";          // 宣发素材（压缩包）

// UI tab ID（selling_point 是虚拟 tab，内含 selling_image + selling_video）
export type TabId = MaterialType | "selling_point";

export const MATERIAL_TABS: { id: TabId; label: string }[] = [
  { id: "image",          label: "图片素材" },
  { id: "selling_point",  label: "卖点讲解" },
  { id: "demo_video",     label: "产品功能讲解" },
  { id: "promo",          label: "宣发素材" },
];

export interface Product {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  created_at: string;
  cover_image_path: string | null;
  cover_url?: string;
}

export interface ProductFile {
  id: string;
  product_id: string;
  material_type: MaterialType;
  name: string;
  content: string;
  storage_path: string | null;
  mime_type: string;
  size: number;
  sort_order: number;
  created_at: string;
  url?: string;
}

const sb = () => createClient();

function withUrl(f: Record<string, unknown>): ProductFile {
  const storage_path = f.storage_path as string | null;
  return {
    ...(f as unknown as ProductFile),
    url: storage_path
      ? sb().storage.from("files").getPublicUrl(storage_path).data.publicUrl
      : undefined,
  };
}

// ── Products ──────────────────────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await sb()
    .from("products")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return ((data ?? []) as Product[]).map(p => ({
    ...p,
    cover_url: p.cover_image_path
      ? sb().storage.from("files").getPublicUrl(p.cover_image_path).data.publicUrl
      : undefined,
  }));
}

export async function updateProductCover(id: string, file: File): Promise<string> {
  const safe = file.name.replace(/[^a-zA-Z0-9._一-龥-]/g, "_");
  const path = `products/${id}/cover/${Date.now()}_${safe}`;
  const { error } = await sb().storage.from("files").upload(path, file, { upsert: true });
  if (error) throw error;
  await sb().from("products").update({ cover_image_path: path }).eq("id", id);
  return sb().storage.from("files").getPublicUrl(path).data.publicUrl;
}

export async function createProduct(name: string, description = ""): Promise<Product> {
  const { data, error } = await sb()
    .from("products")
    .insert({ name, description })
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(
  id: string,
  patch: Partial<Pick<Product, "name" | "description">>
): Promise<void> {
  const { error } = await sb().from("products").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { data } = await sb()
    .from("product_files")
    .select("storage_path")
    .eq("product_id", id);
  const paths = ((data ?? []) as { storage_path: string | null }[])
    .map(f => f.storage_path)
    .filter(Boolean) as string[];
  if (paths.length > 0) {
    await sb().storage.from("files").remove(paths);
  }
  const { error } = await sb().from("products").delete().eq("id", id);
  if (error) throw error;
}

// ── Product Files ─────────────────────────────────────────────────────────

export async function fetchProductFiles(
  productId: string,
  materialType?: MaterialType
): Promise<ProductFile[]> {
  let q = sb()
    .from("product_files")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order")
    .order("created_at");
  if (materialType) q = q.eq("material_type", materialType);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(withUrl);
}

export async function uploadProductFile(
  file: File,
  productId: string,
  materialType: MaterialType
): Promise<ProductFile> {
  const safe = file.name.replace(/[^a-zA-Z0-9._一-龥-]/g, "_");
  const path = `products/${productId}/${materialType}/${Date.now()}_${safe}`;
  const { error: upErr } = await sb().storage.from("files").upload(path, file);
  if (upErr) throw upErr;
  const { data, error } = await sb()
    .from("product_files")
    .insert({
      product_id: productId,
      material_type: materialType,
      name: file.name,
      content: "",
      storage_path: path,
      mime_type: file.type,
      size: file.size,
    })
    .select()
    .single();
  if (error) throw error;
  return withUrl(data as Record<string, unknown>);
}

export async function saveSellingPoint(args: {
  productId: string;
  name: string;
  content: string;
  imageFile?: File | null;
  existingId?: string;
  existingPath?: string | null;
  clearImage?: boolean;
}): Promise<ProductFile> {
  const { productId, name, content, imageFile, existingId, existingPath, clearImage } = args;
  const client = sb();

  let storagePath = existingPath ?? null;
  let mimeType = "";
  let size = 0;

  // 删除旧图
  if (clearImage && existingPath) {
    await client.storage.from("files").remove([existingPath]);
    storagePath = null;
  }

  // 上传新图
  if (imageFile) {
    if (storagePath) await client.storage.from("files").remove([storagePath]);
    const safe = imageFile.name.replace(/[^a-zA-Z0-9._一-龥-]/g, "_");
    const path = `products/${productId}/selling_point/${Date.now()}_${safe}`;
    const { error: upErr } = await client.storage.from("files").upload(path, imageFile);
    if (upErr) throw upErr;
    storagePath = path;
    mimeType = imageFile.type;
    size = imageFile.size;
  }

  const imageChanged = !!imageFile || !!clearImage;
  const base: Record<string, unknown> = {
    name, content, storage_path: storagePath,
    ...(imageChanged ? { mime_type: mimeType, size } : {}),
  };

  let data: Record<string, unknown>;
  if (existingId) {
    const res = await client.from("product_files").update(base).eq("id", existingId).select().single();
    if (res.error) throw res.error;
    data = res.data as Record<string, unknown>;
  } else {
    const res = await client.from("product_files").insert({
      product_id: productId,
      material_type: "selling_point",
      mime_type: mimeType,
      size,
      ...base,
    }).select().single();
    if (res.error) throw res.error;
    data = res.data as Record<string, unknown>;
  }

  return withUrl(data);
}

export async function deleteProductFile(id: string, storagePath: string | null): Promise<void> {
  if (storagePath) await sb().storage.from("files").remove([storagePath]);
  const { error } = await sb().from("product_files").delete().eq("id", id);
  if (error) throw error;
}
