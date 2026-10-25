export async function onRequestGet(context) {
  const keys = Object.keys(context.env || {});
  const detail = keys.map(k => ({
    key: k,
    length: k.length,
    codePoints: Array.from(k).map(c => c.codePointAt(0)),
  }));
  return new Response(JSON.stringify({
    hasImgBucket: !!context.env.IMG_BUCKET,
    envKeys: detail,
  }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
