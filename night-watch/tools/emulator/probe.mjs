export default async function run({ page, frame }) {
  const target = frame ?? page;
  await target.waitForFunction(() => !!window.__nightWatch, null, { timeout: 20000 });
  const names = ['footstep','doorCreak','shimmer','incident','clatter','snap','miss','knock','windowClick','dawn','verdictRight','verdictWrong','owl','cricket'];
  return await target.evaluate((n) => window.__nightWatch.probe(n), names);
}
