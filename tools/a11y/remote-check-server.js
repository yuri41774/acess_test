#!/usr/bin/env node
/*
  remote-check-server.js
  Servidor simples que aceita POST /api/check { url: string, selectors?: [] }
  e executa Puppeteer + axe-core em um browser headless para retornar JSON com:
    - axe results
    - pixel-check samples (opcional, via selectors)

  Segurança: este servidor é para uso local/CI. NÃO exponha em produção sem autenticação.
*/

const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json({ limit: '5mb' }));
// Allow simple CORS for local usage (CI runners are trusted). Do not enable in public without auth.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

async function runChecks(url, selectors) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  // inject axe
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.0/axe.min.js' });
  const axeResults = await page.evaluate(async () => {
    try { return await axe.run(); } catch (e) { return { error: String(e) }; }
  });

  const pixelResults = [];
  if (selectors && selectors.length) {
    // determine output dir: either temp or workspace artifacts when requested
    let outDir;
    if (process.env.SAVE_SCREENSHOTS === '1') {
      outDir = path.join(process.cwd(), 'tools', 'a11y', 'artifacts');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    } else {
      outDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pixel-'));
    }
    for (const sel of selectors) {
      try {
        const el = await page.$(sel);
        if (!el) { pixelResults.push({ selector: sel, error: 'not found' }); continue; }
        const box = await el.boundingBox();
        if (!box) { pixelResults.push({ selector: sel, error: 'no box' }); continue; }
        const outPath = path.join(outDir, `shot-${Date.now()}.png`);
        await page.screenshot({ path: outPath, clip: box });
        pixelResults.push({ selector: sel, screenshot: outPath, bbox: box });
      } catch (e) { pixelResults.push({ selector: sel, error: String(e) }); }
    }
  }

  await browser.close();
  return { axe: axeResults, pixels: pixelResults };
}

app.post('/api/check', async (req, res) => {
  const { url, selectors } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const result = await runChecks(url, selectors || []);
    res.json({ url, result });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`remote-check-server listening on ${port}`));
