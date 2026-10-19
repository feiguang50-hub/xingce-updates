const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {pathToFileURL} = require('node:url');

(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {});
  const errors = [];
  try {
    const context = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, locale: 'zh-CN', colorScheme: 'light'});
    await context.route(/^https?:/, route => route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../../dist/index.html')).href);
    await page.evaluate(async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700"><rect width="1200" height="700" fill="#f4f7fc"/><text x="60" y="90" font-size="38" fill="#25364d">某市公共交通客流统计</text>' +
        ['季度', '一季度', '二季度', '三季度', '四季度'].map((x, i) => `<text x="${60 + i * 230}" y="200" font-size="30" fill="#65758e">${x}</text>`).join('') +
        '<text x="60" y="340" font-size="28" fill="#25364d">地铁 / 万人次</text><text x="60" y="490" font-size="28" fill="#25364d">公交 / 万人次</text>' +
        [120, 132, 151, 163].map((x, i) => `<text x="${290 + i * 230}" y="340" font-size="34" fill="#376bc9">${x}</text><text x="${290 + i * 230}" y="490" font-size="34" fill="#23734c">${200 - i * 8}</text>`).join('') + '<text x="60" y="620" font-size="25" fill="#65758e">数据仅用于界面验证</text></svg>';
      await vault.put({id: 'reading-fixture', name: '图表.svg', type: 'image/svg+xml', blob: new Blob([svg], {type: 'image/svg+xml'})});
      ASSET_IDS.add('reading-fixture');
      const q = normalQuestion({id: 'reading-question', stem: '根据图表，四季度地铁客流量比一季度约增长多少？', opts: ['35.8%', '30.2%', '25.7%', '40.6%'], ans: 'A', exp: '增长率为 (163 − 120) ÷ 120 ≈ 35.8%。', mod: '资料分析', type: '增长率', imageRef: 'reading-fixture', needsImage: true});
      const long = normalQuestion({id: 'long-question', mat: '城市公共交通建设应兼顾出行效率、覆盖范围与换乘体验。\n'.repeat(30), stem: '哪一个选项最符合材料的主要观点？', opts: ['兼顾效率与覆盖范围', 'https://example.test/' + 'longword'.repeat(40), '只关注单一指标', '忽视换乘体验'], ans: 'A', exp: '材料强调统筹多项指标。', mod: '言语'});
      d.qs = [q, long]; sv(); go(d.qs, false, 'practice');
    });
    const imageButton = page.getByRole('button', {name: '查看题目附图大图'});
    await imageButton.waitFor();
    const before = await page.evaluate(() => ({id: P.id, index: P.i, answers: P.it.map(it => it.p)}));
    await imageButton.click();
    const viewer = page.locator('.image-viewer');
    await viewer.locator('img:not([hidden])').waitFor();
    const initialWidth = await viewer.locator('img').evaluate(img => img.getBoundingClientRect().width);
    await page.getByRole('button', {name: '放大题图', exact: true}).click();
    await page.getByRole('button', {name: '放大题图', exact: true}).click();
    assert.ok(await viewer.locator('img').evaluate(img => img.getBoundingClientRect().width) > initialWidth * 2);
    assert.ok(await viewer.locator('.image-viewer-stage').evaluate(el => el.scrollWidth > el.clientWidth));
    if (process.env.QA_OUTPUT) {
      await fs.mkdir(process.env.QA_OUTPUT, {recursive: true});
      await page.screenshot({path: path.join(process.env.QA_OUTPUT, 'xingce-image-zoom.png')});
    }
    await page.getByRole('button', {name: '适应宽度', exact: true}).click();
    assert.equal(await viewer.locator('output').textContent(), '100%');
    assert.equal(await page.evaluate(() => handleAndroidBack()), true);
    assert.equal(await viewer.evaluate(el => el.open), false);
    assert.deepEqual(await page.evaluate(() => ({id: P.id, index: P.i, answers: P.it.map(it => it.p)})), before);
    assert.equal(await imageButton.evaluate(el => el === document.activeElement), true);
    // The inline image's original blob URL has already been revoked: reopening
    // must load a fresh attachment rather than cloning that expired URL.
    await imageButton.click();
    await viewer.locator('img:not([hidden])').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await viewer.evaluate(el => el.open), false);
    await imageButton.click();
    await page.evaluate(() => handleAndroidBack());
    await page.waitForTimeout(100);
    assert.equal(await viewer.evaluate(el => el.open), false);
    console.log('PASS image zoom, pan, fit, repeated open, Escape and Android back preserve the active practice');

    await page.locator('.question-options .o').first().click();
    assert.equal(await page.evaluate(() => d.qs[0].n), 1);
    assert.equal(await page.locator('.practice-completion').getAttribute('value'), '1');
    await page.getByRole('button', {name: '下一题', exact: true}).click();
    await page.setViewportSize({width: 320, height: 740});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.locator('.question-options .o').first().click();
    assert.equal(await page.evaluate(() => d.qs[1].n), 1);
    console.log('PASS long materials and unbroken options fit 320px; progress and answer accounting remain correct');

    await page.evaluate(() => suspend());
    await page.reload();
    await page.getByRole('button', {name: '继续上次练习', exact: true}).click();
    assert.equal(await page.evaluate(() => P.i), 1);
    assert.equal(await page.evaluate(() => d.qs[1].n), 1);
    await page.evaluate(() => jump(0));
    await page.evaluate(() => { d.settings.theme = 'dark'; applySettings(); });
    await imageButton.click();
    await viewer.locator('img:not([hidden])').waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    if (process.env.QA_OUTPUT) await page.screenshot({path: path.join(process.env.QA_OUTPUT, 'xingce-image-dark.png')});
    await page.getByRole('button', {name: '关闭大图', exact: true}).click();
    const fixture = await page.evaluate(async () => { pause(); return await buildBackup(); });
    if (process.env.QA_OUTPUT) await fs.writeFile(path.join(process.env.QA_OUTPUT, 'reading-fixture.json'), JSON.stringify(fixture));
    console.log('PASS reload resumes the same question; dark image viewer and backup attachments work offline');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
