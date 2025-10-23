# acess_test

Projeto de demonstração: um formulário estático para registrar testes de acessibilidade e exportar relatórios.

### Gerar executável Windows (Electron)

Este repositório agora inclui um scaffold para empacotar o site em um app Electron e gerar um instalador/portable para Windows usando `electron-builder`.

Passos rápidos (no seu ambiente de desenvolvimento/CI):

1. Instale dependências

```bash
npm install
```

2. Teste localmente com Electron

```bash
npm run start
```

3. Gerar build para Windows (recomendado em CI/Windows):

```bash
npm run dist:win
```

Observações importantes:
- O `electron-builder` geralmente precisa rodar em Windows para produzir instaladores nativos sem usar Wine. É possível gerar builds para Windows em Linux usando Wine, mas é mais simples usar um runner Windows (ex.: GitHub Actions `runs-on: windows-latest`).
- Adicione um ícone em `build/icon.ico` para personalizar o exe.
- Use CI (GitHub Actions) com `electron-builder` para publicar releases automaticamente.

Se quiser, eu posso criar um workflow de GitHub Actions que executa `npm ci` e gera artefatos .exe prontos para download em cada release.

### Workflow do GitHub Actions (build Windows)

Adicionei um workflow: `.github/workflows/build-windows.yml` que:

- Roda em `windows-latest`.
- Executa `npm ci` e `npm run dist:win`.
- Faz upload dos artefatos gerados na pasta `dist/` como `acess_test-windows`.

Como usar:

- Push para a branch `main` disparará o workflow automaticamente.
- Você também pode disparar manualmente pela aba "Actions" (botão "Run workflow").
- Ao término, os artefatos estarão disponíveis na execução (Actions > execução > Artifacts).

Posso ajustar o workflow para publicar automaticamente os artefatos em um Release do GitHub se preferir.

### Publicar automaticamente em Releases

Adicionei um workflow que publica automaticamente um Release quando uma tag que começa com `v` é enviada (por exemplo `v1.0.0`).

Fluxo:

- Crie uma tag e faça push: `git tag v1.0.0 && git push origin v1.0.0`.
- O workflow `.github/workflows/release-on-tag.yml` será acionado, gerará os artefatos em `dist/` e criará um Release anexando os arquivos gerados.

Observação: o GitHub Actions usa o `GITHUB_TOKEN` interno para criar o Release; não são necessárias credenciais extras para publicar o Release (exceto se quiser assinar/firmar o instalador, que requer segredos adicionais).

Changelog automático

O workflow também gera automaticamente um changelog simples entre a tag anterior (por data de criação) e a tag atual, usando `git log` e adiciona as mensagens de commit ao corpo do Release. Se não houver tag anterior, ele tentará incluir as mensagens desde o início do histórico.
O workflow agora gera um changelog baseado em PRs: ele busca PRs associados aos commits entre a tag anterior e a atual e inclui título e autor de cada PR no corpo do Release. Se não encontrar PRs diretamente, faz fallback por PRs mesclados no intervalo de datas.

### Pós-force-push (importante)

Se este repositório teve o histórico reescrito (force-push), siga estes passos para sincronizar seu clone local e evitar conflitos:

```bash
git fetch origin
git checkout main
git reset --hard origin/main
git clean -fdx
```

Aviso: isso descartará alterações locais não comitadas.

### Hooks locais e proteção contra arquivos grandes

Para evitar commitar arquivos grandes acidentalmente:

1. Instale dependências e prepare husky:

```bash
npm install
npm run prepare
npm run install-hooks
```

2. O script de pre-commit (`tools/pre-commit-checks.sh`) impede commits com arquivos maiores que 50MB. Você pode ajustar o limite conforme necessário.

3. Se você realmente precisa versionar arquivos grandes, considere usar Git LFS. Veja `.gitattributes` para exemplos comentados.
