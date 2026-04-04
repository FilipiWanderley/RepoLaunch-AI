# 🚀 RepoLaunch AI

### Transforme aprendizado em projetos reais prontos para GitHub

> Construído por **FilipiWanderley** — focado em transformar aprendizado em execução real.

---

## 🔥 Por que esse projeto existe?

A maioria das pessoas aprende… mas trava aqui:

* ❌ “Não sei que projeto fazer”
* ❌ “Não sei estruturar direito”
* ❌ “Não sei montar um README bom”
* ❌ “Não sei transformar isso em algo que recrutador veja valor”

👉 **RepoLaunch AI resolve exatamente isso.**

---

## 🧠 O que ele faz

Você fornece:

* 📄 Anotações (Markdown / TXT)
* 📁 Pasta de código
* 💡 Ideias soltas
* 📚 Conteúdo de cursos (ex: Anthropic Academy)

E ele gera:

* 📘 `README.md` profissional
* 🧱 `ARCHITECTURE.md`
* 🗺 `ROADMAP.md`
* 📋 `PROJECT_PLAN.md`
* 🎯 `PORTFOLIO_PITCH.md`
* 🐛 Sugestões de issues

---

## ⚡ Resultado em poucos segundos

**Input:**

> “Fiz um curso de IA e quero criar algo com isso”

**Output:**

* projeto estruturado
* arquitetura definida
* plano de execução
* pitch pronto pra LinkedIn

---

## 🚀 Quick Start

```bash
git clone https://github.com/FilipiWanderley/repolaunch-ai
cd repolaunch-ai
cp .env.example .env
# adicione sua API KEY

npm install
npx repolaunch init
npx repolaunch analyze ./meus-arquivos
npx repolaunch generate
```

---

## 🧱 Arquitetura (nível profissional)

```
CLI Layer
   ↓
Controller Layer
   ↓
Service Layer
   ↓
AI Engine
   ↓
Template Engine
   ↓
Output Generator
```

---

## 🧩 Stack Tecnológica

### Backend / CLI

* Node.js + TypeScript
* Commander / Yargs

### AI

* Claude (Anthropic API)
* fallback: OpenAI

### Processamento

* file parsing (markdown, txt)
* template engine custom

### Dev Tools

* dotenv
* zod (validação)
* jest (testes)

---

## 🔐 Segurança (nível produção)

* 🔑 API keys via `.env` (nunca expostas)
* 🧼 sanitização de inputs
* 🛡 proteção contra prompt injection básico
* ⚠️ controle de erros sem vazamento de dados
* 📊 logs estruturados (sem dados sensíveis)
* 🚫 limitação de payload (evita abuso)

---

## 🧠 Como funciona

1. Usuário fornece input (texto, arquivos ou repo)
2. Sistema analisa contexto
3. AI gera estrutura do projeto
4. Template organiza os outputs
5. Arquivos são gerados automaticamente

---

## 💡 Casos de uso reais

### 👨‍💻 Devs

* transformar estudo em projeto
* gerar documentação profissional

### 🎓 Estudantes

* montar portfólio rápido
* estruturar aprendizado

### 🧠 Criadores

* organizar ideias em produto

---

## 🧪 Engenharia por trás (o que recrutadores vão notar)

Projeto idealizado e construído por **FilipiWanderley**, com foco em:

* arquitetura modular
* separação clara de responsabilidades
* engine de templates reutilizável
* camada de abstração para AI
* CLI profissional
* design orientado a produto
* preocupação com segurança

---

## 📦 Estrutura do projeto

```
src/
 ├── cli/
 ├── controllers/
 ├── services/
 ├── ai/
 ├── templates/
 ├── utils/

outputs/
prompts/
config/
tests/
docs/
```

---

## 🧭 Roadmap

### v1 (MVP)

* geração de README
* roadmap
* plano de projeto

### v2

* análise de repositório existente
* integração com GitHub

### v3

* interface web
* colaboração
* exportação avançada

---

## 🌍 Por que isso pode te ajudar

Porque aprender não é suficiente.

👉 O que importa é **mostrar o que você construiu**

E esse projeto ajuda exatamente nisso.

---

## 🎓 Inspiração

Este projeto foi desenvolvido por **FilipiWanderley**, inspirado por aprendizados em IA aplicada, incluindo conteúdos da:

👉 **Anthropic Academy (gratuita)**

---

## 🤝 Contribuição

Contribuições são bem-vindas!

---

## ⭐ Se isso te ajudou

Dá uma estrela ⭐
Compartilha com alguém que também está aprendendo

---

## 🧠 Filosofia

> Aprender é ótimo.
> Construir é o que muda sua carreira.

---

## 🧑‍💻 Autor

### **FilipiWanderley**

* Engenheiro focado em IA aplicada
* Construindo ferramentas úteis para desenvolvedores
* Transformando aprendizado em execução real

---

# 🚀 RepoLaunch AI

**By FilipiWanderley**
Transforme aprendizado em projetos.
Transforme projetos em oportunidades.