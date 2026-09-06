# Secretar.ia

Plataforma pessoal modular. Esta etapa entrega os módulos **Agenda**,
**Planejamento**, **Tarefas**, **Compras**, **Vencimentos**, **Finanças** e
**Metas**.

## Stack

- Vite + React (JavaScript)
- Tailwind CSS
- lucide-react (ícones)
- date-fns
- Persistência via `localStorage` (camada isolada em `src/lib/storage.js`,
  pronta para troca futura por backend Supabase)

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

Para gerar o build de produção:

```bash
npm run build
npm run preview
```

## Topbar e navegação entre módulos

- A navegação entre módulos fica no **topbar**, em linha ao lado da marca — a
  barra lateral fixa de 220px foi removida para que todos os módulos usem a
  largura inteira da tela. Em janelas estreitas a faixa de navegação rola
  horizontalmente em vez de espremer os itens
- O mini-calendário sobrevive apenas **dentro da Agenda**, numa calha própria
  no canto superior esquerdo do módulo, com um botão para recolher/expandir
  (a preferência persiste). Recolhido, o botão de reabrir aparece no início da
  barra de ferramentas da Agenda. O calendário acompanha o mês exibido na
  grade quando você navega pelas setas
- A engrenagem **Configurações** no canto direito do topbar abre um gerenciador
  para reordenar os módulos (arraste), ocultar/exibir cada um, e fazer backup
  manual de todos os dados
- Todos os modais de **Configurações** (o global e o de cada módulo) usam um
  layout de "app de configurações": uma barra lateral de tópicos à esquerda
  (ex.: em Tarefas → Prioridades, Tags, Status) e o painel do tópico
  selecionado à direita, em vez de uma lista empilhada única
- **Backup**: "Exportar backup" baixa um único arquivo `.json` com os dados de
  todos os módulos (eventos, tarefas, compras, contas, categorias e
  preferências); "Importar backup" lê um arquivo exportado antes, confirma
  antes de substituir os dados atuais e recarrega a página. Protege contra
  perda de dados por limpar o navegador, já que tudo é salvo só localmente
  (localStorage)
- Ocultar um módulo só afeta a navegação por ele no topbar — os dados
  continuam intactos e qualquer link direto para ele (ex.: os atalhos de
  "Tarefas"/"Venc." na Agenda) continua abrindo o módulo normalmente
- Badge de contagem (ex.: tarefas atrasadas + previstas para hoje, ao lado de
  "Tarefas") em estilo discreto — um contorno fino com o número no mesmo
  tamanho/fonte do rótulo do módulo, sem preenchimento vermelho
- Cada módulo lembra a própria visualização (visão Lista/Kanban em Tarefas,
  Semanal/Mensal/etc. na Agenda, ordenação, filtros ativos, "ocultar
  finalizadas/pagas/compradas", agrupamento por classificação em Compras...)
  — ao trocar de módulo e voltar, ou recarregar a página, tudo continua
  exatamente como foi deixado. Só estados de ação temporários (modo de
  seleção em massa, modais abertos) reiniciam ao trocar de módulo

## Identidade visual

- O app tem um **chão em degradê azul** (`.app-ground`, aplicado na raiz em
  `App.jsx`) que vale para todos os módulos. Superfícies acima dele são
  transparentes por padrão, então a cor do fundo atravessa a interface inteira
- **Vidro fosco** (`.glass` / `.glass-strong` em `index.css`) nas superfícies em
  forma de cartão: topbar, barras de ferramentas, barras de resumo, cabeçalhos
  fixos, tiles do Overview, colunas e cartões do Kanban, painel de faturas.
  Linhas de tabela/lista e as grades da Agenda/Planejamento ficam planas sobre o
  chão — mantêm a densidade legível e não pagam o custo de dezenas de camadas
  com `backdrop-filter` na rolagem
- **Modais, popovers e tooltips continuam opacos** de propósito: flutuam sobre
  conteúdo arbitrário, e empilhar desfoque sobre desfoque fica ilegível
- **Glow** (`.num-glow`) só nas figuras de destaque — totais do mês, indicadores,
  fatura aberta. Botões e outros controles ficam sólidos. É automaticamente
  desligado no tema claro: sombra colorida sobre fundo claro vira borrão, não
  brilho
- **Degradê sob as linhas** do gráfico Receita×Despesa, com os `stop-color`
  lendo os mesmos tokens que o traço usa, para o preenchimento nunca destoar da
  linha
- O azul é o **ambiente**; verde e vermelho seguem significando receita e
  despesa. Cor de destaque e cor semântica são coisas separadas

### Como os tokens funcionam

As variáveis em `index.css` guardam **canais RGB separados por espaço**
(`--c-surface: 16 27 51`), e o `tailwind.config.js` as envolve em
`rgb(var(--c-x) / <alpha-value>)`. Isso é o que permite `bg-accent-soft/30`,
`hover:bg-danger/15` e afins funcionarem — com um hex dentro da variável o
Tailwind não consegue injetar opacidade e descarta a classe silenciosamente.

Níveis de superfície, do fundo para a frente: `app-ground` (o chão) →
`bg-inset` (poços rebaixados: switchers, campos agrupados) → `.glass` (cromo) →
`.glass-strong` (cartões) → `bg-surface` (flutuantes opacos e campos de
formulário).

## Cores e contraste no tema escuro

- As cores de tags, prioridades, status e categorias são escolhidas numa paleta
  compartilhada, e algumas delas (azul-marinho, cinza) somem contra o fundo
  escuro quando usadas como texto de uma pílula pequena
- No tema escuro essas cores passam por um ajuste automático em HSL antes de
  virarem texto ou ponto colorido (`darkInkColor`/`tintVars` em
  `src/lib/color.js`, aplicadas pelas classes `.tint-ink`/`.tint-fill`/
  `.tint-soft` em `index.css`). O matiz nunca muda, então a cor continua sendo
  reconhecível como "aquela" cor
- O ajuste **mira uma razão de contraste, não uma luminosidade fixa**: a
  luminosidade sobe só até a cor passar da barra de leitura, e para. Um piso
  fixo teria que ser calibrado para o pior matiz da paleta, e todos os outros
  o ultrapassariam — era o que deixava as dez cores no mesmo tom e com cara de
  pastel único. Há um piso moderado por baixo (L52) apenas para nenhuma cor
  afundar: num fundo escuro, uma cor escura recua em vez de brilhar
- No tema claro nada muda: a cor é renderizada exatamente como está cadastrada
  (com isso, uma cor cinza-clara escolhida por você pode ficar em ~4,5:1 no
  claro — é o preço de mostrar a cor verdadeira, e foi uma escolha consciente)
- Os **seletores de cor** ficam de fora do ajuste de propósito — ali a amostra
  existe para você escolher uma cor e precisa mostrar a cor verdadeira
- Blocos grandes e opacos (células do Planejamento, eventos confirmados da
  Agenda) seguem com o tratamento irmão `fillColorForTheme`, que usa um piso
  de luminosidade mais baixo por pintarem área, não texto

## Privacidade

- Botão de "olho" no topbar, ao lado da engrenagem de Configurações, ativa um
  **modo privado** global: a área do módulo ativo recebe um desfoque (blur)
  com um aviso "Modo privado ativado", e todo o conteúdo por baixo fica
  temporariamente impossível de clicar. O topbar continua acessível, para você
  poder desativar o modo e navegar
- Não apaga, altera nem oculta dados de verdade — é só uma camada visual por
  cima; ao desativar, tudo volta exatamente como estava
- O próprio Topbar (o botão de olho e o de tema) continua sempre acessível
  por cima do desfoque, para poder desativar o modo privado a qualquer
  momento
- Preferência persistida (sobrevive a recarregar a página), útil para sair
  rapidamente de uma visualização exposta em local público
- Independente do "olho" local do módulo Vencimentos (que só mascara os
  totais em R$ da barra de resumo) — são dois recursos separados: um oculta
  valores específicos, o outro oculta a tela inteira

## Funcionalidades do módulo Agenda

- Quatro visões: **Anual**, **Mensal**, **Semanal** (padrão) e **Diária**
- Criação/edição de eventos com cor, tags, recorrência e status
- Quatro estados visuais de evento: confirmado, não confirmado, provisório e
  recusado
- Eventos do tipo **aula** com limite de faltas, contador e marcação de
  presença/falta
- Recorrência: diária, semanal, quinzenal, mensal, anual e dias úteis
- Cada dia da visão semanal tem atalhos "Tarefas" e "Venc." (ícone de boleto,
  para diferenciar do lançamento de gastos/receitas do futuro módulo
  Finanças) — cada um abre o módulo correspondente (Tarefas/Vencimentos) já
  filtrado para aquele dia
- Mini-calendário na calha esquerda do módulo, sincronizado com o mês exibido
- Tema claro/noturno persistente

## Funcionalidades do módulo Planejamento

- Grade semanal fixa (Segunda–Domingo, faixa de horário configurável)
  representando a rotina padrão do usuário, sem vínculo com datas do
  calendário
- Pintura de células por "pincel": selecione uma categoria e clique ou
  arraste sobre as células para colori-las; opção de borracha para limpar
- Categorias totalmente editáveis (nome, cor e ordem — arraste para
  reordenar), com 9 categorias padrão pré-cadastradas
- Excluir uma categoria em uso limpa automaticamente as células associadas
- Clique com o botão direito numa célula preenchida para dividi-la em dois
  blocos de 30 min (ou uni-los de volta) e para adicionar uma descrição em
  texto livre a essa janela
- Faixa de horário da grade (início/fim) configurável nas Configurações
- Linha do "agora" no mesmo estilo visual da Agenda
- A grade usa uma altura de linha própria (`PLANNING_HOUR_HEIGHT`), menor que a
  da Agenda: aqui as células são blocos de cor, não cartões com texto dentro, e
  todas as horas aparecem de uma vez. As duas constantes são separadas
  justamente para que encolher uma grade nunca encolha a outra

## Funcionalidades do módulo Compras

- Lista única com edição 100% em linha, no mesmo espírito do módulo Tarefas:
  título, Classificação, Prioridade e uma Descrição breve (ícone que abre um
  popover pequeno) editáveis direto na linha
- Criação via linha rápida no rodapé da lista ou pelo botão "Novo item" no
  topbar (abre um modal — mesmo padrão do "Nova tarefa"/"Novo evento"); o
  modal serve só para criar, a edição continua sempre em linha
- Ícone de círculo à esquerda de cada item marca comprado/pendente — vazio
  para pendente, azul preenchido para comprado, com o mesmo efeito de risco
  usado em tarefas finalizadas
- Classificações e Prioridades totalmente customizáveis nas Configurações
  (nome, cor e ordem — arraste para reordenar)
- Ordenação por Classificação (alfabética) ou Prioridade, e agrupamento
  opcional por Classificação (seções em ordem alfabética)
- Filtro por Classificação/Prioridade e opção de ocultar itens já comprados
- Modo de seleção em massa ("Selecionar"): atribua Classificação, Prioridade,
  marque como comprado/pendente ou exclua vários itens de uma vez
- Excluir um item (individual ou em lote) é imediato, sem modal de
  confirmação — lista pensada para ser rápida e de baixo atrito
- Item marcado como comprado é removido automaticamente no dia seguinte
  (silenciosamente, sem aviso), mantendo a lista sempre enxuta

## Funcionalidades do módulo Vencimentos

- Centraliza contas a pagar (consumo, assinaturas, aluguel, mensalidades)
  com valor e data de vencimento — lista sempre agrupada por vencimento
  (Atrasadas, Hoje, Amanhã, Próximos 7 dias, Mais tarde), já que aqui a data
  é o centro da organização, diferente do agrupamento opcional de Compras
- Resumo com totais no topo (pendente no mês, pago no mês, atrasado) —
  refletem o valor real independente do filtro "ocultar pagas"
- Ícone de "olho" na barra de resumo oculta/exibe os três totais (estilo app
  de banco, ex.: `R$ ••••`) por questões de privacidade — mascara só os
  valores agregados, sem afetar os valores de cada conta na lista
- Recorrência própria e mais simples que a da Agenda/Tarefas (Mensal,
  Bimestral, Trimestral, Semestral, Anual, baseada no dia do vencimento);
  ao marcar uma conta recorrente como paga, ela **não** avança no próprio
  registro como em Tarefas — em vez disso, fica marcada como paga (histórico
  permanente, útil para consultar quanto foi pago em cada mês) e uma nova
  conta pendente nasce automaticamente para o próximo ciclo, já com o valor
  anterior como sugestão editável (útil para contas de valor variável, como
  água e luz)
- Uma conta atrasada e não paga nunca avança sozinha — diferente de
  Tarefas, aqui isso esconderia uma conta ainda pendente
- Classificação editável (nome, cor e ordem) e filtro/ordenação por
  Classificação, Valor ou Vencimento
- Ícone de círculo à esquerda de cada conta marca paga/pendente, com o
  mesmo efeito de risco usado em Tarefas/Compras
- Criação via linha rápida no rodapé da lista ou pelo botão "Novo vencimento"
  no topbar (modal, mesmo padrão do "Novo item"/"Nova tarefa")
- Modo de seleção em massa: atribua Classificação, marque como paga/
  pendente ou exclua várias contas de uma vez; exclusão sempre imediata,
  sem confirmação
- Badge no topbar com o total de contas atrasadas + vencendo hoje

## Funcionalidades do módulo Finanças

- Finanças pessoais: lançamentos de receita e despesa com categoria (listas
  **separadas** para receita e despesa — "Salário" e "Moradia" nunca se
  misturam), forma de pagamento, conta/banco e **tags** (domínio próprio,
  independente das tags de Tarefas) — todos editáveis nas Configurações
  (cada um numa aba da barra lateral do modal)
- Duas abas no topo: **Resumo** (métricas + gráficos + uma tabela dos
  lançamentos mais recentes) e **Lançamentos** (a tabela completa de todos
  os lançamentos). Não há seletor de período — o Resumo é sempre um retrato
  fixo do mês corrente, e a aba Lançamentos mostra tudo, sendo recortada
  pelos filtros/ordenação do próprio cabeçalho da tabela
- **Resumo**: três indicadores fixos no mês vigente (Receitas, Despesas,
  Saldo do mês) cada um com variação percentual vs. o mês anterior; sob as
  Despesas, um indicador discreto de **gastos essenciais** (valor absoluto +
  % das despesas do mês); um gráfico de barras das despesas por categoria e
  um de linha comparando receita x despesa nos últimos 6 meses — ambos em
  SVG artesanal, sem biblioteca de gráficos adicionada ao projeto
- Ícone de "olho" no Resumo oculta/exibe os valores (totais, gráficos),
  igual ao padrão já usado em Vencimentos
- A tabela é no estilo planilha/Excel: cabeçalho fixo cujo **título ordena**
  (clique cicla asc→desc→sem ordem) e cujas colunas categóricas (tipo,
  categoria, pagamento, conta, tags) têm um **funil que abre um filtro por
  coluna**. Todas as células continuam editáveis diretamente na linha
- Forma de pagamento é mostrada sem cor (não faz sentido destacá-la por cor)
- Despesas têm um campo **"Essencial?"** (estrela na linha; checkbox no modal
  e no lançamento rápido) para marcar gastos essenciais — vem **marcado por
  padrão** (a ideia é desmarcar só as exceções)
- Cada lançamento tem um ícone de tendência (↑ receita em verde, ↓ despesa
  em vermelho) clicável para alternar o tipo — a categoria é limpa ao
  trocar, já que as listas de categoria são específicas por tipo
- Além da recorrência automática (contas fixas, ver abaixo), o botão
  "Duplicar" em cada linha cria uma cópia avulsa já na data de hoje — útil
  para repetir um lançamento pontual sem torná-lo uma série
- Criação via linha rápida no rodapé da tabela (com todos os campos do
  modal) ou pelo botão "Novo lançamento" no topbar (modal)
- Modo de seleção em massa: atribua forma de pagamento/conta ou exclua
  vários lançamentos de uma vez (recategorizar em massa fica de fora
  propositalmente — uma seleção pode misturar receita e despesa, que têm
  listas de categoria diferentes)
- Módulo independente de Vencimentos — nenhum lançamento é criado
  automaticamente a partir de uma conta paga lá, mantendo a mesma filosofia
  de módulos independentes do resto do app
- **Duas bases de data (competência x caixa)** — este é o eixo do módulo
  (`src/lib/creditCard.js`, helpers `dataCompetencia`/`dataCaixa`): as
  métricas de "quanto gastei/recebi" (Despesas/Receitas do mês, categorias,
  tendências, essenciais, comparações, indicadores) usam a **data da compra**
  (competência), então uma compra no crédito aparece **no mês em que foi
  feita**. As métricas de "quanto tem na conta" (saldo por conta,
  consolidado, reserva) usam a **data de caixa** — para o crédito, a data de
  vencimento da fatura — então a compra só sai do saldo quando a fatura vence
- **Cartão de crédito**: a forma de pagamento "Crédito" é fixa (não pode ser
  renomeada nem excluída) e tem, nas Configurações, dois campos de dia —
  **Fechamento** e **Vencimento**. O vencimento da fatura de cada compra é
  **derivado** de `(data, config)` na hora, nunca gravado (`vencimentoDaCompra`)
  — então mudar os dias na config não deixa nada desatualizado. Antes do
  fechamento, a compra entra na fatura do ciclo atual; no dia do fechamento
  ou depois, vai para o mês seguinte; o dia de vencimento é ajustado ao
  último dia do mês quando necessário
- **Previsto x realizado**, derivado (sem status manual): uma linha só é
  **previsto** (opacidade reduzida + ícone de relógio) quando a **data da
  compra** ainda está no futuro — uma recorrência que vem ou uma parcela
  ainda não chegada. Uma compra no crédito já feita é **realizada**, mesmo
  antes da fatura vencer; a fatura em que ela cai aparece como um selo
  discreto na célula de data ("💳 fatura DD/MM"), não como opacidade. No
  modal/linha rápida, escolher "Crédito" mostra ao vivo "Entra na fatura que
  vence em DD/MM/AAAA"
- Painel **"Cartão de crédito"** no Resumo (`creditCardInvoices`): a fatura é
  uma **entidade computada**. Mostra a fatura **aberta** (o ciclo
  acumulando agora) em destaque e as demais por urgência — **vencida**,
  **fechada**, **futura**, **paga** — cada uma com data de vencimento, total
  e um botão **"Marcar paga"** (persistido em `financePaidInvoices`)
- **Parcelamento agrupado**: uma compra em Nx (só no crédito) gera N
  lançamentos mensais, cada um "incorrido" no seu mês; na tabela de
  Lançamentos a série colapsa numa **linha única expansível** ("Notebook ·
  3x · 1/3 lançadas · total"), que abre nas parcelas individuais editáveis
- **Contas fixas recorrentes**: qualquer lançamento (receita ou despesa)
  pode receber uma recorrência (mensal, bimestral, trimestral, semestral,
  anual) pelo campo Recorrência no modal, na linha rápida ou pelo chip da
  coluna "Recorrência" na tabela — reaproveita as mesmas opções de
  Vencimentos (`src/lib/billRecurrence.js`). A partir do momento em que a
  instância mais recente de uma série deixa de ser previsto (sua data
  chega), a próxima ocorrência é gerada sozinha, já como previsto
  — sempre com exatamente uma ocorrência futura pendente por série, sem
  acumular lançamentos além disso. Módulo independente do sistema de
  recorrência de Vencimentos (contas fixas aqui não têm relação com
  contas cadastradas lá). "Duplicar" continua criando uma cópia avulsa,
  sem herdar a recorrência/série do lançamento original
- **Saldo por conta e reserva de emergência**: cada conta (Configurações →
  Contas) ganha um **saldo inicial** e um marcador opcional de **reserva de
  emergência**. O saldo de cada conta é o saldo inicial mais os lançamentos
  já realizados atribuídos a ela (previstos não contam — ainda não
  aconteceram). Um card **"Contas"** no Resumo (só aparece quando existe
  ao menos uma conta cadastrada) lista o saldo de cada uma, o **saldo
  consolidado** (soma de todas as contas + lançamentos sem conta) e, se
  houver conta(s) marcada(s) como reserva, o consolidado **sem reservas**
  e quantos **meses de despesa** a reserva cobre (reserva ÷ média de
  despesa dos últimos 3 meses fechados)
- **Indicadores do mês** no Resumo: **taxa de poupança** (quanto sobrou da
  receita), **comprometimento de renda** (% da receita já preso em contas
  fixas recorrentes), **saldo projetado** (realizado + previstos do mês,
  com o realizado até agora como referência) e **gasto médio diário**
  (mês corrente vs. a média diária dos últimos 3 meses fechados) — cada
  um colorido por sinal/direção (positivo/negativo, acima/abaixo da
  média)
- Gráfico **"Evolução mensal por categoria"**: barras empilhadas dos
  últimos 6 meses para as categorias de despesa mais relevantes (o
  restante entra em "Outros" em vez de crescer a legenda indefinidamente),
  com tooltip ao passar o mouse — `CategoryTrendChart.jsx`, paleta por
  cor de categoria (as mesmas cores editáveis pelo usuário, sempre
  legendadas por nome já que uma cor livre não pode ser validada como
  segura para daltonismo)
- Lista **"Comparação com a média (3 meses)"**: cada categoria de despesa
  do mês atual contra a média dos 3 meses anteriores, com a variação
  percentual (▲ gastando mais que o normal, ▼ gastando menos)

## Funcionalidades do módulo Tarefas

- Duas visualizações — **Lista** e **Kanban** — com os mesmos filtros e
  ordenação compartilhados entre as duas; as colunas do Kanban vêm dos
  Status cadastrados, e a ordem dos cards dentro de cada coluna segue
  sempre a mesma ordenação/filtros ativos na Lista (sem reordenação manual)
- Prioridades, Tags e Status totalmente customizáveis nas Configurações
  (nome, cor e ordem — arraste para reordenar); Status tem ainda um sinalizador
  "conta como concluída" por item, usado pela recorrência e pelo filtro de
  ocultar finalizadas
- Ordenação hierárquica: clique em "Prazo" ou "Prioridade" na barra de
  ferramentas para empilhar critérios (1º clique define o principal, 2º clique
  em outro campo adiciona um critério secundário). Não há ordenação por status:
  no Kanban a coluna já é o status, e na Lista o agrupamento por prazo é o
  eixo útil — uma preferência salva antes da remoção é saneada na leitura
- Lista agrupada por prazo (Atrasadas, Hoje, Amanhã, Próximos 7 dias, Mais
  tarde, Sem prazo), com as atrasadas sempre no topo; datas vencidas
  aparecem em vermelho, tarefas previstas para hoje mantêm o estilo padrão
- Edição direta na linha da lista — status, título, tags, prioridade e
  prazo são todos editáveis ali mesmo, sem abrir o modal (que só abre ao
  clicar fora dos campos, como no ClickUp); botão de relógio na linha adia
  rapidamente o prazo em +1 dia ou +1 semana
- Linha de resumo no topo com a contagem por status e o total de atrasadas,
  e badge no item do módulo no topbar com o total de tarefas
  atrasadas + previstas para hoje
- Filtro por data (além de prioridade e tags) — o mesmo filtro usado pelo
  atalho "Tarefas" da Agenda para abrir a lista já restrita a um dia
- Modo de seleção em massa na Lista ("Selecionar"): marque várias tarefas e
  atribua prazo, prioridade, status ou tag a todas de uma vez, ou exclua o
  lote — enquanto ativo, a barra de filtros/ordenação dá lugar à barra de
  ações em massa
- Recorrência no mesmo padrão da Agenda, mas orientada a data (sem
  horário/duração obrigatórios) — completar uma tarefa recorrente avança o
  prazo para o próximo ciclo em vez de criar uma tarefa nova; se o prazo
  vencer sem conclusão, a tarefa avança sozinha para a próxima ocorrência
- Kanban com arraste de cards entre colunas para mudar o status
- Criação via modal ("Nova tarefa") ou direto na lista, numa linha rápida
  sem abrir pop-up — título, tags, prazo e prioridade ali mesmo

## Funcionalidades do módulo Metas

Duas seções empilhadas numa página só — a rotina do dia a dia em cima, os
objetivos de prazo mais longo embaixo — porque o ponto é ver as duas juntas: as
rotinas são o que movem as metas.

### Rotina

- **Grade de rotinas**: uma linha por rotina, uma coluna por dia, alternando
  entre **semana** (7 colunas) e **mês** (~30) pelo switcher da barra, com
  navegação de período e botão "Hoje"
- Grade com **contornos visíveis** célula a célula (mesma técnica do
  Planejamento) e **tons alternados** para ler as colunas de relance: fim de
  semana num tom levemente recuado, semanas alternando um tom mais claro, e o
  dia de hoje com o destaque mais forte de todos — prioridade fixa entre os
  três (hoje vence fim de semana vence a alternância de semana), já que
  empilhar mais de uma cor de fundo no mesmo elemento não é confiável
- Cada célula cicla no clique entre **vazio → feito → não feito → N/A**. O
  vazio é um quarto estado de propósito: permite desfazer sem tecla modificadora
  e se lê diferente do N/A — o vazio ainda conta contra o dia, o N/A sai da conta
- Cada estado tem **glifo próprio** (✓ / ✕ / –), não só cor, para continuar
  legível para quem não separa os verdes dos vermelhos
- Uma rotina é definida num **modal** com cor, **dias da semana** em que vale,
  **data de início** e **data de fim** (ou "indefinidamente"). Só esses três
  campos decidem se a célula existe, o que é demais para adivinhar de um campo
  de texto inline — por isso aqui não há linha de adição rápida
- Dias fora do período da rotina, ou num dia da semana que ela não cobre, ficam
  **inertes**: não são clicáveis nem entram em nenhum denominador
- **Gráfico de cumprimento** acima da grade: percentual de rotinas cumpridas por
  dia. Cobre **exatamente a mesma janela da tabela** — as colunas de um se
  alinham com as do outro — e **interrompe o traço** onde não há o que medir:
  dias sem rotina agendada e dias que ainda não chegaram. Nenhum dos dois é um
  dia fracassado, e desenhá-los como zero puxaria a linha ao chão pelo resto do
  mês
- O gráfico é **animado**: ao marcar uma célula a linha desliza até o novo valor
  em vez de saltar. Como o atributo `d` de um path SVG não é transicionável por
  CSS, quem desliza são os *dados* — `useTweenedNumbers` interpola os valores por
  `requestAnimationFrame` e o traço é recalculado a cada quadro. Respeita
  `prefers-reduced-motion`, caso em que a mudança é instantânea
- **Indicadores**: sequência atual (streak) ao lado de cada rotina e percentual
  do período visível ao fim de cada linha

### Objetivos

- Metas de horizonte mais longo, apresentadas como **caixas** de três por
  linha. Título **grande, em primeiro plano**, com a porcentagem de progresso
  ao lado — as duas competem pela atenção de propósito, mas o título domina o
  espaço enquanto o número fica compacto, do mesmo jeito que os big numbers do
  Overview de Finanças ficam compactos ao lado do rótulo
- O progresso é **definido à mão**: não é calculado, o que é o que permite uma
  meta contável ("juntar a reserva") e uma difusa ("trocar de emprego")
  conviverem na mesma lista sem forçar uma na forma da outra. A edição — tanto
  arrastando quanto digitando o número — só acontece dentro do **modal**; o
  cartão na lista é somente leitura e um alvo de clique, não uma superfície
  editável
- A barra usada para arrastar o progresso é a mesma em toda a interface:
  mais grossa e retangular que o controle nativo do navegador (que por padrão
  sai fino e com cantos totalmente arredondados), com o trecho já percorrido
  preenchido para a leitura ficar imediata
- **A caixa inteira é o alvo de clique** para abrir a edição — não há mais um
  ícone de lápis separado. Só o botão de concluir/reabrir intercepta o clique
  antes que ele chegue ao cartão
- Concluir uma meta fixa o progresso em 100% — uma "concluída" parada em 60% se
  lê como bug toda vez. Não existe status "abandonada": uma meta que deixou de
  fazer sentido se **exclui**, não se arquiva — um terceiro estado ali só
  criava uma gaveta de metas esquecidas
- Metas concluídas descem para um bloco "Concluídas" e podem ser reabertas

## Publicar online

O projeto é uma SPA estática (sem backend) e já está pronto para deploy. O
`base` do Vite usa caminhos relativos, então o mesmo build funciona tanto na
raiz quanto em subpasta.

### Opção 1 — GitHub Pages (automático, recomendado)

Já existe um workflow em `.github/workflows/deploy.yml` que faz build e publica
a cada push. Para ativar (uma única vez):

1. No GitHub, vá em **Settings → Pages**.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.

A partir daí, todo push para o branch dispara o deploy. O link público aparece
em **Settings → Pages** e na aba **Actions** (algo como
`https://<usuário>.github.io/secretaria/`).

### Opção 2 — Netlify

Importe o repositório em [netlify.com](https://app.netlify.com). O arquivo
`netlify.toml` já define `npm run build` e a pasta `dist`. É só confirmar.

### Opção 3 — Vercel

Importe o repositório em [vercel.com](https://vercel.com). O Vercel detecta o
Vite automaticamente (build `vite build`, saída `dist`) — nenhuma configuração
extra é necessária.

## Estrutura

```
src/
  lib/        # storage (persistência), backup (exportar/importar .json),
              # currency (formatCurrency), date e recurrence (helpers)
  hooks/      # useTheme, useEvents, usePlanning, useTasks, useShoppingItems,
              # useBills, useFinanceEntries, useModulesConfig,
              # usePersistentState (preferências de visualização por
              # módulo)...
  components/
    layout/   # Topbar (marca + navegação), MiniCalendar, ModulesSettingsModal,
              # PrivacyOverlay (modo privado global)
    common/   # componentes compartilhados entre módulos (TagSelector,
              # RecurrenceField, ConfirmDialog, EditableListSection,
              # DescriptionPopover)
    agenda/   # Agenda e suas visões, card, popover e modal
    planning/ # Planejamento: grade, paleta de categorias e gerenciador
    tasks/    # Tarefas: lista, kanban, modal e configurações
              # (prioridades, tags e status)
    shopping/ # Compras: lista, toolbar e configurações
              # (classificações e prioridades)
    dues/     # Vencimentos: lista, toolbar, modal e configurações
              # (classificações)
    finance/  # Finanças: Overview (stat tiles + gráficos SVG artesanais),
              # tabela, toolbar, modal e configurações
    goals/    # Metas: grade de rotinas, gráfico animado e objetivos
  data/       # dados de exemplo (seed) de cada módulo, modules.js (registro
              # central de módulos)
  constants.js
```

A camada de persistência é versionada (`secretaria:schemaVersion`) para permitir
migrações futuras sem perda de dados.
