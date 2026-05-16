const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const runtimeDir = path.join(root, 'build', 'offline-runtime')
const wheelhouseDir = path.join(runtimeDir, 'wheelhouse')
const pythonArchive = path.join(runtimeDir, 'python.tar.gz')

const releaseDate = '20260310'
const pythonVersion = '3.11.15'
const pythonUrl = `https://github.com/astral-sh/python-build-standalone/releases/download/${releaseDate}/cpython-${pythonVersion}%2B${releaseDate}-x86_64-pc-windows-msvc-install_only.tar.gz`
const bundledPackages = ['uv==0.11.14', 'open-webui==0.9.5', 'open-terminal==0.11.34']

function run(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(' ')}`)
  execFileSync(command, args, { stdio: 'inherit', ...options })
}

function output(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf-8', ...options }).trim()
}

fs.mkdirSync(wheelhouseDir, { recursive: true })

if (!fs.existsSync(pythonArchive)) {
  run('curl', ['-L', '--fail', '--retry', '3', '--retry-delay', '5', '-o', pythonArchive, pythonUrl])
} else {
  console.log(`Using existing ${pythonArchive}`)
}

const pythonRoot = path.join(os.tmpdir(), 'open-webui-desktop-winpy-download-env')
const pythonDir = path.join(pythonRoot, 'python')
const pythonExe = path.join(pythonDir, 'python.exe')
fs.rmSync(path.join(runtimeDir, 'python-download-env'), { recursive: true, force: true })

if (!fs.existsSync(pythonExe)) {
  fs.rmSync(pythonRoot, { recursive: true, force: true })
  fs.mkdirSync(pythonRoot, { recursive: true })
  run('tar', ['-xzf', pythonArchive, '-C', pythonRoot])
}

if (process.platform === 'win32') {
  run(pythonExe, [
    '-m',
    'pip',
    'download',
    '--only-binary=:all:',
    '--dest',
    wheelhouseDir,
    ...bundledPackages
  ])
} else {
  const wheelhouseWindowsPath = output('winepath', ['-w', wheelhouseDir])
  run('wine', [
    pythonExe,
    '-m',
    'pip',
    'download',
    '--only-binary=:all:',
    '--dest',
    wheelhouseWindowsPath,
    ...bundledPackages
  ], {
    env: {
      ...process.env,
      WINEDEBUG: process.env.WINEDEBUG || '-all'
    }
  })
}

fs.writeFileSync(
  path.join(runtimeDir, 'README.txt'),
  [
    `Open WebUI Desktop offline runtime (${os.platform()} build host)`,
    '',
    `Python: ${pythonVersion}`,
    `Packages: ${bundledPackages.join(', ')}`,
    '',
    'This directory is bundled into the Windows installer so first-run setup can install Python packages from local wheels without downloading model files.',
    ''
  ].join('\n')
)

console.log('Offline runtime prepared:', runtimeDir)
