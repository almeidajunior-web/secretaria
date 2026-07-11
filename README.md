# Secretar.ia

Plataforma pessoal modular. Esta etapa entrega os módulos **Agenda**,
**Planejamento**, **Tarefas**, **Compras** e **Vencimentos**, com a barra
lateral já preparada para o módulo futuro de **Finanças** (hoje "Em
construção").

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

## Barra lateral e navegação entre módulos

- A engrenagem **Configurações** no rodapé da barra lateral abre um gerenciador
  para reordenar os módulos (arraste) e ocultar/exibir cada um
- Ocultar um módulo só afeta a navegação por ele na barra lateral — os dados
  continuam intactos e qualquer link direto para ele (ex.: os atalhos de
  "Tarefas"/"Venc." na Agenda) continua abrindo o módulo normalmente
- Badge de contagem (ex.: tarefas atrasadas + previstas para hoje, ao lado de
  "Tarefas") em estilo discreto — um contorno fino com o número no mesmo
  tamanho/fonte do rótulo do módulo, sem preenchimento vermelho

## Privacidade

- Botão de "olho" no topbar, ao lado do alternador de tema claro/escuro,
  ativa um **modo privado** global: a área de sidebar + módulo ativo recebe
  um desfoque (blur) com um aviso "Modo privado ativado", e todo o conteúdo
  por baixo fica temporariamente impossível de clicar
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
- Mini-calendário na barra lateral e navegação entre módulos
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
- Criação via linha rápida no rodapé da lista ou pelo botão "Nova conta" no
  topbar (modal, mesmo padrão do "Novo item"/"Nova tarefa")
- Modo de seleção em massa: atribua Classificação, marque como paga/
  pendente ou exclua várias contas de uma vez; exclusão sempre imediata,
  sem confirmação
- Badge na barra lateral com o total de contas atrasadas + vencendo hoje

## Funcionalidades do módulo Tarefas

- Duas visualizações — **Lista** e **Kanban** — com os mesmos filtros e
  ordenação compartilhados entre as duas; as colunas do Kanban vêm dos
  Status cadastrados, e a ordem dos cards dentro de cada coluna segue
  sempre a mesma ordenação/filtros ativos na Lista (sem reordenação manual)
- Prioridades, Tags e Status totalmente customizáveis nas Configurações
  (nome, cor e ordem — arraste para reordenar); Status tem ainda um sinalizador
  "conta como concluída" por item, usado pela recorrência e pelo filtro de
  ocultar finalizadas
- Ordenação hierárquica: clique em "Prazo", "Prioridade" ou "Status" na
  barra de ferramentas para empilhar critérios (1º clique define o
  principal, 2º clique em outro campo adiciona um critério secundário)
- Lista agrupada por prazo (Atrasadas, Hoje, Amanhã, Próximos 7 dias, Mais
  tarde, Sem prazo), com as atrasadas sempre no topo; datas vencidas
  aparecem em vermelho, tarefas previstas para hoje mantêm o estilo padrão
- Edição direta na linha da lista — status, título, tags, prioridade e
  prazo são todos editáveis ali mesmo, sem abrir o modal (que só abre ao
  clicar fora dos campos, como no ClickUp); botão de relógio na linha adia
  rapidamente o prazo em +1 dia ou +1 semana
- Linha de resumo no topo com a contagem por status e o total de atrasadas,
  e badge no ícone do módulo na barra lateral com o total de tarefas
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
  lib/        # storage (persistência), date e recurrence (helpers)
  hooks/      # useTheme, useEvents, usePlanning, useTasks, useShoppingItems,
              # useBills, useModulesConfig...
  components/
    layout/   # Sidebar, Topbar, MiniCalendar, ModulesSettingsModal,
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
  data/       # dados de exemplo (seed) de cada módulo, modules.js (registro
              # central de módulos)
  constants.js
```

A camada de persistência é versionada (`secretaria:schemaVersion`) para permitir
migrações futuras sem perda de dados.
