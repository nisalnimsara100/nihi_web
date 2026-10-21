"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
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

/** An image the user picked that has not been uploaded yet. */
type Picked = { id: string; file: File; preview: string };

export type ImagePickerHandle = {
  /** True when there are chosen images still waiting to be uploaded. */
  hasPending(): boolean;
  /** Uploads the waiting images and returns every image of the transaction, or null if one failed. */
  uploadAll(): Promise<AttachedImage[] | null>;
};

let nextId = 0;
const pick = (file: File): Picked => ({ id: `p${nextId++}`, file, preview: URL.createObjectURL(file) });

/**
 * Up to five optional images (receipts, bills). Choosing opens a confirm dialog; confirmed images
 * only wait in the browser. They are uploaded when the transaction is saved (see `uploadAll`), so
 * an image removed before that never reaches Cloudinary. Sends the list as a JSON `images` field.
 */
export function ImagePicker({ initial, ref }: { initial: AttachedImage[]; ref?: Ref<ImagePickerHandle> }) {
  const [saved, setSaved] = useState(initial);
  const [waiting, setWaiting] = useState<Picked[]>([]);
  // Images in the confirm dialog, not yet added.
  const [staged, setStaged] = useState<Picked[]>([]);
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const previews = useRef<string[]>([]);

  useEffect(() => {
    previews.current = [...waiting, ...staged].map((p) => p.preview);
  });
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  useEffect(() => {
    if (staged.length === 0) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cancelStaged();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  useImperativeHandle(ref, () => ({
    hasPending: () => waiting.length > 0,
    async uploadAll() {
      notify.info(waiting.length === 1 ? "Uploading image…" : `Uploading ${waiting.length} images…`);
      const results = await Promise.all(
        waiting.map(async (item) => {
          try {
            return { item, image: await upload(item.file) };
          } catch (e) {
            notify.error("Image upload failed", e instanceof Error ? e.message : "Try again.");
            return { item, image: null };
          }
        }),
      );
      const uploaded = results.flatMap((r) => (r.image ? [r.image] : []));
      const failed = results.filter((r) => !r.image).map((r) => r.item);
      // Uploaded ones become saved right away, so a retry only uploads what failed.
      setSaved((list) => [...list, ...uploaded]);
      setWaiting(failed);
      results.filter((r) => r.image).forEach((r) => URL.revokeObjectURL(r.item.preview));
      if (failed.length > 0) return null;
      notify.success(uploaded.length === 1 ? "Image uploaded" : `${uploaded.length} images uploaded`);
      return [...saved, ...uploaded];
    },
  }));

  const total = saved.length + waiting.length;
  const room = MAX_IMAGES - total;

  function choose(input: HTMLInputElement) {
    const files = [...(input.files ?? [])];
    input.value = "";
    if (files.length === 0) return;
    if (room <= 0) {
      notify.warning("Image limit reached", `You can attach up to ${MAX_IMAGES} images.`);
      return;
    }
    const valid = files.filter((f) => f.type.startsWith("image/") && f.size <= MAX_BYTES);
    if (valid.length < files.length) {
      notify.error("Some files were skipped", "Only images up to 10 MB are allowed.");
    }
    if (valid.length > room) {
      notify.warning("Too many images", `Only the first ${room} will be added (up to ${MAX_IMAGES} in total).`);
    }
    const picked = valid.slice(0, room).map(pick);
    if (picked.length > 0) setStaged(picked);
  }

  function cancelStaged() {
    staged.forEach((p) => URL.revokeObjectURL(p.preview));
    setStaged([]);
  }

  function confirmStaged() {
    setWaiting((list) => [...list, ...staged]);
    setStaged([]);
  }

  function removeStaged(id: string) {
    const gone = staged.find((p) => p.id === id);
    if (gone) URL.revokeObjectURL(gone.preview);
    setStaged((list) => list.filter((p) => p.id !== id));
  }

  function removeWaiting(id: string) {
    const gone = waiting.find((p) => p.id === id);
    if (gone) URL.revokeObjectURL(gone.preview);
    setWaiting((list) => list.filter((p) => p.id !== id));
  }

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-ink">
        Images <span className="font-normal text-ink-soft">(optional, up to {MAX_IMAGES})</span>
      </legend>
      <input type="hidden" name="images" value={JSON.stringify(saved)} />
      <div className="flex flex-wrap gap-2">
        {saved.map((image) => (
          <Thumb
            key={image.publicId}
            src={image.url.replace("/upload/", "/upload/c_fill,w_160,h_160,q_auto,f_auto/")}
            href={image.url}
            onRemove={() => setSaved((list) => list.filter((i) => i.publicId !== image.publicId))}
          />
        ))}
        {waiting.map((p) => (
          <Thumb key={p.id} src={p.preview} badge="Not uploaded" onRemove={() => removeWaiting(p.id)} />
        ))}
      </div>
      {total > 0 && waiting.length > 0 ? (
        <p className="mt-1.5 text-xs text-ink-soft">New images upload when you save the transaction.</p>
      ) : null}
      {room > 0 ? (
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
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => choose(e.target)} />
      <input ref={gallery} type="file" accept="image/*" multiple hidden onChange={(e) => choose(e.target)} />

      {staged.length > 0 ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={cancelStaged}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-images-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl bg-surface p-6 shadow-xl sm:max-w-md sm:rounded-3xl"
          >
            <h2 id="confirm-images-title" className="text-xl font-bold tracking-tight text-ink">
              {staged.length === 1 ? "Add this image?" : `Add these ${staged.length} images?`}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">They are uploaded when you save the transaction. Remove any you don&apos;t want.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {staged.map((p) => (
                <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => removeStaged(p.id)}
                    className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-ink/70 text-xs font-bold text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={cancelStaged} className={buttonClass("ghost", "md", "flex-1")}>
                Cancel
              </button>
              <button type="button" onClick={confirmStaged} className={buttonClass("primary", "md", "flex-1")}>
                {staged.length === 1 ? "Add image" : `Add ${staged.length} images`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}

function Thumb({ src, href, badge, onRemove }: { src: string; href?: string; badge?: string; onRemove: () => void }) {
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={src} alt="" className="size-full object-cover" />;
  return (
    <div className="relative size-20 overflow-hidden rounded-xl bg-muted">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer">
          {img}
        </a>
      ) : (
        img
      )}
      {badge ? (
        <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-0.5 text-center text-[10px] font-semibold text-white">{badge}</span>
      ) : null}
      <button
        type="button"
        aria-label="Remove image"
        onClick={onRemove}
        className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-ink/70 text-xs font-bold text-white"
      >
        ×
      </button>
    </div>
  );
}
