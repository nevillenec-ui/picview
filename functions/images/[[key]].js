export async function onRequestGet(context) {
  try {
    if (!context.env.IMG_BUCKET) {
      return new Response('R2 binding IMG_BUCKET is not configured', { status: 500 });
    }

    const key = context.params.key.join('/');
    const object = await context.env.IMG_BUCKET.get(key);

    if (!object) return new Response('Not found', { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return new Response(object.body, { headers });
  } catch (err) {
    return new Response(String((err && err.message) || err), { status: 500 });
  }
}
