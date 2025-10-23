#!/usr/bin/env node
/*
  pixel-check.js
  Captura screenshots de elementos marcados (ou toda a página) e analisa contraste por amostragem de pixels.
  Uso mínimo:
    node pixel-check.js --url http://localhost:8080/index.html --selector "#mainContent"

  Saída: JSON com resumo por seletor e por região.
*/

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const argv = require('minimist')(process.argv.slice(2));

async function screenshotAndAnalyze(url, selectors, opts = {}) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  const results = [];
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (!el) { results.push({ selector: sel, error: 'Elemento não encontrado' }); continue; }
      const clip = await el.boundingBox();
      if (!clip) { results.push({ selector: sel, error: 'Elemento sem caixa (display:none?)' }); continue; }
      const tmp = path.join(process.cwd(), `pixel-${Date.now()}.png`);
      await page.screenshot({ path: tmp, clip });
      // analyze pixels via Canvas in node (use pure JS via PNG parsing)
      const PNG = require('pngjs').PNG;
      const data = fs.readFileSync(tmp);
      const png = PNG.sync.read(data);
      // sample pixels evenly (grid)
      const samples = [];
      const grid = 10;
      for (let y = 0; y < grid; y++) {
        for (let x = 0; x < grid; x++) {
          const px = Math.floor((x + 0.5) * png.width / grid);
          const py = Math.floor((y + 0.5) * png.height / grid);
          const idx = (png.width * py + px) << 2;
          const r = png.data[idx];
          const g = png.data[idx+1];
          const b = png.data[idx+2];
          samples.push([r,g,b]);
        }
      }
      // for background estimate, take median color of samples
      const med = samples[Math.floor(samples.length/2)];
      results.push({ selector: sel, bbox: clip, samplesCount: samples.length, medianRGB: med });
      fs.unlinkSync(tmp);
    } catch (e) {
      results.push({ selector: sel, error: String(e) });
    }
  }
  await browser.close();
  return results;
}

(async () => {
  if (!argv.url) {
    console.log('Uso: node pixel-check.js --url <URL> --selector "#id" [--selector ".classe"]');
    process.exit(1);
  }
  const selectors = argv.selector ? (Array.isArray(argv.selector) ? argv.selector : [argv.selector]) : ['body'];
  const out = await screenshotAndAnalyze(argv.url, selectors, {});
  const outPath = argv.out || 'pixel-check-result.json';
  fs.writeFileSync(outPath, JSON.stringify({ url: argv.url, selectors, results: out }, null, 2));
  console.log('Resultado salvo em', outPath);
})();
