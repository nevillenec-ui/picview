export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 24, 100);
  const cursor = url.searchParams.get('cursor') || undefined;
  const prefix = url.searchParams.get('prefix') || '';

  const list = await context.env.IMG_BUCKET.list({
    limit,
    cursor,
    prefix,
    delimiter: '/',
  });

  const images = list.objects
    .filter(o => !o.key.endsWith('/') && /\.(png|jpe?g|gif|webp|avif)$/i.test(o.key))
    .map(o => ({
      key: o.key,
      size: o.size,
      uploaded: o.uploaded,
      url: `/images/${o.key.split('/').map(encodeURIComponent).join('/')}`,
    }));

  return Response.json({
    prefixes: list.delimitedPrefixes || [],
    images,
    truncated: list.truncated,
    cursor: list.truncated ? list.cursor : null,
  });
}
