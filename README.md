# Secretar.ia

Plataforma pessoal modular. Esta etapa entrega os módulos **Agenda** e
**Planejamento**, com a arquitetura já preparada para receber os módulos
futuros (Tarefas, Finanças).

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

## Funcionalidades do módulo Agenda

- Quatro visões: **Anual**, **Mensal**, **Semanal** (padrão) e **Diária**
- Criação/edição de eventos com cor, tags, recorrência e status
- Quatro estados visuais de evento: confirmado, não confirmado, provisório e
  recusado
- Eventos do tipo **aula** com limite de faltas, contador e marcação de
  presença/falta
- Recorrência: diária, semanal, quinzenal, mensal, anual e dias úteis
- Mini-calendário na barra lateral e navegação entre módulos
- Tema claro/noturno persistente

## Funcionalidades do módulo Planejamento

- Grade semanal fixa (Segunda–Domingo × 6h–23h) representando a rotina padrão
  do usuário, sem vínculo com datas do calendário
- Pintura de células por "pincel": selecione uma categoria e clique ou
  arraste sobre as células para colori-las; opção de borracha para limpar
- Categorias totalmente editáveis (nome e cor), com 9 categorias padrão
  pré-cadastradas
- Excluir uma categoria em uso limpa automaticamente as células associadas

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
  hooks/      # useTheme, useEvents, usePlanning
  components/
    layout/   # Sidebar, Topbar, MiniCalendar
    agenda/   # Agenda e suas visões, card, popover e modal
    planning/ # Planejamento: grade, paleta de categorias e gerenciador
  data/       # eventos de exemplo (seed) e categorias padrão do Planejamento
  constants.js
```

A camada de persistência é versionada (`secretaria:schemaVersion`) para permitir
migrações futuras sem perda de dados.
