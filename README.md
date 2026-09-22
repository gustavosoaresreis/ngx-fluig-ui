# ngx-fluig-ui

Componentes Angular para formulários de processo do **TOTVS Fluig**.

Quem desenvolve formulário de processo no Fluig acaba recriando as mesmas
coisas em todo projeto: a barra de etapas do topo, a navegação entre as
páginas do formulário e o punhado de gambiarras necessárias para conversar
com o Fluig a partir de dentro do iframe. Esta biblioteca empacota isso.

- **Standalone components** — sem NgModule.
- **Degrada fora do Fluig** — roda no `ng serve` sem o Fluig por perto, o que
  permite desenvolver e testar o formulário no navegador.
- **Tema por variáveis CSS** — as cores saem de custom properties, então a
  identidade visual da sua empresa entra sem fork.
- **Mobile** — a barra e o rodapé se adaptam ao app Fluig Mobile.

**[Ver demonstração ao vivo](https://gustavosoaresreis.github.io/ngx-fluig-ui/)**

## Instalação

```bash
npm install ngx-fluig-ui
```

Requer Angular 17 ou superior.

## Uso

```ts
import { Component, inject, signal } from '@angular/core';
import {
  FluigService,
  FluigWizardProgressComponent,
  FluigWizardFooterComponent,
  FluigWizardEtapa,
  FluigWizardAba,
} from 'ngx-fluig-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FluigWizardProgressComponent, FluigWizardFooterComponent],
  template: `
    <flg-wizard-progress
      [etapas]="etapas"
      [atividadeAtual]="fluig.WKNumState" />

    <!-- conteúdo da página atual -->

    <flg-wizard-footer
      [abas]="abas"
      [paginaAtual]="paginaAtual()"
      (mudarPagina)="paginaAtual.set($event)" />
  `,
})
export class App {
  readonly fluig = inject(FluigService);

  readonly etapas: FluigWizardEtapa[] = [
    { nome: 'Solicitação', atividades: [0, 4] },
    { nome: 'Aprovação', atividades: [6, 44] },
    { nome: 'Conclusão', atividades: [12] },
  ];

  readonly abas: FluigWizardAba[] = [
    { nome: 'Dados', subtitulo: 'Identificação' },
    { nome: 'Documentos', subtitulo: 'Anexos' },
  ];

  readonly paginaAtual = signal('Dados');
}
```

## Componentes

### `<flg-wizard-progress>`

Barra de etapas do topo, no formato de setas encaixadas. Cada etapa agrupa
um ou mais ids de atividade do diagrama BPMN, então atividades de retrabalho
que voltam para a mesma fase continuam acendendo a mesma etapa.

| Input | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `etapas` | `FluigWizardEtapa[]` | — | Macro-etapas, na ordem de exibição |
| `atividadeAtual` | `number` | — | O `WKNumState` da solicitação |
| `somenteEtapaAtualNoMobile` | `boolean` | `true` | No mobile, colapsa a barra na etapa atual |

### `<flg-wizard-footer>`

Rodapé de navegação entre as páginas do formulário: cards numerados com setas
laterais no desktop e, no app Fluig Mobile, um botão único que abre a
navegação num painel deslizante.

O componente não guarda estado — o pai controla a página atual.

| Input | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `abas` | `FluigWizardAba[]` | — | Páginas, na ordem de navegação |
| `paginaAtual` | `string` | — | Nome da página aberta |
| `somenteSidebarNoMobile` | `boolean` | `true` | No mobile, troca os cards por um sidebar |
| `tituloSidebar` | `string` | `'Navegação'` | Título do painel no mobile |
| `rotuloEtapa` | `string` | `'ETAPA'` | Palavra usada em "ETAPA 2 DE 3" |

| Output | Tipo | Descrição |
| --- | --- | --- |
| `mudarPagina` | `EventEmitter<string>` | Nome da página escolhida |

### `<flg-historico>`

Linha do tempo das movimentações. Lê sozinho a tabela filha do formulário,
resolve nome e foto de cada usuário e monta os cards — ou recebe as linhas
prontas por `[linhas]`.

A tabela guarda de onde cada movimentação saiu, mas não para onde foi; o
componente encadeia os destinos (o destino de uma linha é a origem da
seguinte) e pinta a borda de verde quando o processo avançou e de vermelho
quando voltou. Passando as mesmas `etapas` do wizard, essa decisão sai da
ordem real das etapas; sem elas, cai numa análise por palavra-chave da ação.

| Input | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `titulo` | `string` | `'Histórico'` | Título do painel |
| `textoVazio` | `string` | `'Nenhuma movimentação...'` | Texto quando não há linhas |
| `etapas` | `FluigWizardEtapa[]` | `[]` | Usadas para saber se avançou ou voltou |
| `atividadeAtual` | `number` | `0` | Destino da última movimentação |
| `nomeAtividadeAtual` | `string?` | — | Nome real da atividade, quando a etapa agrupa várias |
| `campos` | `FluigHistoricoCampos` | `FLUIG_HISTORICO_CAMPOS_PADRAO` | Ids/classes da tabela filha |
| `linhas` | `FluigHistoricoLinha[]?` | — | Usa esta lista em vez de ler o formulário |

### `<flg-acoes>`

Botões de decisão da etapa mais o campo de observação. No desktop substitui o
botão "Enviar" nativo: grava a decisão e a observação nos campos e só então
dispara o envio nativo.

Na atividade 0 (Início) mostra só o botão de envio, porque Aprovar/Reprovar
não fazem sentido antes de a solicitação existir.

| Input | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `acoes` | `FluigAcaoDecisao[]` | `[]` | Botões de decisão da etapa |
| `somenteEnviarNoInicio` | `boolean` | `true` | Na atividade 0, só o botão de envio |
| `rotuloEnviar` | `string` | `'Enviar Solicitação'` | Rótulo do botão de envio |
| `valorEnviar` | `string` | `'enviar'` | Valor gravado ao enviar do Início |
| `acoesComoCheckboxNoMobile` | `boolean` | `true` | No mobile, 2+ ações viram checkboxes |
| `atividadeAtual` | `number?` | lê do form | Atividade atual |
| `rotuloObservacao` | `string` | `'Demais Informações:'` | Rótulo do textarea |
| `placeholder` | `string` | ... | Placeholder do textarea |
| `campoDecisao` | `string` | `'selectDecisao'` | Campo onde a decisão é gravada |
| `campoObservacao` | `string` | `'observacaoValidacao'` | Campo onde a observação é gravada |
| `idObservacao` | `string` | `'flgAcoesObservacao'` | id do textarea |

| Output | Tipo | Descrição |
| --- | --- | --- |
| `decidiu` | `EventEmitter<FluigAcaoDecisao>` | Decisão tomada, antes do envio disparar |

⚠️ **No app Fluig Mobile**, com 2 ou mais ações, os botões viram checkboxes:
marcar um grava a decisão na hora, e o envio real acontece quando o usuário
toca no botão nativo do app. Por isso `exigeObservacao` só **bloqueia** no
desktop — no mobile o componente apenas exibe um aviso. Para que isso
funcione, chame `ocultarEnvioNativo()` apenas no desktop.

### `FluigService`

| Membro | Descrição |
| --- | --- |
| `getValue(id)` / `setValue(id, valor)` | Lê e grava campos do formulário |
| `WKNumState` | Id da atividade atual (getter, relê o DOM a cada acesso) |
| `formMode` | `ADD`, `VIEW` ou `EDIT` |
| `somenteLeitura()` | Atalho para `formMode === 'VIEW'` |
| `ehMobile()` | App Fluig Mobile ou tela estreita |
| `ocultarEnvioNativo()` | Esconde o botão "Enviar" do Fluig e o item equivalente no menu |
| `enviar()` | Dispara o envio pelo botão nativo |
| `lerHistorico(campos)` | Lê a tabela filha de movimentações |
| `nomeUsuario(matricula)` | Resolve o nome pelo dataset `colleague`, com cache |
| `abrirSidebar(opcoes)` | Encapsula `FLUIGC.sidebar` |

Os nomes `getValue`, `setValue`, `WKNumState` e `formMode` seguem de propósito
o vocabulário do pacote [`fluig-form`](https://github.com/Gabriel-Persike/Componentes-Angular-Fluig),
para quem transita entre os dois não precisar decorar dois jeitos de fazer a
mesma coisa.

⚠️ **No app Fluig Mobile não chame `enviar()`.** Lá o botão de envio pertence
ao app nativo e não está no DOM. Mantenha os campos atualizados com
`setValue` e o Fluig lê o que estiver gravado quando o usuário enviar.

## Tema

Todas as cores são custom properties. Para aplicar a sua identidade visual,
sobrescreva as variáveis no host do componente:

```css
flg-historico {
  --flg-historico-positivo: #198754;
  --flg-historico-negativo: #dc3545;
}

flg-acoes {
  --flg-acoes-positivo: #198754;
}

flg-wizard-progress {
  --flg-wizard-ativa-fundo: linear-gradient(135deg, #0d6efd, #6610f2);
  --flg-wizard-ativa-texto: #fff;
  --flg-wizard-concluida-fundo: #198754;
}

flg-wizard-footer {
  --flg-footer-destaque: #0d6efd;
}
```

## Pré-requisitos no formulário Fluig

A biblioteca assume o padrão mais comum de formulário de processo:

- campos hidden `atividade` e `formMode`, preenchidos no `displayFields.js`
  (os ids são configuráveis em `FluigService.idCampoAtividade` e
  `idCampoFormMode`);
- botão nativo `#send-process-button` na página pai, para `enviar()` e
  `ocultarEnvioNativo()`;
- tabela filha de histórico, quando for usar `lerHistorico()`.

Nada disso é obrigatório: sem esses elementos, os métodos correspondentes
devolvem valores padrão em vez de quebrar a tela.

## Desenvolvimento

```bash
npm install
```

| Comando | O que faz |
| --- | --- |
| `npm run build` | Empacota a biblioteca em `dist/` (ng-packagr) |
| `npm run demo` | Sobe a página de demonstração em http://localhost:4210 |
| `npm run build:demo` | Gera a demonstração em `docs/` (saída local, não versionada) |

A demonstração fica em `demo/` e importa a biblioteca pelo código-fonte, via
path mapping — então qualquer alteração aparece na hora, sem `npm link`.

A publicação é automática: o workflow
[`pages.yml`](.github/workflows/pages.yml) compila a biblioteca e a demo a
cada push na `main` e publica no GitHub Pages. Para ligar, uma vez só:
**Settings → Pages → Source: GitHub Actions**.

## Licença

MIT
