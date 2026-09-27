export default async function run({ page, frame }) {
  const target = frame ?? page;
  const speed = process.env.NW_SPEED ? Number(process.env.NW_SPEED) : null;
  return await target.evaluate((speed) => {
    const nw = window.__nightWatch;
    if (!nw) return { error: 'hook missing' };
    if (speed != null) nw.setSpeed(speed);
    return nw.state();
  }, speed);
}
