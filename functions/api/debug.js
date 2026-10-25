export async function onRequestGet(context) {
  const keys = Object.keys(context.env || {});
  return new Response(JSON.stringify({
    hasImgBucket: !!context.env.IMG_BUCKET,
    envKeys: keys,
  }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
