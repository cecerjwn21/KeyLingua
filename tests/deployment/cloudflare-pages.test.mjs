import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const buildRoot = path.join(repositoryRoot, 'build')

test('Cloudflare 根網域 build 使用根路徑資源', async () => {
  const html = await readFile(path.join(buildRoot, 'index.html'), 'utf8')

  assert.match(html, /src="\/assets\//)
  assert.match(html, /href="\/assets\//)
  assert.match(html, /href="\/manifest\.json"/)
  assert.doesNotMatch(html, /(?:src|href)="\.\/assets\//)
})

test('Cloudflare 根網域 build 保留 PWA manifest 與必要圖示', async () => {
  const manifest = JSON.parse(await readFile(path.join(buildRoot, 'manifest.json'), 'utf8'))

  assert.equal(manifest.id, '/')
  assert.equal(manifest.start_url, '/')
  assert.equal(manifest.scope, '/')
  assert.equal(manifest.display, 'standalone')

  for (const iconPath of ['android-chrome-192x192.png', 'android-chrome-512x512.png']) {
    await access(path.join(buildRoot, iconPath))
  }
})

test('Cloudflare 根網域 build 不輸出 GitHub Pages 404 redirect hack', async () => {
  await assert.rejects(access(path.join(buildRoot, '404.html')), { code: 'ENOENT' })

  const html = await readFile(path.join(buildRoot, 'index.html'), 'utf8')
  assert.doesNotMatch(html, /Single Page Apps for GitHub Pages/)
  assert.doesNotMatch(html, /l\.search\[1\] === '\/'/)
})
