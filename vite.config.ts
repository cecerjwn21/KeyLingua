import react from '@vitejs/plugin-react'
import { promises as fs } from 'fs'
import { getLastCommit } from 'git-last-commit'
import jotaiDebugLabel from 'jotai/babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai/babel/plugin-react-refresh'
import path from 'node:path'
import { visualizer } from 'rollup-plugin-visualizer'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vite'
import type { PluginOption } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const isPagesDeployment = process.env.REACT_APP_DEPLOY_ENV === 'pages'
  let buildOutputDirectory = path.resolve(__dirname, 'build')
  const githubPagesRedirectScript =
    /\s*<script type="text\/javascript">\s*\/\/ Single Page Apps for GitHub Pages[\s\S]*?<\/script>/
  const latestCommitHash = await new Promise<string>((resolve) => {
    return getLastCommit((err, commit) => (err ? 'unknown' : resolve(commit.shortHash)))
  })
  return {
    base: isPagesDeployment ? './' : '/',
    plugins: [
      react({ babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] } }),
      visualizer() as PluginOption,
      Icons({
        compiler: 'jsx',
        jsx: 'react',
        customCollections: {
          'my-icons': {
            xiaohongshu: () => fs.readFile('./src/assets/xiaohongshu.svg', 'utf-8'),
          },
        },
      }),
      {
        name: 'deployment-output-compatibility',
        apply: 'build',
        configResolved(config) {
          buildOutputDirectory = path.resolve(config.root, config.build.outDir)
        },
        transformIndexHtml(html) {
          return isPagesDeployment ? html : html.replace(githubPagesRedirectScript, '')
        },
        async closeBundle() {
          if (!isPagesDeployment) {
            await fs.rm(path.join(buildOutputDirectory, '404.html'), { force: true })
          }
        },
      },
    ],
    build: {
      minify: true,
      outDir: 'build',
      sourcemap: false,
    },
    esbuild: {
      drop: mode === 'development' ? [] : ['console', 'debugger'],
    },
    define: {
      REACT_APP_DEPLOY_ENV: JSON.stringify(process.env.REACT_APP_DEPLOY_ENV),
      LATEST_COMMIT_HASH: JSON.stringify(latestCommitHash + (process.env.NODE_ENV === 'production' ? '' : ' (dev)')),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
  }
})
