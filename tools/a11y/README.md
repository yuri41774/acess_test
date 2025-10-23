# A11yTool (client)

Pequena biblioteca cliente para executar checagens de acessibilidade no browser.

Arquivos
- `a11y-tool.js` - script que expõe `window.A11yTool` com a API principal.

API
- `A11yTool.runAxe(root)` -> Promise com os resultados do axe.run no elemento `root` (ou documento)
- `A11yTool.runContrast(root)` -> Array com objetos: { selector, ratio, required, passes, complexBackground }
- `A11yTool.runFullChecks(root)` -> Promise<{ axe, contrast }>
- `A11yTool.revalidateElement(root)` -> Promise igual a runFullChecks
- `A11yTool.exportReport(obj, filename)` -> gera download do JSON

Como usar
1. Inclua o script na página:

```html
<script src="/tools/a11y/a11y-tool.js"></script>
```

2. (Opcional) Carregue também o axe-core se quiser que as auditorias do axe sejam executadas:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.0/axe.min.js"></script>
```

3. Chame a API:

```javascript
if (window.A11yTool) {
  const res = await window.A11yTool.runFullChecks(document);
  window.A11yTool.exportReport(res, 'meu-relatorio.json');
}
```

Dicas
- Para análise de contraste baseada em imagem (pixel-perfect) é necessário capturar screenshot (Puppeteer) ou ter imagens same-origin para uso de canvas.
- Em CI, prefira executar Lighthouse/axe-cli/pa11y em runners (workflow já incluído no repositório).

Limitações
- O `A11yTool` depende de `axe-core` em runtime quando houver necessidade de auditoria automatizada; sem ele, a biblioteca apenas realizará checagem de contraste básica.
- CORS e cross-origin images podem impedir análises com canvas local.

ESM / UMD
- Esta pasta fornece duas entradas:
  - `a11y-tool.js` (UMD/CJS/browser global) — inclua via `<script src="/tools/a11y/a11y-tool.js"></script>` para expor `window.A11yTool`.
  - `a11y-tool.esm.js` (ESM) — importe com bundlers ou `<script type="module"> import A11y from '/tools/a11y/a11y-tool.esm.js' </script>`.

Pixel-level analysis (Puppeteer)
- Arquivo `pixel-check.js` é um utilitário Node que usa Puppeteer para capturar screenshots de seletores indicados e amostrar pixels para estimar cores/contraste. Ideal para CI.

Como usar pixel-check (exemplo local)
1. Instale dependências na pasta `tools/a11y`:

```bash
cd tools/a11y
npm install
```

2. Execute um servidor que sirva a sua página (por exemplo, na raiz do repositório):

```bash
python3 -m http.server 8080
```

3. Rode o pixel-check:

```bash
node pixel-check.js --url http://127.0.0.1:8080/index.html --selector "#mainContent" --out my-pixel.json
```

Resultado: um arquivo JSON com amostras de cor por seletor.

Contribuições e melhorias sugeridas
- Melhorar amostragem para detectar texto vs background (segmentação de cor / OCR).
- Integrar o pixel-check ao workflow do GitHub Actions para rodar em PRs e anexar artefatos.
