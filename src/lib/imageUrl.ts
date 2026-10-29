import { IMAGES } from "@/lib/api";

// Order items may store a bare uploaded file name; next/image needs a URL or path.
export function orderItemImageUrl(file: string): string {
  if (/^(https?:)?\/\//.test(file) || file.startsWith("data:") || file.startsWith("/")) return file;
  return `${IMAGES}/${file}`;
}
