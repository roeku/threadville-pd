export default async function run({ page, frame }) {
  const target = frame ?? page;
  const pts = JSON.parse(process.env.NW_POINTS || '[[0,0,0]]');
  return await target.evaluate((pts) => pts.map((p) => window.__nightWatch.boardToWorld(p[0], p[1], p[2]).map((v) => Number(v.toFixed(4)))), pts);
}
