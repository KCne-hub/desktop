const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const runtimeDir = path.join(root, 'build', 'offline-runtime')
const wheelhouseDir = path.join(runtimeDir, 'wheelhouse')
const pythonArchive = path.join(runtimeDir, 'python.tar.gz')

const releaseDate = '20260310'
const pythonVersion = '3.12.13'
const pythonUrl = `https://github.com/astral-sh/python-build-standalone/releases/download/${releaseDate}/cpython-${pythonVersion}%2B${releaseDate}-x86_64-pc-windows-msvc-install_only.tar.gz`

function run(command, args) {
  console.log(`$ ${command} ${args.join(' ')}`)
  execFileSync(command, args, { stdio: 'inherit' })
}

fs.mkdirSync(wheelhouseDir, { recursive: true })

if (!fs.existsSync(pythonArchive)) {
  run('curl', ['-L', '--fail', '--retry', '3', '--retry-delay', '5', '-o', pythonArchive, pythonUrl])
} else {
  console.log(`Using existing ${pythonArchive}`)
}

run('uvx', [
  '--from',
  'pip',
  'pip',
  'download',
  '--platform',
  'win_amd64',
  '--python-version',
  '3.12',
  '--only-binary=:all:',
  '--dest',
  wheelhouseDir,
  'uv'
])

console.log('Offline runtime prepared:', runtimeDir)
