# Uso da CLI

## Fluxo recomendado

```bash
npx repolaunch init
npx repolaunch analyze --text "Fiz um curso de IA e quero um projeto para portfolio"
npx repolaunch generate --mode technical
npx repolaunch export --format json
```

## Modos de output

- `technical`: foco em arquitetura, riscos e plano tecnico
- `recruiter`: foco em impacto e narrativa de carreira
- `simplified`: foco em clareza e passos curtos

## Formatos de export

- `json`: manifesto dos arquivos gerados
- `markdown`: manifesto em formato legivel
- `issues`: sugestoes estruturadas para GitHub issues

## Exemplos

- Veja [docs/examples/technical.md](docs/examples/technical.md)
- Veja [docs/examples/recruiter.md](docs/examples/recruiter.md)
- Veja [docs/examples/simplified.md](docs/examples/simplified.md)
