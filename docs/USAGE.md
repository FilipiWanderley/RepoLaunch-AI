# Uso da CLI

## Fluxo recomendado

```bash
npx repolaunch init
npx repolaunch analyze --text "Fiz um curso de IA e quero um projeto para portfolio"
npx repolaunch generate --mode technical --template portfolio-project
npx repolaunch generate --prompt-version v2 --mode technical --template portfolio-project
npx repolaunch prompts list
npx repolaunch repo-analyze .
npx repolaunch github-sync --repo FilipiWanderley/RepoLaunch-AI
npx repolaunch export --format json

## API HTTP

- subir API: `npm run dev:api`
- `GET /api/health`: status da API
- `GET /api/health/details`: health detalhado com checks operacionais
- `GET /api/prompts`: versoes disponiveis de prompt
- `POST /api/generate`: gera arquivos por payload
- `GET /api/history?limit=10`: lista geracoes recentes
- `GET /api/history/:generationId/export.zip`: baixa zip da geracao
- `GET /api/metrics?windowMinutes=15`: metricas de requests, erros, status code e janela temporal
- `GET /api/collab/projects`: lista workspaces colaborativos
- `POST /api/collab/projects`: cria workspace colaborativo
- `POST /api/collab/projects/:projectId/generations`: vincula uma geracao ao workspace

Headers opcionais:

- `x-api-token`: obrigatorio quando `API_AUTH_TOKEN` estiver definido no backend

Exemplo de payload para `POST /api/generate`:

```json
{
	"text": "Quero criar um projeto com foco em portfolio e execucao",
	"mode": "technical",
	"template": "portfolio-project",
	"promptVersion": "v2",
	"outputFiles": ["README.md", "ARCHITECTURE.md"]
}
```
```

## Modos de output

- `technical`: foco em arquitetura, riscos e plano tecnico
- `recruiter`: foco em impacto e narrativa de carreira
- `simplified`: foco em clareza e passos curtos

## Templates de projeto

- `portfolio-project`: narrativa orientada a portfolio e carreira
- `saas`: foco em valor continuo, onboarding e retencao
- `cli-tool`: foco em comandos, automacao e UX de terminal
- `ai-workflow`: foco em prompts, fallback e resiliencia de IA

## Formatos de export

- `json`: manifesto dos arquivos gerados
- `markdown`: manifesto em formato legivel
- `issues`: sugestoes estruturadas para GitHub issues

## Versionamento de prompt

- `--prompt-version`: seleciona a versao de prompt para o comando `generate`
- fallback automatico: se a versao nao existir, o sistema usa `DEFAULT_PROMPT_VERSION` do `.env`
- registry externo: `config/prompt-registry.json` (opcional)
- listar versoes: `repolaunch prompts list`

## Seguranca da API

- `API_AUTH_TOKEN`: protege endpoints da API local com token
- `API_RATE_LIMIT_WINDOW_MS`: janela de rate limit por IP
- `API_RATE_LIMIT_MAX`: limite de requisicoes por IP dentro da janela

## Exemplos

- Veja [docs/examples/technical.md](docs/examples/technical.md)
- Veja [docs/examples/recruiter.md](docs/examples/recruiter.md)
- Veja [docs/examples/simplified.md](docs/examples/simplified.md)
