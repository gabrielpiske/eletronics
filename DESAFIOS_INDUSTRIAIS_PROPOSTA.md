# Proposta de Desafios Industriais Imersivos

**Projeto:** Arena Eletrônica SENAI — V2.0  
**Status:** especificação funcional e pedagógica para implementação  
**Escopo:** três novos minigames independentes, utilizáveis tanto em `/play/[pin]` quanto em `/practice`.

---

## 1. Propósito

Os cinco minigames atuais desenvolvem com qualidade a identificação de componentes, a leitura de esquemas, o código de resistores, a associação entre símbolo/designador/função e o raciocínio por pistas. Esta proposta amplia o percurso para situações mais próximas de uma manutenção industrial, sem repetir essas mesmas mecânicas.

Os novos desafios devem colocar o estudante no papel de técnico em atendimento de uma **ordem de serviço (OS)**. Cada OS apresenta contexto produtivo, sintoma, impacto operacional, evidências visuais e uma decisão técnica verificável. A experiência é uma simulação pedagógica: não substitui procedimentos de segurança, treinamento prático supervisionado ou normas aplicáveis ao ambiente de trabalho.

### Resultados esperados

- Relacionar procedimento técnico, segurança, evidência e decisão de manutenção.
- Exercitar capacidades ainda pouco exploradas na Arena: soldagem/dessoldagem, uso de instrumentos, consulta a datasheets/BOM e seleção de substitutos.
- Reforçar que um reparo correto não é apenas rápido: deve ser seguro, documentado e tecnicamente compatível.
- Aproximar a UI de uma bancada/laboratório industrial realista, preservando clareza, acessibilidade e coerência técnica.

---

## 2. Formato compartilhado: Ordem de Serviço Industrial

Os três módulos usam uma estrutura comum; eles não dependem um do outro e podem ser sorteados isoladamente em sala ou no treino solo.

1. **Abertura da OS:** identificação da máquina, setor, impacto na produção e sintoma reportado.
2. **Condições de trabalho:** aviso de segurança e estado do equipamento na simulação. Quando pertinente, o circuito de interação é apresentado como baixa tensão de comando (por exemplo, 24 Vcc).
3. **Evidências:** foto/ilustração realista da bancada, placa, instrumento, etiqueta de componente, esquema parcial ou extrato do datasheet.
4. **Decisão técnica:** sequência curta de ações no minigame.
5. **Fechamento:** diagnóstico/decisão esperada, justificativa técnica, evidências usadas e capacidade trabalhada.

### Estrutura da OS

| Campo | Exemplo |
|---|---|
| Código | `OS-SOL-01` |
| Contexto | Esteira de separação — setor de embalagem |
| Sintoma | Sensor fotoelétrico perde sinal de forma intermitente |
| Impacto | Paradas curtas e contagem incorreta de peças |
| Ativo visual | Foto de placa de interface, conector e lupa de bancada |
| Evidência decisiva | Solda trincada no conector de sinal |
| Condição de segurança | Circuito de comando simulado desenergizado para o reparo |
| Resultado | Reparo/medição/seleção de componente tecnicamente válida |

---

## 3. Minigame A — Estação de Reparo de PCI

### Conceito

O estudante recebe uma placa de interface ou condicionamento de sinal retirada de um equipamento industrial. Pela câmera/lupa virtual, deve localizar o defeito físico e escolher a sequência de reparo adequada para PTH ou SMD. O objetivo não é reproduzir uma estação de solda real com precisão operacional, mas ensinar a **tomada de decisão**, a inspeção e os critérios de qualidade do reparo.

### Fluxo de jogo

1. Ler a OS e reconhecer o tipo de montagem: PTH ou SMD.
2. Inspecionar áreas da placa com lupa virtual; somente algumas regiões contêm evidências relevantes.
3. Selecionar o defeito observado e o procedimento de bancada compatível.
4. Executar uma sequência simplificada de preparo, reparo e inspeção final.
5. Validar visualmente a qualidade da junta/reparo e concluir a OS.

### Mecânicas

- Imagem em alta definição com zoom, pan e hotspots discretos.
- Defeitos visuais plausíveis: solda trincada, ponte de solda, polaridade invertida, oxidação em terminal, junta insuficiente e componente SMD mal posicionado.
- Escolhas contextuais de ferramenta/processo, sem transformar a experiência em uma receita perigosa para trabalho real.
- Comparação final entre estado inicial e estado corrigido.
- Cronômetro opcional, sempre secundário à decisão segura e correta.

### Capacidades e conhecimentos mobilizados

- Aplicar técnicas de soldagem e dessoldagem de componentes eletrônicos.
- Identificar e avaliar componentes eletrônicos.
- Aplicar técnicas de localização de defeito por inspeção visual.
- Substituir componentes defeituosos.
- Procedimentos de segurança, ferramentas/equipamentos e componentes PTH/SMD.

### Banco inicial de casos curados

| ID | Contexto | Defeito técnico central | Montagem |
|---|---|---|---|
| `OS-SOL-01` | Interface de sensor fotoelétrico em esteira | Solda trincada em conector PTH de sinal | PTH |
| `OS-SOL-02` | Módulo de saída 24 Vcc | Ponte de solda em optoacoplador SMD | SMD |
| `OS-SOL-03` | Placa de sinalização de torre luminosa | Diodo de proteção montado com polaridade incorreta | PTH |
| `OS-SOL-04` | Condicionador de entrada de encoder | Resistor SMD deslocado após retrabalho | SMD |

---

## 4. Minigame B — Diagnóstico com Multímetro Seguro

### Conceito

Uma máquina apresenta uma falha de comando de baixa tensão. O estudante precisa organizar uma investigação: interpretar o sintoma, selecionar uma medição coerente, configurar o multímetro virtual e analisar a evidência. O módulo recompensa o raciocínio diagnóstico; não deve incentivar tentativa e erro em pontos aleatórios.

### Fluxo de jogo

1. Ler OS, sintoma e diagrama parcial da área de comando.
2. Selecionar a hipótese e o teste mais informativo.
3. Configurar o instrumento virtual com modo e faixa compatíveis com a grandeza solicitada.
4. Posicionar as pontas de prova nos pontos permitidos pela simulação.
5. Interpretar a leitura e decidir o próximo teste ou o diagnóstico.
6. Registrar causa provável e evidência que sustentou a conclusão.

### Mecânicas

- Multímetro visualmente realista, mas controles simplificados para o objetivo pedagógico.
- Leitura numérica consistente com a causa configurada no caso.
- Pontos de teste destacados somente depois de o estudante definir o teste; não revelar a resposta pela interface.
- Erros de procedimento na simulação interrompem a ação, explicam o motivo e aplicam uma penalidade pedagógica moderada.
- Cada caso aceita mais de uma sequência válida quando elas levam a evidência suficiente e segura.

### Capacidades e conhecimentos mobilizados

- Utilizar instrumentos de medidas elétricas.
- Realizar medições em componentes eletrônicos básicos.
- Aplicar técnicas de análise de circuitos e localização de defeito.
- Interpretar diagramas esquemáticos eletrônicos.
- Testes de continuidade, resistência ôhmica, comparação com esquema e análise de funcionamento.

### Banco inicial de casos curados

| ID | Contexto | Sintoma | Evidência decisiva esperada |
|---|---|---|---|
| `OS-MED-01` | Fonte de comando de esteira | Saída 24 Vcc instável sob carga | Queda de tensão no estágio de filtragem/regulação indicado pelo caso |
| `OS-MED-02` | Sensor fotoelétrico de contagem | Sensor alimentado, mas sem sinal de saída | Comparação correta entre alimentação e saída do sensor/interface |
| `OS-MED-03` | Módulo de relé de sinalização | Relé não aciona após comando | Evidência que separa falha de comando da falha da bobina/caminho de saída |
| `OS-MED-04` | Placa de entrada digital | Sinal permanece em estado lógico incorreto | Teste coerente do circuito de entrada e sua referência de 0 V |

---

## 5. Minigame C — Engenharia de Substituição: Datasheet e BOM

### Conceito

O componente original de uma placa está indisponível ou foi reprovado na inspeção. O estudante atua como técnico que precisa validar uma substituição, e não apenas escolher uma peça visualmente semelhante. Ele deve cruzar referência da placa, BOM, encapsulamento, pinagem e dados técnicos relevantes do datasheet.

### Fluxo de jogo

1. Ler a OS e localizar a referência/designador na foto da PCI.
2. Consultar um trecho de BOM e as fichas técnicas de candidatos.
3. Comparar critérios decisivos para a função exercida no circuito.
4. Aprovar um substituto compatível, reprovar opções inadequadas e registrar justificativa curta.
5. Receber devolutiva que explica por que uma peça aparentemente parecida seria incompatível.

### Mecânicas

- Cartões de datasheet legíveis, com dados reais ou fictícios tecnicamente validados.
- Comparação por atributos; não depender de decorar números isolados.
- Critérios possíveis: tipo do componente, encapsulamento, pinagem, polaridade, tensão/corrente máximas, função e característica específica relevante ao caso.
- Distratores plausíveis: componente com encapsulamento igual, mas pinagem ou característica elétrica incompatível.
- Relatório final em linguagem de manutenção: “aprovado”, “reprovado” e motivo técnico.

### Capacidades e conhecimentos mobilizados

- Interpretar tabelas, manuais, datasheets e lista de materiais.
- Avaliar características de componentes eletrônicos.
- Substituir componentes defeituosos.
- Identificar componentes e simbologia em contexto de placa real.
- Considerar qualidade, rastreabilidade e segurança na manutenção.

### Banco inicial de casos curados

| ID | Contexto | Item de decisão | Critério que não pode ser ignorado |
|---|---|---|---|
| `OS-DAT-01` | Módulo de saída de relé | Optoacoplador de reposição | Encapsulamento, pinagem e característica de transferência prevista no caso |
| `OS-DAT-02` | Interface de bobina 24 Vcc | Diodo de proteção | Polaridade, função de proteção e parâmetros compatíveis |
| `OS-DAT-03` | Placa de controle 5 V | Regulador de tensão | Pinagem, tensão de saída, capacidade compatível e encapsulamento |
| `OS-DAT-04` | Entrada de sensor industrial | Transistor/MOSFET de comutação | Tipo, pinagem, tensão/corrente e requisito de acionamento definidos no caso |

---

## 6. Direção visual: realismo controlado

O realismo deve apoiar a aprendizagem, e não esconder a evidência técnica ou transformar a atividade em um jogo de achar objetos.

### Requisitos visuais

- Ambiente de laboratório industrial contemporâneo: bancada ESD, luminária/lupa, instrumentos, conectores, trilho DIN, fonte de comando, sensores e placas com marcas de uso moderado.
- Equipamentos, placas e etiquetas devem usar identidade genérica; não usar logotipos de fabricantes sem autorização.
- Compor uma fotografia/ilustração realista de fundo com elementos interativos vetoriais sobrepostos.
- Designadores (`R1`, `D3`, `PC1`), resultados de medição, valores de BOM e texto técnico devem ser elementos HTML/SVG nítidos, nunca texto embutido em imagem gerada.
- Cada defeito precisa ter uma variante visual específica e tecnicamente coerente: a foto, a medição, o esquema e o feedback devem contar a mesma história.
- Manter contraste, zoom e navegação por teclado; nenhuma resposta pode depender apenas de cor, brilho ou visão de detalhes minúsculos.

### Uso de IA para imagens

Imagens generativas podem servir como base de cenário, textura e fotografia simulada. Elas **não** devem decidir informações críticas do desafio, como pinagem, leitura de instrumento, código do componente, posição do defeito ou texto de etiquetas. Esses dados devem vir do caso estruturado e ser renderizados pela interface.

Antes de publicar um caso, revisar tecnicamente a coerência entre imagem, diagnóstico, documentação e resposta esperada. A primeira versão deve privilegiar 12 casos curados; geração procedural só deve ser ampliada após validação docente/técnica dos modelos de caso.

---

## 7. Contrato técnico e integração com a Arena

### Contrato dos minigames

Cada novo componente deve preservar o contrato comum já usado pela Arena:

```ts
onScoreAction(
  deltaScore: number,
  isHit: boolean,
  actionMessage: string,
  newLevel?: number
): void;
```

- Usar `PenaltySystem.tsx` para erros de decisão e tentativas impulsivas, com mensagens pedagógicas em pt-BR.
- Não gravar diretamente em Firebase dentro do minigame. Pontuação e eventos devem fluir pelos mecanismos existentes de `/play/[pin]` e `/practice`.
- Não enviar valores `undefined` ao RTDB e não introduzir caminhos novos de persistência sem necessidade.
- Manter a mesma experiência em sala sincronizada e no treino solo; um caso deve ser individual para cada jogador, mesmo quando a rodada é coletiva.
- Ao integrar novos IDs de minigame, conferir os pontos centralizados que enumeram módulos, cards, nomes, ícones e seleção de jogo. Não alterar `roomService.ts` ou `profileService.ts` além do que for estritamente necessário.

### Modelo de dados sugerido

```ts
type IndustrialMinigameId = "industrial_repair" | "safe_multimeter" | "datasheet_match";

interface IndustrialCase {
  id: string;
  minigameId: IndustrialMinigameId;
  difficulty: 1 | 2 | 3 | 4;
  serviceOrder: {
    code: string;
    equipment: string;
    sector: string;
    symptom: string;
    impact: string;
    safetyNotice: string;
  };
  visual: {
    sceneAssetId: string;
    boardAssetId?: string;
    hotspots: Array<{ id: string; label: string; x: number; y: number }>;
  };
  evidence: Array<{ id: string; kind: "visual" | "measurement" | "bom" | "datasheet" | "schematic"; value: string }>;
  expectedDecision: string;
  feedback: {
    success: string;
    commonMistakes: Array<{ decision: string; explanation: string }>;
  };
}
```

O conteúdo inicial pode residir em um arquivo de dados dedicado, por exemplo `src/data/industrialChallengesData.ts`. O esquema deverá evoluir conforme a mecânica final, mas cada dado crítico precisa permanecer explícito, versionável e revisável.

---

## 8. Pontuação e devolutiva pedagógica

### Princípios

- Recompensar evidência e decisão correta, não clique rápido sem análise.
- Tratar erro de segurança como oportunidade de correção explícita; não apenas como perda silenciosa de pontos.
- Separar “decisão tecnicamente incorreta” de “procedimento inseguro na simulação”.
- Evitar que o aluno progrida por tentativa exaustiva: alternativas repetidas devem ativar o disjuntor/anti-autoclique existente quando aplicável.

### Sugestão de composição de resultado

| Dimensão | Pergunta de avaliação |
|---|---|
| Segurança | A condição e o procedimento de trabalho foram reconhecidos? |
| Evidência | A medição, inspeção ou documento escolhido sustenta a decisão? |
| Decisão técnica | O reparo, diagnóstico ou substituto é compatível com o caso? |
| Qualidade | A justificativa e a inspeção final identificam critérios essenciais? |
| Tempo | A OS foi concluída no tempo da rodada, sem valer mais que os critérios anteriores? |

Ao fechar cada OS, mostrar: causa/decisão esperada, evidência decisiva, erro mais comum, capacidade técnica mobilizada e um próximo passo seguro para a atividade prática supervisionada.

---

## 9. Critérios de aceite da primeira entrega

1. Os três minigames funcionam em `/practice` e `/play/[pin]` seguindo o contrato de pontuação existente.
2. Há quatro casos curados por minigame, com dados, imagens e feedback em pt-BR.
3. Cada caso possui contexto industrial, sintoma, impacto, condição de segurança, evidência e resposta tecnicamente coerentes.
4. Informações críticas não estão impressas em imagens geradas; a interface as apresenta de forma legível e acessível.
5. Não há dependência obrigatória de Gemini, Firebase ou conexão externa para jogar os desafios.
6. O tema industrial escuro SENAI, o `PenaltySystem` e a responsividade são preservados.
7. Casos incorretos geram feedback técnico específico, não somente “erro” ou redução de pontuação.
8. A integração não quebra fallback local, anti-duplicação de XP, telemetria de sala ou duração de rodadas.
9. A implementação passa em `npx.cmd tsc --noEmit` e `npm.cmd run build`.

---

## 10. Sequência recomendada de implementação

1. Criar os dados de 12 OS, revisar sua coerência pedagógica/técnica e definir os assets visuais.
2. Construir primeiro o protótipo de **Estação de Reparo de PCI**, porque estabelece o padrão de OS, hotspots e inspeção visual.
3. Reutilizar o padrão de OS no **Diagnóstico com Multímetro Seguro**, acrescentando leitura e interpretação de evidências.
4. Implementar a interface de comparação de documentos no módulo de **Datasheet e BOM**.
5. Integrar os três módulos ao catálogo, ao host, ao play e ao treino solo; então validar a rodada completa e o registro de XP.

