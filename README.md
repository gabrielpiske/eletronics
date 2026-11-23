# ⚡ Arena Eletrônica SENAI — V2.0

Plataforma gamificada interativa desenvolvida para a Unidade Curricular **Técnicas de Manutenção Eletrônica** (Curso de Aprendizagem Industrial de Eletrônico de Manutenção Industrial — SENAI/SC, Timbó).

Combina **salas competitivas ao vivo estilo Kahoot** (PIN + QR Code + telão em tempo real), **catálogo normalizado de 35 componentes eletrônicos** (incluindo Eletrônica Digital e Portas Lógicas), **treino individual com salvamento automático de XP**, **motor procedural + IA Gemini** e um **sistema completo de carreira técnica** com 100 níveis, 21 patentes, 58 conquistas e ranking global.

---

## ✨ Principais Recursos

### 🎮 Salas Competitivas ao Vivo (`/host` e `/play/[pin]`)
- **Acesso Instantâneo:** o docente escolhe qualquer um dos **6 módulos independentes** (5 Fundamentos & Simbologia + 1 Desafio Industrial por Ordem de Serviço), define a duração e gera um **PIN de 6 dígitos + QR Code + link copiável**.
- **7 Modos de Duração de Sessão:**
  - **Rápidos / Padrão:** `1m30 (90s)`, `2m (120s)`, `3m (180s)`, `4m (240s)`
  - **Estendidos / Maratona:** `5m (300s)`, `7m (420s)`, `10m (600s)` *(recomendados para a Estação de Reparo de PCI)*
- **Troca Dinâmica no Mesmo PIN:** o docente pode alternar o **módulo** ou o **tempo da rodada** diretamente no **Lobby** ou no **Pódio Final** sem gerar novo PIN e sem desconectar os alunos.
- **Telão ao Vivo & Relatório Docente:** corrida de ranking em tempo real com combos, níveis de bancada, log de telemetria (com poda automática para sessões longas), simulador de 3 alunos demo (`+ Simular 3 Alunos`), pódio Top 3 e **exportação em `.CSV`**.

### 🕹️ Os 6 Minigames Independentes (2 Trilhas)
Todos os módulos compartilham o contrato `onScoreAction`, suportam rodadas longas de até 10 minutos e contam com **Sistema de Penalidades Progressivas, Intertravamento de Segurança e Proteção Anti-Autoclique** (`PenaltySystem.tsx`):

#### Trilha 01 — Fundamentos & Simbologia (5 módulos)
1. 🏭 **Esteira de Componentes (`ConveyorGame.tsx`):** triagem rápida sobre esteira com velocidade progressiva. Alterna entre classificação por *Família Tecnológica* (Passivos, Semicondutores, Proteção & Energia, Digital & Lógica) e identificação direta de *Nome + Designador PCI* entre os 35 componentes.
2. 🔍 **Radar do Circuito (`CircuitRadarGame.tsx`):** inspeção espacial em **3 topologias esquemáticas completas** (12 nós cada — Fonte Linear + Sensor Óptico, Lógica Digital & Alarme Industrial, e Controle de Potência AC/DC), alternando modos de diagnóstico por sintoma, função no estágio e busca por designador.
3. 🎨 **Oficina do Resistor (`ResistorBuilderGame.tsx`):** gerador procedural da **série comercial E12/E24 + Lei de Ohm** (126 valores distintos com contextos reais de bancada). O aluno pinta interativamente a 1ª faixa, 2ª faixa e o multiplicador e afere no multímetro virtual, com consulta opcional à tabela de cores.
4. ⚡ **Conexão de Bancada (`BenchMatchGame.tsx`):** tabuleiros progressivos de associação `Símbolo Esquemático ↔ Designador na Placa & Função/Pista` (6 pares por placa), evoluindo de nível continuamente sem repetir as últimas 6 peças.
5. 🕵️ **Diagnóstico por Pistas (`SmokeDetectiveGame.tsx`):** símbolo inicialmente desfocado que ganha nitidez em 3 estágios enquanto 3 pistas técnicas progressivas são reveladas (120 / 80 / 45 pts). Combina **Motor Procedural V2** com geração dinâmica opcional via **Google Gemini API** (`/api/ai-challenge`).

#### Trilha 02 — Desafio Industrial • Ordem de Serviço (1 módulo, 4 casos curados)
6. 🔧 **Estação de Reparo de PCI (`IndustrialRepairGame.tsx`):** atendimento de OS (`OS-SOL-01` a `OS-SOL-04`) com inspeção visual em PCI PTH/SMD usando **zoom, arraste (pan), lupa óptica virtual e hotspots acessíveis**, diagnóstico de defeitos físicos (solda trincada, ponte de solda, polaridade invertida, SMD deslocado), escolha de procedimento seguro e **comparação visual Antes/Depois**.

### 🛡️ Penalidades Progressivas e Anti-Autoclique
- **Disjuntor Progressivo:** falhas consecutivas aplicam penalidade crescente e tempo de bloqueio de rearme:
  - 1ª falha: `-40 pts` e `2,5s` de bloqueio
  - 2ª falha seguida: `-70 pts` e `4,0s` de bloqueio
  - 3ª+ falhas seguidas: `-110 pts` e `6,0s` de bloqueio
- **Proteção Anti-Autoclique:** 4+ cliques em `< 480ms` acionam bloqueio de `5,0s` e penalidade de `-90 pts`.

### 📖 Catálogo Normalizado & Treino Solo (`/practice`)
- **Catálogo de 35 Componentes (PCI / IEC / ANSI):** filtrado em 4 categorias:
  - **Passivos (7)** · **Semicondutores (10)** · **Proteção & Energia (10)** · **Digital & Portas Lógicas (8)**
- **Bancada Solo (+XP Automático):** permite treinar qualquer minigame no próprio ritmo, salvando XP automaticamente ao final de cada jogatina (5 desafios ou 6 pares no Conexão de Bancada) ou sob demanda pelo botão *Finalizar & Salvar XP*.

### 🏆 Perfil, Carreira Técnica e Ranking Global (`/profile` e `/leaderboard`)
- **Autenticação Google OAuth** via Firebase Auth + fallback de **Acesso Rápido Educacional** (sem bloqueio em laboratório).
- **Progressão de Carreira:** **100 Níveis** com curva quadrática estritamente crescente até **1.000.000 XP**, divididos em **21 Patentes Técnicas** (a cada 5 níveis, em 8 divisões: *Bronze, Prata, Ouro, Platina, Esmeralda, Diamante, Mestre e Lendário*).
- **58 Conquistas Técnicas** (de *Fácil* a *Lendário* em 7 categorias) com recompensas extras de XP e barras de progresso individuais.
- **Ranking Global Multi-Período:** visualização **Semanal**, **Mensal** e **Geral**, ordenável por XP, Precisão ou Maior Combo, além de **Modo Admin do Docente** validado no servidor (`/api/admin-auth`) para zerar temporada, ajustar XP ou remover perfis.

---

## 🗺️ Rotas da Aplicação

| Rota | Finalidade |
| :--- | :--- |
| `/` | Terminal de entrada rápida do aluno por PIN (6 dígitos) + apelido + avatar |
| `/host` | Painel do professor (criação de sala, Lobby, QR Code, ranking ao vivo, Pódio e CSV) |
| `/play/[pin]` | Tela do aluno conectada à sala em tempo real (Lobby, Minigame ativo, Resumo & XP) |
| `/practice` | Catálogo interativo de 35 símbolos + Treino Individual (Solo) com auto-save de XP |
| `/profile` | Perfil do aluno, vinculação Google, 21 Patentes, 100 Níveis, 58 Conquistas e histórico |
| `/leaderboard` | Ranking Global (Semanal / Mensal / Geral) e controles administrativos do docente |
| `/api/ai-challenge` | Endpoint `POST` para geração de casos técnicos (Gemini 2.5 Flash com fallback procedural) |
| `/api/admin-auth` | Endpoint `POST` server-side para validação segura do PIN administrativo do docente |
| `/intencionalidade-pedagogica.html` | Documento técnico-pedagógico (MSEP / BNCC) pronto para impressão/PDF |

---

## 🧱 Stack e Estrutura de Pastas

- **Framework:** Next.js `14.2.24` (App Router) + React `18.3` + TypeScript (`strict: true`)
- **Estilização:** Tailwind CSS `3.4` + Lucide Icons + `qrcode.react` + `canvas-confetti`
- **Backend / Sync:** Firebase `11.1` (Realtime Database + Google Auth) com fallback automático local multi-abas (`localStorage` + `BroadcastChannel`)
- **IA Opcional:** Google Gemini API (`gemini-2.5-flash`) via `GEMINI_API_KEY`

```text
├── public/
│   ├── images/industrial/                 # 3 cenários fotográficos genéricos (ESD, PCI PTH e PCI SMD)
│   └── intencionalidade-pedagogica.html   # Versão web/imprimível servida no rodapé
├── src/
│   ├── app/
│   │   ├── api/ai-challenge/route.ts      # Geração de desafios via Gemini / procedural
│   │   ├── host/page.tsx                  # Painel do Professor (2 trilhas, 6 módulos, tempos até 10m)
│   │   ├── leaderboard/page.tsx           # Ranking Semanal/Mensal/Geral + Modo Admin
│   │   ├── play/[pin]/page.tsx            # Experiência do aluno em sala ao vivo
│   │   ├── practice/page.tsx              # Catálogo 35 componentes + Treino Solo (6 módulos)
│   │   ├── profile/page.tsx               # Carreira, Patentes, Conquistas e Histórico
│   │   ├── layout.tsx / page.tsx          # Layout base (Inter + JetBrains Mono) e Home
│   ├── components/
│   │   ├── ElectronicSymbolSVG.tsx        # Renderizador SVG normatizado dos 35 símbolos
│   │   ├── Navbar.tsx / Footer.tsx        # Navegação global, modal Auth e rodapé
│   │   └── minigames/                     # 6 minigames + PenaltySystem + industrial/ (OS compartilhado)
│   ├── data/
│   │   ├── electronicsData.ts             # Catálogo de 35 componentes, cores e 6 minigames
│   │   ├── industrialChallengesData.ts    # 4 Ordens de Serviço curadas (Estação de Reparo de PCI)
│   │   └── achievementsData.ts            # 100 níveis, 21 patentes e 58 conquistas
│   └── lib/
│       ├── firebase.ts                    # Inicialização segura Auth + RTDB
│       ├── roomService.ts                 # Salas, durações, eventos, poda e sync local/RTDB
│       ├── profileService.ts              # Perfis, XP, conquistas, períodos e admin
│       └── challengeGenerator.ts          # Geradores procedurais (E24, 3 Topologias, Detetive)
├── database.rules.json                    # Regras do Firebase Realtime Database
├── ARCHITECTURE.md                        # Guia técnico detalhado de arquitetura
├── DESAFIOS_INDUSTRIAIS_PROPOSTA.md       # Especificação funcional dos 3 Desafios Industriais
├── INTENCIONALIDADE_PEDAGOGICA.md         # Documento pedagógico (Markdown)
└── INTENCIONALIDADE_PEDAGOGICA.html       # Documento pedagógico (HTML imprimível)
```

---

## 🚀 Como Rodar Localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

> **Modo Sincronizado Local Automático:** mesmo sem preencher o `.env.local`, o sistema ativa automaticamente o modo local com `localStorage` + `BroadcastChannel`. Você pode abrir `/host` em uma aba e `/play/[pin]` em outra imediatamente.
>
> **Nota para Windows PowerShell:** se a política de execução bloquear `npm.ps1` / `npx.ps1`, execute utilizando `npm.cmd run dev`, `npm.cmd run build` e `npx.cmd tsc --noEmit`.

### Variáveis de Ambiente (`.env.local`)
Copie [`.env.example`](./.env.example) para `.env.local` se desejar ativar Firebase e/ou IA:

| Variável | Obrigatória? | Descrição |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Para modo online | API Key do Web App Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Para Google OAuth | Domínio de autenticação (`<proj>.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Para modo online | URL do Realtime Database (`https://...firebaseio.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Para modo online | ID do projeto Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Opcional | Bucket do projeto Firebase |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Opcional | Sender ID do Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Opcional | App ID do Firebase |
| `GEMINI_API_KEY` | Opcional | Ativa geração de laudos inéditos via Gemini no *Diagnóstico por Pistas* |
| `ADMIN_PIN` | Opcional | Define o PIN administrativo do docente validado em `/api/admin-auth` |

---

## ☁️ Deploy (Vercel + Firebase)

1. No [Console do Firebase](https://console.firebase.google.com/), crie um projeto (plano **Spark** gratuito).
2. Ative o **Realtime Database** e aplique as regras de [`database.rules.json`](./database.rules.json).
3. (Opcional) Em **Authentication → Sign-in method**, habilite **Google** e adicione o domínio da Vercel em **Settings → Authorized domains**.
4. Importe o repositório na [Vercel](https://vercel.com/) e cadastre as variáveis de ambiente listadas acima.
5. Execute o deploy.

---

## 📚 Documentação Complementar

- **[ARCHITECTURE.md](./ARCHITECTURE.md):** arquitetura técnica completa, modelos de dados, caminhos no Firebase RTDB, otimizações de sessões longas, fórmulas de XP e convenções do projeto.
- **[INTENCIONALIDADE_PEDAGOGICA.md](./INTENCIONALIDADE_PEDAGOGICA.md)** / **[INTENCIONALIDADE_PEDAGOGICA.html](./INTENCIONALIDADE_PEDAGOGICA.html):** fundamentação metodológica alinhada à MSEP (SENAI/SC), capacidades técnicas da UC e roteiro docente.

---

Desenvolvido por **[Gabriel Piske](https://piske.online/)** • SENAI/SC — Timbó.
