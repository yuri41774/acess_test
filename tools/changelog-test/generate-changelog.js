const fs = require('fs');
const path = require('path');

// Config (ajuste conforme repositório real)
const OWNER = process.env.GH_OWNER || 'yuri41774';
const REPO = process.env.GH_REPO || 'acess_test';

const commits = JSON.parse(fs.readFileSync(path.join(__dirname,'example_commits.json'), 'utf8'));
const prs = JSON.parse(fs.readFileSync(path.join(__dirname,'example_prs.json'), 'utf8'));

// Paginação helper
function* paginate(array, pageSize = 100) {
  for (let i = 0; i < array.length; i += pageSize) {
    yield array.slice(i, i + pageSize);
  }
}

// Detecta PRs referenciadas no commit por várias formas: '#12', 'pull request #12', 'Merge pull request #12'
function extractPRNumbersFromMessage(message) {
  if (!message) return [];
  const nums = new Set();
  const regexes = [/\#(\d+)/g, /pull request #(?<n>\d+)/ig, /Merge pull request #(?<n>\d+)/ig];
  for (const r of regexes) {
    let m;
    while ((m = r.exec(message)) !== null) {
      const g = (m.groups && m.groups.n) ? m.groups.n : m[1];
      if (g) nums.add(Number(g));
    }
  }
  return Array.from(nums);
}

function findPRsForCommit(commit) {
  const found = [];
  const nums = extractPRNumbersFromMessage(commit.message || '');
  for (const n of nums) {
    const match = prs.find(p => p.number === n);
    if (match) found.push(match);
  }
  return found;
}

// Build PR map from commits
const prMap = new Map();
for (const c of commits) {
  const found = findPRsForCommit(c);
  for (const p of found) prMap.set(p.number, p);
}

// Fallback: se não encontrou PRs associados, procurar PRs mesclados em um range de datas (simulado aqui)
if (prMap.size === 0) {
  // Simular obtenção de datas a partir dos commits (se existissem); aqui usamos todos os PRs e paginação
  const pageSize = 50;
  for (const page of paginate(prs, pageSize)) {
    for (const pr of page) {
      // criterio simplificado: incluir PRs que tenham merged_at definido
      if (pr.merged_at) {
        prMap.set(pr.number, pr);
      }
    }
  }
}

let changelog = '';
if (prMap.size === 0) {
  // Como último recurso, listar commits
  changelog = commits.map(c => `- ${c.message}`).join('\n') || 'No commits/prs found for this release.';
} else {
  const list = Array.from(prMap.values()).sort((a,b)=> (a.merged_at||'') > (b.merged_at||'') ? 1 : -1);
  changelog = list.map(p => {
    const link = `https://github.com/${OWNER}/${REPO}/pull/${p.number}`;
    return `- PR #${p.number}: ${p.title} (${p.user.login}) - ${link}`;
  }).join('\n');
}

console.log(changelog);
