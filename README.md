# Secretar.ia

Plataforma pessoal modular. Esta etapa entrega o **módulo Agenda**, com a
arquitetura já preparada para receber os módulos futuros (To Dos, Finanças,
Planejamento).

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

## Estrutura

```
src/
  lib/        # storage (persistência), date e recurrence (helpers)
  hooks/      # useTheme, useEvents
  components/
    layout/   # Sidebar, Topbar, MiniCalendar
    agenda/   # Agenda e suas visões, card, popover e modal
  data/       # eventos de exemplo (seed)
  constants.js
```

A camada de persistência é versionada (`secretaria:schemaVersion`) para permitir
migrações futuras sem perda de dados.
