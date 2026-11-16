# Adugo: Território da Onça

Adaptação digital e educativa do **Adugo** (jogo tradicional da onça do povo indígena **Bororo / Boe**), com dois modos de jogo:

- **Adugo Clássico:** regras tradicionais no tabuleiro de 31 pontos (1 onça vs. 14 cachorros; a onça vence ao capturar 5 cachorros; os cachorros vencem ao cercar a onça sem movimentos).
- **Território da Onça:** adiciona o **fogo** como um terceiro elemento que nenhum jogador controla e **18 cartas educativas** sobre queimadas, cuidado com o território e a relação entre a onça e o povo Bororo. Se **5 pontos queimarem**, o território é destruído e **os dois lados perdem**. Além disso, os cachorros só vencem com **cerco limpo** (se um ponto queimado fechar uma saída da onça, ninguém vence).

---

## Documentação de Especificação (Leitura Obrigatória)

Toda decisão de regra, números e direção visual já está fechada e documentada em dois arquivos principais:

1. **[`docs/MECANICAS.md`](docs/MECANICAS.md):** geometria do tabuleiro (18 linhas e 31 pontos), movimento, captura em cadeia, regras do fogo, simulação de ritmo, sistema das 18 cartas, tela final e objeto de configuração (`CONFIG`).
2. **[`docs/ESTETICA.md`](docs/ESTETICA.md):** conceito visual *"riscado no chão"*, limites culturais (respeito aos grafismos Bororo), paleta de cores com contrastes WCAG aferidos, tipografia (`Fredoka` e `Nunito`), especificações de cada SVG, animações e layout para celular e projetor.

---

## Status Atual do Projeto

| Módulo / Frente | Status | Detalhes |
| --- | --- | --- |
| **Documentação (`docs/`)** | Concluído | `MECANICAS.md` e `ESTETICA.md` completos e com valores de contraste e fogo calibrados. |
| **Simulador de Fogo (`tools/sim-fogo.mjs`)** | Concluído | Simulador de 4.000 partidas/configuração que calibrou o aviso de 2 rodadas e o limite de 5 queimados. |
| **Motor de Regras (`src/motor/`)** | Concluído (100%) | Tabuleiro (`tabuleiro.ts`), configuração (`config.ts`), motor puro imutável (`motor.ts`) e 46 testes (`motor.test.ts`) prontos e passando em 1,6s (`npm test`). |
| **Base Visual & Tokens (`src/estilos/`)** | Concluído (100%) | Paleta (`tokens.css`), tipografia (`Fredoka`/`Nunito`), chão, botões, painel e estilos de cartas (`base.css`). |
| **Arte SVG, Prancha e Imagens (`src/arte/`, `public/`)** | Concluído (100%) | 23 SVGs validados por `npm run arte:conferir`, prancha em `/#prancha` (`Prancha.tsx`), `favicon.svg`, ícones PNG e `og.jpg` exportados (`npm run arte:png`). |
| **Tabuleiro Visual (`src/componentes/`)** | Concluído (100%) | `Tabuleiro.tsx` e `sulcos.ts` prontos, com sulcos irregulares de semente fixa, marcadores de jogada, toque, teclado e `aria-label` em cada ponto. |
| **Interface da Partida & Telas** | Pendente | Dividido nas Issues [#4](https://github.com/TheAndr3/adugo/issues/4) (Partida), [#6](https://github.com/TheAndr3/adugo/issues/6) (Início/Fim/Sobre) e [#7](https://github.com/TheAndr3/adugo/issues/7) (Como se joga). |
| **18 Cartas Educativas (`src/conteudo/`)** | Concluído (100%) | `cartas.json` (18 cartas conferidas), `baralho.ts` (9 testes em `baralho.test.ts`), `<CartaoCarta />` e `<ModalCarta />` prontos — [Issue #5](https://github.com/TheAndr3/adugo/issues/5). |
| **Simulador de Balanceamento (`tools/`)** | Pendente | [Issue #8](https://github.com/TheAndr3/adugo/issues/8) — script de terminal para medir o equilíbrio Onça vs. Cachorros e calibrar `config.ts` (o jogo em si é 100% para 2 pessoas, sem bot na tela). |
| **Responsividade, Vercel, QA e Relatório** | Pendente | Issues [#9](https://github.com/TheAndr3/adugo/issues/9) (PNGs e `og.jpg` já prontos; falta layout responsivo da partida e deploy), [#10](https://github.com/TheAndr3/adugo/issues/10) e [#11](https://github.com/TheAndr3/adugo/issues/11). |

---

## Como Rodar o Projeto Localmente

Pré-requisito: **Node.js 20+**

```bash
# 1. Instalar dependências
npm install

# 2. Rodar servidor de desenvolvimento (Vite) — acesse /#prancha para ver todos os assets
npm run dev

# 3. Rodar verificação de tipos TypeScript
npm run tipos

# 4. Rodar suíte de testes unitários (Vitest)
npm test

# 5. Conferir regras dos 23 SVGs (viewBox, peso em KB, ids, paleta e itens proibidos)
npm run arte:conferir

# 6. Remontar a capa e reexportar PNGs + og.jpg (se alterar algum SVG)
npm run arte:capa
npm run arte:png

# 7. Rodar o simulador de ritmo do fogo (4.000 partidas por cenário)
npm run sim
```

---

## Divisão de Tarefas (Issues) para a Equipe

O trabalho foi dividido em **11 Issues no GitHub** pensadas para que várias pessoas possam programar **ao mesmo tempo sem conflito de arquivos (merge conflicts)**:

| Issue | Tarefa Original | Escopo Resumido | Esforço | Status / Dependências | Arquivos Principais |
| --- | --- | --- | --- | --- | --- |
| **[#1](https://github.com/TheAndr3/adugo/issues/1)** | Tarefa 1 | Esqueleto do projeto, motor de regras com 46 testes, `tokens.css`, `base.css`, `vite-plugin-svgr` e fontes | `high` | **Concluída** | `src/motor/*`, `src/estilos/*`, `vite.config.ts` |
| **[#2](https://github.com/TheAndr3/adugo/issues/2)** | Tarefa 2A | 23 assets SVG (peças, fogo, chão, ícones, marca, capa), scripts de conferência/exportação e `/#prancha` | `xhigh` | **Concluída** | `src/arte/**`, `src/telas/Prancha.tsx`, `tools/*-arte.mjs` |
| **[#3](https://github.com/TheAndr3/adugo/issues/3)** | Tarefa 2B | Componente `<Tabuleiro />` gerado por código (`Tabuleiro.tsx` e `sulcos.ts`), marcadores, toque/teclado e `aria-label` | `high` | **Concluída** | `src/componentes/Tabuleiro.tsx`, `src/componentes/sulcos.ts` |
| **[#4](https://github.com/TheAndr3/adugo/issues/4)** | Tarefa 3 | Interface da partida: juntar motor + `<Tabuleiro />` + assets, painel da partida, captura em cadeia, botão de pausar animação e animações de movimento | `high` | **Liberada Agora!** (#1, #2 e #3 prontas) | `src/telas/TelaPartida.tsx`, `src/componentes/PainelPartida.tsx`, `src/estilos/animacoes.css` |
| **[#5](https://github.com/TheAndr3/adugo/issues/5)** | Tarefa 6 | **18 cartas educativas** com fontes conferidas + lógica de sorteio/gatilhos do baralho + `<ModalCarta />` | `medium` | **Concluída** | `src/conteudo/cartas.json`, `src/conteudo/baralho.ts`, `src/componentes/ModalCarta.tsx` |
| **[#6](https://github.com/TheAndr3/adugo/issues/6)** | Tarefa 7A | Telas de **Início**, **Fim de Partida** (estatísticas, roda de conversa, cartas da partida) e **Sobre** | `medium` | **Liberada Agora (Paralelizável)** | `src/telas/TelaInicio.tsx`, `src/telas/TelaFim.tsx`, `src/telas/TelaSobre.tsx` |
| **[#7](https://github.com/TheAndr3/adugo/issues/7)** | Tarefa 7B | Tela **"Como se joga"** com 4 passos e mini tabuleiros animados usando `<Tabuleiro />` e `criarEstado()` | `medium` | **Liberada Agora (Paralelizável)** | `src/telas/TelaComoJogar.tsx` |
| **[#8](https://github.com/TheAndr3/adugo/issues/8)** | Tarefa 4 | Simulador de balanceamento no terminal (`tools/`): melhorar a simulação dos cachorros para medir equilíbrio Onça vs. Cachorros e calibrar números | `xhigh` | **Liberada Agora (Paralelizável)** | `tools/sim-fogo.mjs`, `src/motor/config.ts` |
| **[#9](https://github.com/TheAndr3/adugo/issues/9)** | Tarefa 8 | Ajuste de responsividade da partida (celular em pé vs. projetor >= 20px) e publicação na Vercel *(PNGs e `og.jpg` já prontos)* | `medium` | Após #4 | `src/estilos/layout.css`, `vercel.json` |
| **[#10](https://github.com/TheAndr3/adugo/issues/10)** | Tarefa 5 | Revisão final do código, contrastes WCAG, leitores de tela, teclado, `prefers-reduced-motion` e `npm run arte:conferir` | `high` | Amanhã à noite (após integração) | Todo o repositório |
| **[#11](https://github.com/TheAndr3/adugo/issues/11)** | Tarefa 9 | Fonte publicada em português sobre o Adugo Bororo, relato dos testes com pessoas e texto do relatório | `medium` | **Pesquisa já / Relato após testes** | `docs/RELATORIO.md` |

---

## Estrutura de Pastas Padronizada

Para evitar conflitos entre quem estiver trabalhando em paralelo, siga esta organização de diretórios:

```text
adugo/
├── docs/
│   ├── MECANICAS.md          # Especificação fechada das regras, fogo e cartas
│   ├── ESTETICA.md           # Guia visual, paleta, tipografia, SVGs e telas
│   └── RELATORIO.md          # Relatório final da disciplina (Issue #11)
├── public/
│   ├── favicon.svg           # Ícone da aba (pronto)
│   ├── icon-192.png          # Exportado via npm run arte:png (pronto)
│   ├── icon-512.png          # Exportado via npm run arte:png (pronto)
│   ├── apple-touch-icon.png  # Exportado via npm run arte:png (pronto)
│   └── og.jpg                # Prévia OpenGraph 1200x630 em JPEG ~203KB (pronto)
├── src/
│   ├── motor/                # Motor puro em TypeScript (pronto, 46/46 testes)
│   │   ├── config.ts         # Números ajustáveis (CONFIG)
│   │   ├── tabuleiro.ts      # 31 pontos, 18 linhas, vizinhos e pulos
│   │   ├── motor.ts          # Estado imutável, jogadasPossiveis() e aplicar()
│   │   ├── motor.test.ts     # 46 testes unitários e de propriedades
│   │   └── index.ts          # API pública do motor
│   ├── arte/                 # 23 SVGs importados via ?react (pronto)
│   │   ├── pecas/            # cachorro-a.svg, cachorro-b.svg, cachorro-c.svg, onca.svg
│   │   ├── fogo/             # foco.svg, queimado.svg, fumaca.svg, broto.svg
│   │   ├── chao/             # chao.svg, capim.svg
│   │   ├── marca/            # adugo.svg
│   │   ├── capa/             # capa.svg
│   │   ├── icones/           # 10 ícones 24x24 (pata-onca, chama, broto, etc.)
│   │   ├── arte.css          # Animações da chama e fumaça
│   │   └── index.ts          # Exportação dos componentes SVG React
│   ├── conteudo/             # Cartas educativas e lógica de sorteio (Issue #5)
│   │   ├── cartas.json       # As 18 cartas com fontes verificadas
│   │   └── baralho.ts        # Embaralhamento por sessão e prioridade de gatilhos
│   ├── componentes/          # Componentes visuais reutilizáveis
│   │   ├── sulcos.ts         # Geometria Catmull-Rom dos 66 trechos com semente fixa (pronto)
│   │   ├── Tabuleiro.tsx     # Tabuleiro SVG interativo e acessível (pronto)
│   │   ├── Tabuleiro.css     # Estilos do tabuleiro, peças e marcadores (pronto)
│   │   ├── PainelPartida.tsx # Vez, capturas, território, rodada (Issue #4)
│   │   └── ModalCarta.tsx    # Exibição de carta sobre o tabuleiro (Issue #5)
│   ├── telas/                # As 6 telas do jogo + Prancha de validação
│   │   ├── Prancha.tsx       # Rota /#prancha com todos os assets (pronto)
│   │   ├── Prancha.css       # Estilos da prancha (pronto)
│   │   ├── TelaPartida.tsx   # Partida principal e animações (Issue #4)
│   │   ├── TelaInicio.tsx    # Capa e menu inicial (Issue #6)
│   │   ├── TelaFim.tsx       # Resultado, estatísticas e roda de conversa (Issue #6)
│   │   ├── TelaSobre.tsx     # Sobre o Adugo, povo Bororo e equipe (Issue #6)
│   │   └── TelaComoJogar.tsx # 4 passos com mini tabuleiros (Issue #7)
│   ├── estilos/              # CSS modularizado
│   │   ├── tokens.css        # Variáveis de cor e tipografia (pronto)
│   │   ├── base.css          # Chão, vinheta, botões (.botao), .painel e .carta (pronto)
│   │   ├── animacoes.css     # Animações de transição de jogadas (Issue #4)
│   │   └── layout.css        # Responsividade celular vs. projetor (Issue #9)
│   ├── App.tsx               # Navegação entre as telas e /#prancha
│   └── main.tsx              # Ponto de entrada React
└── tools/
    ├── sim-fogo.mjs          # Simulador de ritmo do fogo (pronto)
    ├── conferir-arte.mjs     # Validador dos 23 SVGs (pronto)
    ├── montar-capa.mjs       # Gerador de src/arte/capa/capa.svg (pronto)
    └── exportar-png.mjs      # Exportador de PNGs e og.jpg (pronto)
```

---

## Fluxo de Trabalho Sugerido para os Amigos

1. Escolha uma Issue na aba **[Issues](https://github.com/TheAndr3/adugo/issues)** (as marcadas com a label `paralelizável` podem ser iniciadas imediatamente sem depender de ninguém) e assine seu usuário nela (`Assignees`).
2. Crie uma branch para a sua issue:
   ```bash
   git checkout -b feat/issue-5-cartas
   ```
3. Leia as seções correspondentes em [`docs/MECANICAS.md`](docs/MECANICAS.md) e [`docs/ESTETICA.md`](docs/ESTETICA.md) listadas na descrição da Issue.
4. Antes de abrir o Pull Request, rode:
   ```bash
   npm run tipos
   npm test
   npm run build
   ```
5. Abra um Pull Request referenciando a Issue (ex.: `Closes #5`).
