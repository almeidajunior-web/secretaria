# Arquitetura do Secretar.ia

Guia para quem for manter ou estender o app (inclusive a futura versão
mobile). O README cobre como rodar, testar e publicar; aqui está **como o
código se organiza e por quê**.

## Camadas

```
 telas            components/<módulo>/        o que se vê e se clica
   │ recebem props prontas
 montagem         app/useModuleData.js        junta dados + ações de todos os módulos
   │
 regras           hooks/use<Domínio>.js       regras de cada domínio sobre os dados
   │              lib/*.js                    funções puras: recorrência, métricas...
   │
 persistência     storage/useStoredState.js   useState que se salva sozinho
                  storage/stores.js           o que é salvo, em que formato
                  storage/backend.js          ONDE é salvo (hoje: localStorage)
```

Regra de dependência: cada camada só conhece as de baixo. `lib/` não importa
React; `storage/` não conhece telas; as telas não sabem onde os dados ficam.

## Persistência

Cada coisa salva é declarada uma vez em `storage/stores.js`:

```js
export const billsStore = defineStore({
  key: 'bills',              // salvo como 'secretaria:bills'
  label: 'Vencimentos',      // nome usado nos avisos de erro
  empty: () => [],           // valor quando não há nada utilizável
  seed: buildSeedBills,      // dados de exemplo da primeira execução
  parse: arrayOf(isObject),  // valida e migra o formato salvo
})
```

e lida num hook com `useStoredState(billsStore)`, que:

- começa do valor salvo, ou do `seed` se nunca houve nada salvo;
- salva a cada mudança (sem regravar o que não mudou);
- acompanha mudanças feitas em **outra aba** do app;
- se o valor salvo estiver ilegível, **não** usa o `seed`: guarda o original
  em `secretaria:<chave>:corrupted-backup`, começa de `empty` e mostra um
  aviso (`StorageNotice`);
- se o navegador recusar a gravação (armazenamento cheio), mostra um aviso em
  vez de quebrar.

### Regras de compatibilidade

Os dados das pessoas e os backups `.json` já exportados dependem do formato
salvo. Portanto:

1. **Nunca renomeie uma chave** nem mude o formato gravado de uma existente.
2. Para evoluir um formato, aceite o antigo no `parse` e converta (veja as
   migrações de `planningStore`, `tasksStore`, `taskTagsStore`).
3. Mudanças que o `parse` não consiga absorver: suba `SCHEMA_VERSION` em
   `storage/schema.js` e escreva a migração lá.
4. `src/storage/storage.test.js` confere, byte a byte, que ler e regravar
   mantém o formato — acrescente um caso ao mudar um store.

Preferências de tela (aba ativa, ordenação, filtros) usam
`hooks/usePersistentState`, mais simples e sem sincronização entre abas.

## Caminho para a versão mobile

A versão mobile combinada é o **mesmo site, adaptado à tela do celular** e
instalável (PWA). O que já está pronto:

- **Regras independentes das telas.** Recorrência, cartão de crédito,
  métricas, ordenação, filtros, Metas — tudo em `lib/` e `hooks/`, testado
  sem interface. As telas mobile usam os mesmos hooks.
- **Dados em uma camada só.** Para que o celular e o computador vejam os
  mesmos dados, troca-se `storage/backend.js` por um serviço com login (ex.:
  Supabase). Os módulos não mudam: continuam chamando `useStoredState`.
  Pontos a tratar nessa troca:
  - o backend remoto é assíncrono — `loadStore` passa a ter um estado de
    "carregando" (ou um cache local que sincroniza em segundo plano);
  - `subscribeExternalChanges` passa a ouvir o servidor (tempo real), não só
    outras abas;
  - conflito entre aparelhos: hoje cada coleção é gravada inteira
    (última gravação vence). Para edição simultânea em dois aparelhos, salvar
    por item (ex.: uma linha por lançamento) evita perder mudanças;
  - migração dos dados atuais: o backup `.json` já reúne tudo, e pode ser o
    formato de importação para a conta nova.
- **Componentes compartilhados.** Formulários (`common/Form`), filtros
  (`common/FilterControls`), listas editáveis, seletores — adaptá-los ao
  celular adapta todos os módulos de uma vez.

O que falta: layouts responsivos (hoje o app é só desktop — a Agenda semanal
e a tabela de Finanças precisarão de uma versão própria para tela pequena),
toque nos gestos de arrastar (hoje são eventos de mouse) e o manifesto PWA.

## Adicionar um módulo

1. Registre-o em `data/modules.js` (id, nome, ícone) — já aparece na barra e
   nas configurações.
2. Declare os dados em `storage/stores.js` e crie o hook do domínio em
   `hooks/` usando `useStoredState`.
3. Monte as props em `app/useModuleData.js`.
4. Crie a tela em `components/<módulo>/` e associe-a em `MODULE_LOADERS`
   (`App.jsx`) — ela já é carregada sob demanda.
5. Escreva testes: regras puras em `src/lib/*.test.js`, fluxo da tela em
   `tests/e2e/<módulo>.spec.js`.

## Testes

| Camada | Ferramenta | Onde |
| --- | --- | --- |
| Regras puras e persistência | Vitest | `src/**/*.test.js` |
| Fluxos de cada módulo no navegador | Playwright | `tests/e2e/*.spec.js` |
| Correções de bugs (um teste por bug) | ambas | `bugfixes.test.js`, `regressions-*.spec.js` |
| Aparência de cada tela | Playwright (local) | `tests/e2e/visual.spec.js` |
| Política de segurança de produção | Playwright | `tests/e2e/headers.spec.js` |

Os testes no navegador congelam o relógio em 10/03/2026 10:00 (São Paulo).
Antes de uma refatoração grande, grave as referências visuais
(`npm run test:visual -- --update-snapshots`) e compare depois.

## Publicação

- `main` é produção; o Netlify publica cada merge e gera uma prévia por PR.
- O CI (GitHub Actions) roda lint, unidade, build e testes no navegador em
  todo PR.
- `netlify.toml` define cache longo para os arquivos com hash e cabeçalhos de
  segurança (CSP, `X-Frame-Options`...). Se uma mudança passar a carregar algo
  de outro domínio, atualize a CSP — `headers.spec.js` falha antes do deploy.

## Decisões e limites conhecidos

- **Dados só no navegador.** Limpar os dados do site apaga tudo; o backup em
  Configurações → Backup é a proteção até existir sincronização.
- **Dados de exemplo na primeira execução.** Cada módulo começa com exemplos
  se nunca salvou nada; esvaziar um módulo é respeitado.
- **Dependências.** React 19, Tailwind 4, Vite 8 e lucide-react 1.x já
  existem, mas não foram adotados: são atualizações maiores, com mudanças de
  comportamento, e valem uma etapa própria com a rede de testes atual.
