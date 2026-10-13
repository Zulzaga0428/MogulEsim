const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const TOKEN = process.env.CLOUDFLARE_IMAGES_TOKEN!;
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`;

export interface CloudflareImageResult {
  id: string;
  url: string;
}

function extractDeliveryUrl(result: any): string {
  if (result.variants && result.variants.length > 0) {
    return result.variants[0] as string;
  }
  throw new Error("No delivery URL returned from Cloudflare Images");
}

export async function uploadImageFromBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<CloudflareImageResult> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  form.append("file", blob, filename);

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  });

  const data = await res.json() as any;
  console.log("[CF Images] Upload response:", JSON.stringify(data.result));
  if (!data.success) {
    throw new Error(`Cloudflare Images upload failed: ${JSON.stringify(data.errors)}`);
  }

  const imageId = data.result.id as string;
  const url = extractDeliveryUrl(data.result);
  console.log("[CF Images] Delivery URL:", url);
  return { id: imageId, url };
}

export async function deleteImage(imageId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${imageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const data = await res.json() as any;
  if (!data.success) {
    throw new Error(`Cloudflare Images delete failed: ${JSON.stringify(data.errors)}`);
  }
}
