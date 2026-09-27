export default async function run({ page, frame }) {
  const target = frame ?? page;
  const night = Number(process.env.NW_NIGHT || 0);
  await target.waitForFunction(() => !!window.__nightWatch, null, { timeout: 20000 });
  return await target.evaluate((n) => {
    window.__nightWatch.restart(n);
    window.__nightWatch.setSpeed(0);
    return window.__nightWatch.state();
  }, night);
}
