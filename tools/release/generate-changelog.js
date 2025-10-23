#!/usr/bin/env node
const { Octokit } = require('@octokit/rest');
const fs = require('fs');

async function main() {
  const owner = process.env.GITHUB_REPOSITORY?.split('/')[0] || process.env.GH_OWNER || 'yuri41774';
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || process.env.GH_REPO || 'acess_test';
  const base = process.env.BASE_SHA;
  const head = process.env.HEAD_SHA;
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.error('GITHUB_TOKEN is required');
    process.exit(2);
  }

  const octokit = new Octokit({ auth: token });

  // get commits between base..head
  let commits = [];
  try {
    const res = await octokit.repos.compareCommits({ owner, repo, base, head });
    commits = res.data.commits || [];
  } catch (err) {
    console.error('Error comparing commits:', err.message || err);
    process.exit(1);
  }

  const prMap = new Map();
  for (const c of commits) {
    try {
      const resp = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({ owner, repo, commit_sha: c.sha });
      const prs = resp.data || [];
      for (const pr of prs) prMap.set(pr.number, pr);
    } catch (e) {
      console.warn(`Warning: failed to list PRs for commit ${c.sha}: ${e.message || e}`);
    }
  }

  // fallback: list merged PRs between dates
  if (prMap.size === 0) {
    try {
      const headCommit = await octokit.repos.getCommit({ owner, repo, ref: head });
      const baseCommit = await octokit.repos.getCommit({ owner, repo, ref: base });
      const since = baseCommit.data.commit.author.date;
      const until = headCommit.data.commit.author.date;

      // paginate PRs closed and collect merged in timeframe
      for await (const response of octokit.paginate.iterator(octokit.pulls.list, { owner, repo, state: 'closed', per_page: 100 })) {
        for (const pr of response.data) {
          if (pr.merged_at && pr.merged_at >= since && pr.merged_at <= until) {
            prMap.set(pr.number, pr);
          }
        }
      }
    } catch (e) {
      console.warn('Fallback PR collection failed:', e.message || e);
    }
  }

  let changelog = '';
  if (prMap.size === 0) {
    changelog = commits.map(c => `- ${c.commit.message.split('\n')[0]} (${c.commit.author && c.commit.author.name ? c.commit.author.name : c.commit.committer && c.commit.committer.name ? c.commit.committer.name : c.author && c.author.login ? c.author.login : 'unknown'})`).join('\n') || 'No commits/prs found for this release.';
  } else {
    const prs = Array.from(prMap.values()).sort((a,b)=> (a.merged_at || '') > (b.merged_at || '') ? 1 : -1);
    changelog = prs.map(p => `- PR #${p.number}: ${p.title} (${p.user.login}) - https://github.com/${owner}/${repo}/pull/${p.number}`).join('\n');
  }

  // print to stdout and also write to changelog.txt
  console.log(changelog);
  fs.writeFileSync('changelog.txt', changelog);
  // also write to GITHUB_OUTPUT if available
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `changelog<<EOF\n${changelog}\nEOF\n`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
