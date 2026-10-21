"use client";

import { useRef, useState } from "react";
import { notify } from "@/components/toast";
import { getUploadSignature } from "@/actions/images";
import { buttonClass } from "@/components/ui";

export type AttachedImage = { url: string; publicId: string };

const MAX_IMAGES = 5;
const MAX_BYTES = 10 * 1024 * 1024;

/** Uploads one file straight to Cloudinary using a signature from the server. */
async function upload(file: File): Promise<AttachedImage> {
  const signed = await getUploadSignature();
  if (!signed) throw new Error("Image upload isn't set up.");
  const body = new FormData();
  body.set("file", file);
  body.set("api_key", signed.apiKey);
  body.set("timestamp", String(signed.timestamp));
  body.set("folder", signed.folder);
  body.set("signature", signed.signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: "POST", body });
  if (!res.ok) throw new Error("The upload failed. Try again.");
  const json = (await res.json()) as { secure_url: string; public_id: string };
  return { url: json.secure_url, publicId: json.public_id };
}

/** Up to five optional images (receipts, bills). Sends the list as a JSON `images` field. */
export function ImagePicker({
  initial,
  onBusyChange,
}: {
  initial: AttachedImage[];
  onBusyChange?: (busy: boolean) => void;
}) {
  const [images, setImages] = useState(initial);
  const [uploading, setUploading] = useState(0);
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);

  async function add(input: HTMLInputElement) {
    const files = [...(input.files ?? [])];
    input.value = "";
    if (files.length === 0) return;
    const room = MAX_IMAGES - images.length - uploading;
    if (room <= 0) {
      notify.warning("Image limit reached", `You can attach up to ${MAX_IMAGES} images.`);
      return;
    }
    if (files.length > room) {
      notify.warning("Too many images", `Only the first ${room} will be added (up to ${MAX_IMAGES} in total).`);
    }
    const picked = files.slice(0, room);
    const valid = picked.filter((f) => f.type.startsWith("image/") && f.size <= MAX_BYTES);
    if (valid.length < picked.length) {
      notify.error("Some files were skipped", "Only images up to 10 MB are allowed.");
    }
    if (valid.length === 0) return;

    setUploading((n) => n + valid.length);
    onBusyChange?.(true);
    notify.info(valid.length === 1 ? "Uploading image…" : `Uploading ${valid.length} images…`);
    const results = await Promise.all(
      valid.map(async (file) => {
        try {
          const image = await upload(file);
          setImages((list) => [...list, image]);
          return true;
        } catch (e) {
          notify.error("Image upload failed", e instanceof Error ? e.message : "Try again.");
          return false;
        } finally {
          setUploading((n) => {
            if (n === 1) onBusyChange?.(false);
            return n - 1;
          });
        }
      }),
    );
    const done = results.filter(Boolean).length;
    if (done > 0) notify.success(done === 1 ? "Image uploaded" : `${done} images uploaded`);
  }

  const full = images.length + uploading >= MAX_IMAGES;

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-ink">
        Images <span className="font-normal text-ink-soft">(optional, up to {MAX_IMAGES})</span>
      </legend>
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <div className="flex flex-wrap gap-2">
        {images.map((image) => (
          <div key={image.publicId} className="relative size-20 overflow-hidden rounded-xl bg-muted">
            <a href={image.url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url.replace("/upload/", "/upload/c_fill,w_160,h_160,q_auto,f_auto/")} alt="" className="size-full object-cover" />
            </a>
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => setImages((list) => list.filter((i) => i.publicId !== image.publicId))}
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-ink/70 text-xs font-bold text-white"
            >
              ×
            </button>
          </div>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <div key={i} className="size-20 animate-pulse rounded-xl bg-muted" aria-label="Uploading" />
        ))}
      </div>
      {!full ? (
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => camera.current?.click()} className={buttonClass("soft", "md")}>
            Take photo
          </button>
          <button type="button" onClick={() => gallery.current?.click()} className={buttonClass("soft", "md")}>
            Choose from gallery
          </button>
        </div>
      ) : null}
      {/* `capture` opens the camera on phones; on a computer it falls back to the file picker. */}
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => add(e.target)} />
      <input ref={gallery} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target)} />
    </fieldset>
  );
}
