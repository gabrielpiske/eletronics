# ⚡ Arena Eletrônica SENAI — Simbologia & Conceitos Básicos

Plataforma gamificada interativa desenvolvida para a Unidade Curricular **Técnicas de Manutenção Eletrônica** (Curso de Aprendizagem Industrial de Eletrônico de Manutenção Industrial — SENAI).

## 🎮 Como Funciona

* **Acesso Estilo Kahoot (PIN + Apelido + Ranking ao Vivo):**
  * O professor acessa `/host`, escolhe **qualquer um dos 5 minigames isoladamente** e gera um **PIN de 6 dígitos + QR Code**.
  * Os alunos entram pelo celular ou computador digitando apenas o **PIN + Apelido**.
  * O telão do professor vira uma **Corrida de Ranking ao Vivo** com combos, eventos da bancada em tempo real e **Pódio Top 3** (com exportação em CSV e troca rápida de minigame na mesma sala sem mudar o PIN!).

## 🕹️ Os 5 Minigames Independentes

1. 🏭 **Esteira Maluca de Componentes (`ConveyorGame.tsx`):** Símbolos passam em uma esteira rolante e o aluno precisa classificar/direcionar cada peça para a caixa coletora certa antes que caia.
2. 🔍 **Radar do Circuito (`CircuitRadarGame.tsx`):** Um esquema elétrico completo aparece na tela e o aluno toca diretamente no símbolo pedido dentro da malha do circuito.
3. 🎨 **Oficina do Resistor (`ResistorBuilderGame.tsx`):** O aluno pinta interativamente as 3 faixas de cores em um resistor até atingir o valor em Ohms pedido na ordem de bancada.
4. ⚡ **Conexão de Bancada (`BenchMatchGame.tsx`):** Tabuleiro onde o aluno conecta os pares `Símbolo Esquemático ↔ Letra na Placa & Função Básica` para limpar níveis de placas.
5. 🕵️ **Símbolo sob Fumaça (`SmokeDetectiveGame.tsx`):** O símbolo vai saindo da fumaça aos poucos enquanto 3 pistas básicas aparecem — quanto antes o aluno deduzir a peça, mais pontos ganha.

---

## 🚀 Como Rodar Localmente

```bash
npm install
npm run dev
```
Acesse `http://localhost:3000`.
> **Dica:** Mesmo sem configurar o Firebase, o sistema ativa automaticamente o **Modo Sincronizado Local (Multi-Abas)** para que você possa testar `/host` em uma aba e `/play/[pin]` em outra imediatamente!

---

## ☁️ Como Fazer Deploy (Vercel + Firebase Realtime Database)

1. No [Console do Firebase](https://console.firebase.google.com/), crie um projeto gratuito (**Spark Plan**).
2. No menu lateral, ative o **Realtime Database** e copie a URL do banco (`https://seu-projeto-default-rtdb.firebaseio.com`) e as credenciais do Web App.
3. Na aba **Regras (Rules)** do Realtime Database, cole o conteúdo do arquivo [`database.rules.json`](./database.rules.json).
4. Suba este repositório no GitHub e importe na [Vercel](https://vercel.com/).
5. Nas configurações da Vercel (**Environment Variables**), adicione as variáveis listadas em [`.env.example`](./.env.example):
   * `NEXT_PUBLIC_FIREBASE_API_KEY`
   * `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   * `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   * `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   * `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   * `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   * `NEXT_PUBLIC_FIREBASE_APP_ID`
6. Clique em **Deploy** e pronto!
