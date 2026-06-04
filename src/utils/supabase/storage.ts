import { createClient } from "./server";
import { cookies } from "next/headers";

/**
 * Uploads a file to Supabase Storage from a Next.js Server Action
 * @param bucket Name of the storage bucket
 * @param path Destined path inside the bucket (e.g. 'proposals/uuid.pdf')
 * @param file The HTML File object
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(bucket: string, path: string, file: File) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  // Convert File to ArrayBuffer for uploading
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Gagal mengunggah file ke Supabase Storage: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}
