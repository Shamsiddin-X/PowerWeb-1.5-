export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
export function scriptData(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
export function safeUrl(value: string, media = false): string {
  const raw = value.trim();
  if (/^(https?:|blob:)/i.test(raw) || (!media && /^(mailto:|tel:|#)/i.test(raw))) return raw;
  if (media && /^data:(image\/(png|jpeg|jpg|gif|webp|svg\+xml|avif|bmp|x-icon|vnd\.microsoft\.icon)|video\/(mp4|webm|ogg|quicktime|x-m4v))(?:;[^,]*)?,/i.test(raw)) return raw;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw) && !raw.startsWith('//') && !/[\x00-\x20]/.test(raw)) return raw;
  return '';
}
