# Preparar o projeto para produção

Este documento descreve os passos e as razões para preparar o site para execução em produção.

O que já foi feito
- Adicionado `Dockerfile` + `nginx.conf` para servir o site com Nginx (headers de segurança e cache).
- Inserido meta Content-Security-Policy em `index.html` para restringir fontes de script/estilos/imagens.
- Ocultado o painel de ferramentas remotas (`remoteChecker`) por padrão; ele só é mostrado em `localhost` ou se `?dev=1` for passado na URL.
- Adicionado workflow `.github/workflows/deploy-pages.yml` para publicar o conteúdo em GitHub Pages (deploy automático ao push na `main`).

Recomendações e próximos passos
1. Ajuste do CSP
   - O CSP atual permite `https://cdnjs.cloudflare.com` para carregar `axe-core` e `jspdf`. Se quiser reduzir dependências externas, prefira empacotar bibliotecas localmente e servir do domínio próprio.

2. Remover endpoints de desenvolvimento
   - `tools/a11y/remote-check-server.js` e `tools/a11y/pixel-check.js` são utilitários de dev/CI. Não devem ser expostos em produção. Mantenha-os apenas no repositório ou rode em CI privado.

3. HTTPS e domínio customizado
   - Configure HTTPS (Cloud provider, CDN, ou GitHub Pages com domínio). Verifique HSTS e renovar certificados.

4. Monitoramento e logs
   - Adicione ferramentas de monitoramento (Sentry, logs) se o site for público.

5. Otimização
   - Minifique `index.html`, CSS e scripts. Considere usar um pipeline de build (Vite/Rollup) se o projeto crescer.

Como executar localmente (Docker)

```bash
# build image
docker build -t acess-test:prod .
# run container
docker run -p 8080:80 acess-test:prod
# abrir http://127.0.0.1:8080
```

Segurança
- Não exponha `remote-check-server.js` sem autenticação.
- Verifique dependências periodicamente por vulnerabilidades.

