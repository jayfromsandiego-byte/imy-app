// lib/uploadMedia.ts — the one shared shape for "what media are we willing to
// keep", used by every upload door (proxied, presigned, and Blob client
// tokens) so the allow-list and size caps never quietly drift apart between
// them. Kind detection and byte caps live here too, so a policy change is one
// edit, not three.
//
// The list folds in the known QoL MIME broadening: 3GPP video (older Android
// phones), AMR and FLAC audio (voicemail exports, lossless voice memos), and
// AVIF images (the format iOS and modern Android increasingly default to
// alongside HEIC). image/svg+xml is never allowed — an SVG can carry a
// <script>, and a memorial is not the place to find out.
export const SAFE_MEDIA =
  /^(image\/(jpeg|png|webp|gif|heic|heif|avif)|audio\/(mpeg|mp4|wav|x-m4a|aac|ogg|webm|amr|flac)|video\/(mp4|webm|quicktime|3gpp))$/i;

export type MediaKind = "image" | "audio" | "video" | null;

export function kindOf(contentType: string): MediaKind {
  const t = (contentType || "").toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("audio/")) return "audio";
  if (t.startsWith("video/")) return "video";
  return null;
}

// Generous for grief, still a wall. Video needs room for a real phone clip
// (60–400MB is typical); audio for a long voicemail; images for a 48MP HEIC.
export const MAX_BYTES_BY_KIND: Record<Exclude<MediaKind, null>, number> = {
  video: 400 * 1024 * 1024,
  audio: 60 * 1024 * 1024,
  image: 30 * 1024 * 1024,
};

export function maxBytesFor(contentType: string): number {
  const kind = kindOf(contentType);
  return kind ? MAX_BYTES_BY_KIND[kind] : MAX_BYTES_BY_KIND.image;
}

// A tribute-scoped path never escapes its own folder. Rejects a crafted
// "../" segment, an absolute path, or a foreign tribute id sitting where
// this one belongs — a client token must only ever be able to write inside
// the tribute it was minted for.
export function isPathnamePinnedToTribute(pathname: string, tributeId: string): boolean {
  if (!tributeId || !/^[a-zA-Z0-9_-]+$/.test(tributeId)) return false;
  if (!pathname || pathname.includes("..") || pathname.startsWith("/")) return false;
  return pathname.startsWith(`tributes/${tributeId}/`) && pathname.length > `tributes/${tributeId}/`.length;
}
