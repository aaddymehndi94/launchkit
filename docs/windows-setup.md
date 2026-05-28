# Windows Setup

## Required Installs

Use Windows Terminal with PowerShell:

```powershell
winget install --id Microsoft.WindowsTerminal -e
winget install --id Git.Git -e
winget install --id Microsoft.VisualStudioCode -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Docker.DockerDesktop -e
winget install --id Amazon.AWSCLI -e
```

Restart the terminal, then:

```powershell
corepack enable
corepack prepare pnpm@10.13.1 --activate
```

Before running local database commands, Docker Desktop must be open and fully running:

```powershell
docker --version
docker compose version
docker info
```

`docker info` must succeed before `pnpm db:local:up`.

## Common Windows Issues

- If `git`, `node`, or `corepack` is not recognized, restart Windows Terminal.
- If Docker commands fail, open Docker Desktop and wait until it says the engine is running.
- If you see `npipe:////./pipe/docker_engine`, Docker Desktop is installed but the Docker daemon is not running. Open Docker Desktop from the Start menu, wait for it to finish starting, then open a new PowerShell window.
- If Docker Desktop does not start, restart Windows once, then run `wsl --status`. If WSL is missing, run `wsl --install`, restart Windows, then run `wsl --update`.
- If CDK cannot find credentials, set `$env:AWS_PROFILE="launchkit-dev"` in that terminal.
- If PowerShell blocks scripts, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Recommended VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- AWS Toolkit
- Docker
