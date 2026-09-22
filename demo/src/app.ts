import { Component, computed, inject, signal } from '@angular/core';
import {
  FluigAcaoDecisao,
  FluigAcoesComponent,
  FluigHistoricoComponent,
  FluigHistoricoLinha,
  FluigService,
  FluigWizardAba,
  FluigWizardEtapa,
  FluigWizardFooterComponent,
  FluigWizardProgressComponent,
} from 'ngx-fluig-ui';

/**
 * Página de demonstração da biblioteca.
 *
 * Simula um processo de compra em 4 etapas. Não há Fluig por trás: os campos
 * hidden do `index.html` fazem o papel do formulário, e o histórico vem de
 * uma lista fixa. É de propósito — mostra que os componentes rodam fora do
 * portal, que é o que permite desenvolver a tela no `ng serve`.
 */
@Component({
  selector: 'demo-root',
  standalone: true,
  imports: [
    FluigWizardProgressComponent,
    FluigWizardFooterComponent,
    FluigHistoricoComponent,
    FluigAcoesComponent,
  ],
  template: `
    <header class="demo-cabecalho">
      <div class="demo-largura">
        <h1>ngx-fluig-ui</h1>
        <p>
          Componentes Angular para formulários de processo do TOTVS Fluig.
          Esta página roda <strong>sem o Fluig</strong> — os componentes
          degradam sozinhos quando o portal não está por perto.
        </p>
        <div class="demo-links">
          <a href="https://github.com/gustavosoaresreis/ngx-fluig-ui">GitHub</a>
          <a href="https://www.npmjs.com/package/ngx-fluig-ui">npm</a>
        </div>
      </div>
    </header>

    <main class="demo-largura demo-conteudo">
      <section class="demo-painel">
        <div class="demo-painel-titulo">
          <h2>Controles</h2>
          <span>Mexa aqui e veja os componentes reagirem</span>
        </div>

        <div class="demo-controles">
          <label>
            Atividade atual (WKNumState)
            <select (change)="trocarAtividade($event)">
              @for (opcao of atividades; track opcao.id) {
                <option [value]="opcao.id" [selected]="opcao.id === atividadeAtual()">
                  {{ opcao.id }} — {{ opcao.nome }}
                </option>
              }
            </select>
          </label>

          <label>
            Tema
            <select (change)="trocarTema($event)">
              @for (opcao of temas; track opcao.id) {
                <option [value]="opcao.id" [selected]="opcao.id === tema()">{{ opcao.nome }}</option>
              }
            </select>
          </label>

          <div class="demo-dica">
            Estreite a janela para menos de 768px para ver o comportamento do
            app Fluig Mobile: a barra colapsa e o rodapé vira um botão.
          </div>
        </div>
      </section>

      <section class="demo-painel" [attr.data-tema]="tema()">
        <div class="demo-painel-titulo">
          <h2>&lt;flg-wizard-progress&gt;</h2>
          <span>Barra de etapas do processo</span>
        </div>

        <flg-wizard-progress [etapas]="etapas" [atividadeAtual]="atividadeAtual()" />
      </section>

      <section class="demo-painel" [attr.data-tema]="tema()">
        <div class="demo-painel-titulo">
          <h2>&lt;flg-wizard-footer&gt;</h2>
          <span>Navegação entre as páginas do formulário</span>
        </div>

        <div class="demo-pagina">
          Página aberta: <strong>{{ paginaAtual() }}</strong>
        </div>

        <flg-wizard-footer
          [abas]="abas"
          [paginaAtual]="paginaAtual()"
          (mudarPagina)="paginaAtual.set($event)" />
      </section>

      <section class="demo-painel" [attr.data-tema]="tema()">
        <div class="demo-painel-titulo">
          <h2>&lt;flg-acoes&gt;</h2>
          <span>Botões de decisão e observação da etapa</span>
        </div>

        <flg-acoes
          [acoes]="acoes"
          [atividadeAtual]="atividadeAtual()"
          (decidiu)="registrarDecisao($event)" />

        @if (ultimaDecisao()) {
          <div class="demo-saida">
            Decisão gravada no formulário:
            <code>selectDecisao = "{{ ultimaDecisao() }}"</code>
          </div>
        }
      </section>

      <section class="demo-painel" [attr.data-tema]="tema()">
        <div class="demo-painel-titulo">
          <h2>&lt;flg-historico&gt;</h2>
          <span>Linha do tempo das movimentações</span>
        </div>

        <flg-historico
          [etapas]="etapas"
          [atividadeAtual]="atividadeAtual()"
          [linhas]="historico" />
      </section>
    </main>

    <footer class="demo-rodape">
      <div class="demo-largura">
        MIT · Gustavo Soares Reis
      </div>
    </footer>
  `,
  styles: `
    /* Temas de exemplo. Cada um sobrescreve só as variáveis dos componentes —
       nenhum estilo da biblioteca é reescrito aqui. */

    [data-tema='azul'] flg-wizard-progress {
      --flg-wizard-ativa-fundo: linear-gradient(135deg, #0d6efd, #6610f2);
      --flg-wizard-ativa-texto: #fff;
      --flg-wizard-ativa-sombra: rgba(13, 110, 253, .25);
      --flg-wizard-concluida-fundo: #0b5ed7;
    }

    [data-tema='azul'] flg-wizard-footer {
      --flg-footer-destaque: #0d6efd;
      --flg-footer-ativo-circulo: linear-gradient(135deg, #0d6efd, #6610f2);
      --flg-footer-borda: #dfe5ec;
      --flg-footer-card-fundo: #fbfcfe;
      --flg-footer-circulo-fundo: #e7effd;
      --flg-footer-circulo-texto: #0b5ed7;
      --flg-footer-texto-fraco: #7b8794;
    }

    [data-tema='azul'] flg-acoes {
      --flg-acoes-positivo: #0d6efd;
      --flg-acoes-negativo: #dc3545;
    }

    [data-tema='azul'] flg-historico {
      --flg-historico-positivo: #0d6efd;
      --flg-historico-negativo: #dc3545;
    }

    [data-tema='verde'] flg-wizard-progress {
      --flg-wizard-ativa-fundo: linear-gradient(135deg, #20c997, #198754);
      --flg-wizard-ativa-texto: #fff;
      --flg-wizard-ativa-sombra: rgba(25, 135, 84, .25);
      --flg-wizard-concluida-fundo: #146c43;
    }

    [data-tema='verde'] flg-wizard-footer {
      --flg-footer-destaque: #198754;
      --flg-footer-ativo-circulo: linear-gradient(135deg, #20c997, #198754);
      --flg-footer-borda: #dfeae3;
      --flg-footer-card-fundo: #fbfefc;
      --flg-footer-circulo-fundo: #e3f4ea;
      --flg-footer-circulo-texto: #146c43;
      --flg-footer-texto-fraco: #7b8b83;
    }

    [data-tema='verde'] flg-acoes {
      --flg-acoes-positivo: #198754;
    }

    [data-tema='verde'] flg-historico {
      --flg-historico-positivo: #198754;
    }

    /* Moldura da página — nada aqui pertence à biblioteca. */

    .demo-largura {
      max-width: 980px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .demo-cabecalho {
      background: linear-gradient(135deg, #111827, #1f2937);
      color: #fff;
      padding: 44px 0 36px;
    }

    .demo-cabecalho h1 {
      margin: 0 0 8px;
      font-size: 32px;
      letter-spacing: -.5px;
    }

    .demo-cabecalho p {
      margin: 0;
      max-width: 640px;
      color: #cbd5e1;
    }

    .demo-links {
      margin-top: 18px;
      display: flex;
      gap: 12px;
    }

    .demo-links a {
      color: #fff;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      border: 1px solid rgba(255, 255, 255, .25);
      border-radius: 999px;
    }

    .demo-links a:hover {
      background: rgba(255, 255, 255, .1);
    }

    .demo-conteudo {
      padding-top: 28px;
      padding-bottom: 40px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .demo-painel {
      background: #fff;
      border: 1px solid #e3e5e8;
      border-radius: 14px;
      padding: 22px;
    }

    .demo-painel-titulo {
      margin-bottom: 18px;
    }

    .demo-painel-titulo h2 {
      margin: 0;
      font-size: 17px;
      font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
    }

    .demo-painel-titulo span {
      font-size: 13px;
      color: #656d76;
    }

    .demo-controles {
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
      align-items: flex-end;
    }

    .demo-controles label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #656d76;
    }

    .demo-controles select {
      min-width: 240px;
      padding: 8px 10px;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      background: #fff;
      font-size: 14px;
      color: #1f2328;
    }

    .demo-dica {
      flex: 1;
      min-width: 260px;
      font-size: 13px;
      color: #656d76;
      background: #f6f8fa;
      border: 1px dashed #d0d7de;
      border-radius: 8px;
      padding: 10px 12px;
    }

    .demo-pagina {
      padding: 26px;
      text-align: center;
      color: #656d76;
      background: #f6f8fa;
      border-radius: 10px;
      margin-bottom: 8px;
    }

    .demo-saida {
      margin-top: 14px;
      font-size: 13px;
      color: #1f2328;
      background: #f6f8fa;
      border-radius: 8px;
      padding: 10px 12px;
    }

    .demo-saida code {
      font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
    }

    .demo-rodape {
      border-top: 1px solid #e3e5e8;
      padding: 20px 0 32px;
      font-size: 13px;
      color: #656d76;
    }

    @media (max-width: 767px) {
      .demo-cabecalho { padding: 32px 0 26px; }
      .demo-cabecalho h1 { font-size: 26px; }
      .demo-controles select { min-width: 100%; }
      .demo-controles label { width: 100%; }
    }
  `,
})
export class DemoApp {
  private readonly fluig = inject(FluigService);

  readonly etapas: FluigWizardEtapa[] = [
    { nome: 'Solicitação', atividades: [0, 4] },
    { nome: 'Aprovação', atividades: [6, 44] },
    { nome: 'Compras', atividades: [12] },
    { nome: 'Conclusão', atividades: [20] },
  ];

  readonly abas: FluigWizardAba[] = [
    { nome: 'Dados', subtitulo: 'Identificação do pedido' },
    { nome: 'Itens', subtitulo: 'Produtos e quantidades' },
    { nome: 'Documentos', subtitulo: 'Anexos e cotações' },
  ];

  readonly acoes: FluigAcaoDecisao[] = [
    { rotulo: 'Aprovar', valor: 'aprovar', estilo: 'positivo' },
    { rotulo: 'Reprovar', valor: 'reprovar', estilo: 'negativo', exigeObservacao: true },
    { rotulo: 'Devolver para correção', valor: 'corrigir', estilo: 'neutro', exigeObservacao: true },
  ];

  /**
   * Histórico fixo. Num processo de verdade o componente lê essas linhas da
   * tabela filha do formulário — aqui a lista é passada por `[linhas]`.
   */
  readonly historico: FluigHistoricoLinha[] = [
    {
      usuario: 'Ana Ribeiro',
      data: '2026-09-14 09:12:40',
      atividade: 'Solicitação',
      observacao: 'Pedido de 12 notebooks para a equipe de campo.',
      acao: 'Enviar',
    },
    {
      usuario: 'Carlos Menezes',
      data: '2026-09-15 16:48:03',
      atividade: 'Aprovação',
      observacao: 'Valor acima do previsto. Refaça a cotação com mais dois fornecedores.',
      acao: 'Devolver para correção',
    },
    {
      usuario: 'Ana Ribeiro',
      data: '2026-09-17 11:05:27',
      atividade: 'Solicitação',
      observacao: 'Cotações anexadas. Valor reduzido em 14%.',
      acao: 'Reenvio',
    },
  ];

  readonly atividades = [
    { id: 0, nome: 'Início' },
    { id: 6, nome: 'Aprovação' },
    { id: 12, nome: 'Compras' },
    { id: 20, nome: 'Conclusão' },
  ];

  readonly temas = [
    { id: 'padrao', nome: 'Padrão (âmbar)' },
    { id: 'azul', nome: 'Azul' },
    { id: 'verde', nome: 'Verde' },
  ];

  readonly atividadeAtual = signal(6);
  readonly paginaAtual = signal('Dados');
  readonly tema = signal('padrao');
  readonly ultimaDecisao = signal('');

  /** Nome da etapa atual, usado pelo histórico como destino da última linha. */
  readonly nomeEtapaAtual = computed(
    () => this.etapas.find((e) => e.atividades.includes(this.atividadeAtual()))?.nome ?? '',
  );

  /**
   * Além do signal, grava no campo hidden: é de lá que o `FluigService` lê o
   * `WKNumState`, então a troca no seletor reflete o que aconteceria num
   * processo de verdade.
   */
  trocarAtividade(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.atividadeAtual.set(Number(valor));
    this.fluig.setValue('atividade', valor);
  }

  trocarTema(evento: Event): void {
    this.tema.set((evento.target as HTMLSelectElement).value);
  }

  registrarDecisao(acao: FluigAcaoDecisao): void {
    this.ultimaDecisao.set(acao.valor);
  }
}
