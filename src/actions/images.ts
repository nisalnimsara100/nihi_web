"use server";

import { requireUserId } from "@/lib/auth";
import { signUpload } from "@/lib/cloudinary";

/** Signed parameters for one direct-to-Cloudinary upload, or null when Cloudinary isn't set up. */
export async function getUploadSignature() {
  const userId = await requireUserId();
  return signUpload(userId);
}
