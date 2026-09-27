// Resume at NW_SPEED until story >= NW_UNTIL or phase == NW_PHASE, then pause.
export default async function run({ page, frame }) {
  const target = frame ?? page;
  const speed = Number(process.env.NW_SPEED || 1);
  const until = process.env.NW_UNTIL ? Number(process.env.NW_UNTIL) : null;
  const phase = process.env.NW_PHASE || null;
  const holdSpeed = process.env.NW_HOLD ? Number(process.env.NW_HOLD) : 0;
  await target.evaluate((s) => window.__nightWatch.setSpeed(s), speed);
  await target.waitForFunction(
    ([u, p]) => {
      const s = window.__nightWatch.state();
      return (u != null && s.story >= u && (p == null || s.phase === p)) || (u == null && p != null && s.phase === p);
    },
    [until, phase],
    { timeout: 58000, polling: 16 },
  );
  await target.evaluate((s) => window.__nightWatch.setSpeed(s), holdSpeed);
  return await target.evaluate(() => window.__nightWatch.state());
}
