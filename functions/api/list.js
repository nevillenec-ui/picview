function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestGet(context) {
  try {
    if (!context.env.IMG_BUCKET) {
      return json({ error: 'R2 binding IMG_BUCKET is not configured' }, 500);
    }

    const url = new URL(context.request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit'), 10) || 24, 100);
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
        url: `https://pub-b994451de7e14631b2da3e507df4557e.r2.dev/${o.key.split('/').map(encodeURIComponent).join('/')}`,
      }));

    return json({
      prefixes: list.delimitedPrefixes || [],
      images,
      truncated: list.truncated,
      cursor: list.truncated ? list.cursor : null,
    });
  } catch (err) {
    return json({ error: String((err && err.message) || err) }, 500);
  }
}
