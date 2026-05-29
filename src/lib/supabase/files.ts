"use client";
import { createClient } from "./client";

const BUCKET = "files";

export interface SbCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface SbFile {
  id: string;
  category_id: string;
  name: string;
  description: string;
  storage_path: string;
  mime_type: string;
  size: number;
  created_at: string;
  url: string;
}

export async function fetchCategories(): Promise<SbCategory[]> {
  const sb = createClient();
  const { data, error } = await sb.from("resource_categories").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []) as SbCategory[];
}

export async function addCategory(name: string): Promise<SbCategory> {
  const sb = createClient();
  const { data, error } = await sb.from("resource_categories").insert({ name }).select().single();
  if (error) throw error;
  return data as SbCategory;
}

export async function renameCategory(id: string, name: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from("resource_categories").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function removeCategory(id: string): Promise<void> {
  const sb = createClient();
  const { data: files } = await sb
    .from("resource_files")
    .select("storage_path")
    .eq("category_id", id);
  if (files?.length) {
    await sb.storage.from(BUCKET).remove(files.map((f: { storage_path: string }) => f.storage_path));
  }
  const { error } = await sb.from("resource_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchFiles(categoryId?: string | null): Promise<SbFile[]> {
  const sb = createClient();
  let q = sb.from("resource_files").select("*").order("created_at", { ascending: false });
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((f: Omit<SbFile, "url">) => ({
    ...f,
    url: sb.storage.from(BUCKET).getPublicUrl(f.storage_path).data.publicUrl,
  }));
}

export async function uploadFile(
  file: File,
  categoryId: string,
  description: string
): Promise<SbFile> {
  const sb = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_一-龥]/g, "_");
  const path = `${categoryId}/${Date.now()}_${safeName}`;

  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, file);
  if (upErr) throw upErr;

  const { data, error } = await sb
    .from("resource_files")
    .insert({
      category_id: categoryId,
      name: file.name,
      description,
      storage_path: path,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
    })
    .select()
    .single();

  if (error) {
    await sb.storage.from(BUCKET).remove([path]);
    throw error;
  }

  return {
    ...(data as Omit<SbFile, "url">),
    url: sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
  };
}

export async function removeFile(id: string, storagePath: string): Promise<void> {
  const sb = createClient();
  await sb.storage.from(BUCKET).remove([storagePath]);
  const { error } = await sb.from("resource_files").delete().eq("id", id);
  if (error) throw error;
}
