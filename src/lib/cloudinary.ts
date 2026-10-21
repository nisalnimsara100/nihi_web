import "server-only";
import { createHash } from "node:crypto";

export const MAX_TRANSACTION_IMAGES = 5;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

export const cloudinaryEnabled = () => config() !== null;

/** Cloudinary signs the sorted `key=value` pairs joined with `&`, followed by the API secret. */
function sign(params: Record<string, string | number>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

/** Every user's files live under their own folder, so a public id can be checked against its owner. */
export const userFolder = (userId: string) => `nihi/${userId}`;

/** Parameters the browser needs to upload one image straight to Cloudinary. */
export function signUpload(userId: string) {
  const c = config();
  if (!c) return null;
  const params = { folder: userFolder(userId), timestamp: Math.floor(Date.now() / 1000) };
  return {
    cloudName: c.cloudName,
    apiKey: c.apiKey,
    ...params,
    signature: sign(params, c.apiSecret),
  };
}

/** True when the URL and public id point at a file in this account's folder for this user. */
export function isOwnImage(userId: string, image: { url: string; publicId: string }) {
  const c = config();
  if (!c || !image.publicId.startsWith(`${userFolder(userId)}/`) || image.publicId.includes("..")) return false;
  return image.url.startsWith(`https://res.cloudinary.com/${c.cloudName}/image/upload/`);
}

/** Removes files from Cloudinary. Failures are ignored: an orphaned file is harmless. */
export async function destroyImages(publicIds: string[]) {
  const c = config();
  if (!c) return;
  await Promise.all(
    publicIds.map(async (publicId) => {
      const params = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
      const body = new URLSearchParams({
        ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
        api_key: c.apiKey,
        signature: sign(params, c.apiSecret),
      });
      try {
        await fetch(`https://api.cloudinary.com/v1_1/${c.cloudName}/image/destroy`, { method: "POST", body });
      } catch {
        // Nothing to do; see above.
      }
    }),
  );
}
