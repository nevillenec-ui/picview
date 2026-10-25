const PUBLIC_BASE = 'https://pub-b994451de7e14631b2da3e507df4557e.r2.dev';
const IMG_RE = /\.(png|jpe?g|gif|webp|avif)$/i;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function toUrl(key) {
  return `${PUBLIC_BASE}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

// 取出桶里所有一级目录（作为相册），自动翻完 R2 的分页
async function listAllPrefixes(bucket) {
  const prefixes = [];
  let cursor;
  for (;;) {
    const page = await bucket.list({ limit: 1000, delimiter: '/', cursor });
    prefixes.push(...(page.delimitedPrefixes || []));
    if (!page.truncated) break;
    cursor = page.cursor;
  }
  return prefixes;
}

export async function onRequestGet(context) {
  try {
    const bucket = context.env.IMG_BUCKET;
    if (!bucket) {
      return json({ error: 'R2 binding IMG_BUCKET is not configured' }, 500);
    }

    const prefixes = await listAllPrefixes(bucket);

    const albums = await Promise.all(
      prefixes.map(async p => {
        const sub = await bucket.list({ prefix: p, limit: 20 });
        const coverObj = sub.objects.find(o => !o.key.endsWith('/') && IMG_RE.test(o.key));
        return {
          prefix: p,
          name: p.replace(/\/$/, ''),
          cover: coverObj ? toUrl(coverObj.key) : null,
        };
      })
    );

    // 根目录若有直属图片，作为一个独立相册放在最前面
    const root = await bucket.list({ limit: 20, delimiter: '/' });
    const rootCover = root.objects.find(o => !o.key.endsWith('/') && IMG_RE.test(o.key));
    if (rootCover) {
      albums.unshift({ prefix: '', name: '根目录', cover: toUrl(rootCover.key) });
    }

    return json({ albums });
  } catch (err) {
    return json({ error: String((err && err.message) || err) }, 500);
  }
}
