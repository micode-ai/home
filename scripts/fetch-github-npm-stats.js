import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const productsPath = join(__dirname, '../src/data/products.json');
const outputPath = join(__dirname, '../src/data/community-stats.json');

const products = JSON.parse(readFileSync(productsPath, 'utf8'));

function extractGithubOwnerRepo(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

function extractNpmPackage(url) {
  const match = url.match(/npmjs\.com\/package\/(@?[^/?#]+(?:\/[^/?#]+)?)/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

async function fetchGithubStars(owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'User-Agent': 'micode-landing-page-build',
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) {
      console.warn(`  GitHub API returned ${res.status} for ${owner}/${repo}`);
      return null;
    }
    const data = await res.json();
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch (err) {
    console.warn(`  Failed to fetch GitHub stars for ${owner}/${repo}:`, err.message);
    return null;
  }
}

async function fetchNpmDownloads(packageName) {
  try {
    const url = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  npm API returned ${res.status} for ${packageName}`);
      return null;
    }
    const data = await res.json();
    return typeof data.downloads === 'number' ? data.downloads : null;
  } catch (err) {
    console.warn(`  Failed to fetch npm downloads for ${packageName}:`, err.message);
    return null;
  }
}

const stats = {};

for (const product of products) {
  console.log(`Fetching stats for ${product.id}...`);
  const productStats = { githubStars: null, npmWeeklyDownloads: null };

  for (const link of product.links ?? []) {
    if (link.type === 'github') {
      const gh = extractGithubOwnerRepo(link.url);
      if (gh) {
        productStats.githubStars = await fetchGithubStars(gh.owner, gh.repo);
        if (productStats.githubStars !== null) {
          console.log(`  GitHub stars: ${productStats.githubStars}`);
        }
      }
    } else if (link.type === 'npm') {
      const pkg = extractNpmPackage(link.url);
      if (pkg) {
        productStats.npmWeeklyDownloads = await fetchNpmDownloads(pkg);
        if (productStats.npmWeeklyDownloads !== null) {
          console.log(`  npm weekly downloads: ${productStats.npmWeeklyDownloads}`);
        }
      }
    }
  }

  stats[product.id] = productStats;
}

const output = {
  fetchedAt: new Date().toISOString(),
  stats,
};

writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
console.log('Community stats written to', outputPath);
