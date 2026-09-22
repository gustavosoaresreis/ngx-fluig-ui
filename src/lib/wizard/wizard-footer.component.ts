import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FluigService } from '../fluig/fluig.service';
import { FluigWizardAba } from './wizard.model';

/**
 * Rodapé de navegação entre as páginas do formulário (cards numerados +
 * setas laterais).
 *
 * Não guarda estado: quem manda é o componente pai, que passa a
 * `paginaAtual` e reage ao evento `mudarPagina`.
 *
 * No app Fluig Mobile os cards lado a lado não cabem na tela, então por
 * padrão o rodapé vira um botão único que abre a navegação num painel
 * deslizante (`FLUIGC.sidebar`, do fluig-style-guide). Desligue com
 * `[somenteSidebarNoMobile]="false"` para manter os cards no celular (eles
 * empilham verticalmente via CSS).
 *
 * ⚠️ **Detalhe técnico:** o conteúdo do sidebar é injetado pelo
 * `FLUIGC.sidebar` FORA do DOM que este componente controla — por isso o
 * HTML da lista é montado com estilo inline em vez de depender das classes
 * de `styles` (o *view encapsulation* do Angular não alcança elementos que
 * outra biblioteca injeta na página).
 *
 * @example
 * <flg-wizard-footer
 *   [abas]="abas"
 *   [paginaAtual]="paginaAtual()"
 *   (mudarPagina)="paginaAtual.set($event)" />
 */
@Component({
  selector: 'flg-wizard-footer',
  standalone: true,
  template: `
    @if (mostrarSidebarMobile()) {
      <button type="button" class="flg-footer-gatilhoMobile" (click)="abrirSidebar()">
        <span class="flg-footer-gatilhoMobile-texto">
          <span class="flg-footer-rotulo">{{ rotuloEtapa }} {{ posicaoAtual() + 1 }} DE {{ abasVisiveis().length }}</span>
          <span class="flg-footer-nome">{{ paginaAtual }}</span>
        </span>
        <i class="fluigicon fluigicon-menu icon-sm" aria-hidden="true"></i>
      </button>
    } @else {
      <div class="flg-footer">
        <button type="button" class="flg-footer-seta flg-footer-seta--esquerda" title="Anterior"
          [disabled]="posicaoAtual() <= 0" (click)="irParaAnterior()">
          <i class="fluigicon fluigicon-chevron-left icon-sm" aria-hidden="true"></i>
        </button>

        @for (aba of abasVisiveis(); track aba.nome; let posicao = $index) {
          @if (posicao > 0) {
            <div class="flg-footer-conector"><div class="flg-footer-conector-linha"></div></div>
          }

          <div [class]="classeAba(posicao)" (click)="mudarPagina.emit(aba.nome)">
            <div class="flg-footer-circulo">{{ posicao + 1 }}</div>
            <div class="flg-footer-info">
              <span class="flg-footer-rotulo">{{ rotuloEtapa }} {{ posicao + 1 }} DE {{ abasVisiveis().length }}</span>
              <span class="flg-footer-nome">{{ aba.nome }}</span>
              @if (aba.subtitulo) {
                <span class="flg-footer-subtitulo">{{ aba.subtitulo }}</span>
              }
            </div>
          </div>
        }

        <button type="button" class="flg-footer-seta flg-footer-seta--direita" title="Próximo"
          [disabled]="posicaoAtual() >= abasVisiveis().length - 1" (click)="irParaProxima()">
          <i class="fluigicon fluigicon-chevron-right icon-sm" aria-hidden="true"></i>
        </button>
      </div>
    }
  `,
  styles: `
    /* Nomenclatura: flg-footer-<elemento>--<modificador> */

    :host {
      --flg-footer-destaque: #f0801e;
      --flg-footer-borda: #efe7de;
      --flg-footer-texto-forte: #2b211a;
      --flg-footer-texto-fraco: #a5856d;
      --flg-footer-card-fundo: #fffdfb;
      --flg-footer-circulo-fundo: #f7ece2;
      --flg-footer-circulo-texto: #8a4a20;
      --flg-footer-ativo-fundo: linear-gradient(135deg, #fffaf5, #ffffff);
      --flg-footer-ativo-circulo: linear-gradient(135deg, #ffe259, #ffa751);
      --flg-footer-concluido-circulo: #d4f1de;
      --flg-footer-concluido-texto: #1f6f3a;
    }

    .flg-footer {
      position: relative;
      margin-top: auto;
      padding: 14px 56px 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      border-top: 1px solid var(--flg-footer-borda);
      flex-wrap: wrap;
    }

    /* Botão único que substitui o rodapé inteiro no app Fluig Mobile. */
    .flg-footer-gatilhoMobile {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 14px 18px;
      margin-top: auto;
      border: 1px solid var(--flg-footer-borda);
      border-radius: 0;
      background: var(--flg-footer-card-fundo);
      color: var(--flg-footer-texto-forte);
      cursor: pointer;
    }

    .flg-footer-gatilhoMobile-texto {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    /* Cartão de cada aba. */
    .flg-footer-card {
      min-width: 230px;
      max-width: 260px;
      padding: 16px 18px;
      border: 1px solid var(--flg-footer-borda);
      border-radius: 16px;
      background: var(--flg-footer-card-fundo);
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      transition: all .22s ease;
      box-shadow: 0 6px 16px rgba(44, 24, 8, 0.04);
    }

    .flg-footer-card:hover {
      border-color: var(--flg-footer-destaque);
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(44, 24, 8, .08);
    }

    /* Aba aberta no momento. */
    .flg-footer-card--ativo {
      border-color: var(--flg-footer-destaque);
      background: var(--flg-footer-ativo-fundo);
      box-shadow: 0 0 0 3px rgba(240, 128, 30, 0.12), 0 4px 14px rgba(44, 24, 8, 0.06);
    }

    /* Abas que ficaram para trás. */
    .flg-footer-card--concluido {
      border-color: #e6d4c5;
      background: #fffaf5;
      opacity: 0.75;
    }

    .flg-footer-card--concluido .flg-footer-circulo {
      background: var(--flg-footer-concluido-circulo);
      color: var(--flg-footer-concluido-texto);
    }

    /* Número dentro do círculo. */
    .flg-footer-circulo {
      width: 42px;
      height: 42px;
      min-width: 42px;
      border-radius: 50%;
      background: var(--flg-footer-circulo-fundo);
      color: var(--flg-footer-circulo-texto);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 15px;
    }

    .flg-footer-card--ativo .flg-footer-circulo {
      background: var(--flg-footer-ativo-circulo);
      color: #2a2018;
    }

    /* Textos do cartão. */
    .flg-footer-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .flg-footer-rotulo {
      font-size: 9px;
      font-weight: 800;
      color: var(--flg-footer-texto-fraco);
      text-transform: uppercase;
      letter-spacing: .3px;
    }

    .flg-footer-nome {
      font-size: 13px;
      font-weight: 800;
      color: var(--flg-footer-texto-forte);
      line-height: 1.2;
    }

    .flg-footer-subtitulo {
      font-size: 11px;
      color: var(--flg-footer-texto-fraco);
      line-height: 1.2;
    }

    /* Tracinho entre os cartões. */
    .flg-footer-conector {
      width: 46px;
      height: 2px;
      flex-shrink: 0;
    }

    .flg-footer-conector-linha {
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, #ead8c8, #d9b99d);
      border-radius: 999px;
    }

    /* Setas de navegação nas laterais. */
    .flg-footer-seta {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      padding: 0;
      color: var(--flg-footer-texto-forte);
      cursor: pointer;
      z-index: 10;
      font-size: 28px;
      line-height: 1;
      transition: color .2s ease;
    }

    .flg-footer-seta:hover {
      color: var(--flg-footer-destaque);
    }

    .flg-footer-seta--esquerda { left: 12px; }
    .flg-footer-seta--direita { right: 12px; }

    .flg-footer-seta:disabled,
    .flg-footer-seta[disabled] {
      opacity: 0.3;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* No celular os cards empilham — só entra em jogo se
       [somenteSidebarNoMobile]="false". */
    @media (max-width: 720px) {
      .flg-footer {
        flex-direction: column;
        padding: 20px 16px;
      }

      .flg-footer-conector { display: none; }

      .flg-footer-card {
        max-width: none;
        width: 100%;
      }

      .flg-footer-seta { display: none; }
    }
  `,
})
export class FluigWizardFooterComponent {
  private readonly fluig = inject(FluigService);

  /** Páginas do formulário, na ordem de navegação. */
  @Input({ required: true }) abas!: FluigWizardAba[];

  /** Nome da página aberta agora. */
  @Input({ required: true }) paginaAtual!: string;

  /** No app Fluig Mobile, vira um botão que abre a navegação num sidebar. */
  @Input() somenteSidebarNoMobile = true;

  /** Título mostrado no topo do sidebar mobile. */
  @Input() tituloSidebar = 'Navegação';

  /** Palavra usada em "ETAPA 2 DE 3" — troque para "PÁGINA", "PASSO"... */
  @Input() rotuloEtapa = 'ETAPA';

  /** Emite o nome da página escolhida — o pai decide o que fazer. */
  @Output() mudarPagina = new EventEmitter<string>();

  mostrarSidebarMobile(): boolean {
    return this.somenteSidebarNoMobile && this.fluig.ehMobile();
  }

  /** Abas que a regra `visivel` deixa aparecer. */
  abasVisiveis(): FluigWizardAba[] {
    return this.abas.filter((aba) => (aba.visivel ? aba.visivel() : true));
  }

  /**
   * Posição da aba aberta DENTRO das visíveis — por isso a numeração dos
   * cards ignora as abas escondidas e mostra "ETAPA 2 DE 3" em vez de pular
   * números.
   */
  posicaoAtual(): number {
    return this.abasVisiveis().findIndex((aba) => aba.nome === this.paginaAtual);
  }

  classeAba(posicao: number): string {
    const atual = this.posicaoAtual();
    let classe = 'flg-footer-card';
    if (posicao === atual) classe += ' flg-footer-card--ativo';
    if (posicao < atual) classe += ' flg-footer-card--concluido';
    return classe;
  }

  irParaAnterior(): void {
    const visiveis = this.abasVisiveis();
    const atual = this.posicaoAtual();
    if (atual > 0) this.mudarPagina.emit(visiveis[atual - 1].nome);
  }

  irParaProxima(): void {
    const visiveis = this.abasVisiveis();
    const atual = this.posicaoAtual();
    if (atual < visiveis.length - 1) this.mudarPagina.emit(visiveis[atual + 1].nome);
  }

  /**
   * Abre o sidebar com a mesma navegação, em lista vertical.
   *
   * O clique de cada item chama uma função global
   * (`window.__flgWizardFooterSelecionarAba`) porque o HTML do sidebar é
   * injetado pelo FLUIGC fora do Angular — não dá para usar `(click)` do
   * template num conteúdo que o Angular não renderizou. Isso significa que
   * só o ÚLTIMO `<flg-wizard-footer>` que abriu um sidebar fica escutando —
   * inofensivo na prática, porque só existe um rodapé de navegação por tela.
   */
  abrirSidebar(): void {
    this.garantirSidebarNaEsquerda();

    (window as unknown as Record<string, unknown>)['__flgWizardFooterSelecionarAba'] = (nome: string) => {
      this.mudarPagina.emit(nome);
      // `data-dismiss="sidebar"` é o atributo que o próprio FLUIGC usa para
      // fechar o painel — clicar nele por código equivale a clicar no botão.
      document.querySelector('[data-dismiss="sidebar"]')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    };

    this.fluig.abrirSidebar({
      title: this.tituloSidebar,
      backdrop: true,
      actions: [{ label: 'Fechar', bind: 'data-close', autoClose: true }],
      content: this.montarConteudoSidebar(),
    });
  }

  /**
   * O `FLUIGC.sidebar` abre encostado na DIREITA por padrão — a API não tem
   * opção de lado (ver style.fluig.com/javascript.html#sidebar). Injeta uma
   * regra global, uma vez só, sobrescrevendo a classe que a biblioteca usa
   * (`.fluig-sidebar-content`) para ancorar à ESQUERDA, feito menu.
   */
  private garantirSidebarNaEsquerda(): void {
    const idEstilo = 'flg-footer-sidebar-esquerda';
    if (document.getElementById(idEstilo)) return;

    const estilo = document.createElement('style');
    estilo.id = idEstilo;
    estilo.textContent = `
      .fluig-sidebar-content {
        left: 0 !important;
        right: auto !important;
      }
    `;
    document.head.appendChild(estilo);
  }

  private montarConteudoSidebar(): string {
    const visiveis = this.abasVisiveis();

    return visiveis
      .map((aba, posicao) => {
        const ativo = posicao === this.posicaoAtual();
        const concluido = posicao < this.posicaoAtual();

        const corBorda = ativo ? '#f0801e' : concluido ? '#e6d4c5' : '#efe7de';
        const corCirculo = ativo ? '#ffa751' : concluido ? '#d4f1de' : '#f7ece2';
        const corTextoCirculo = ativo ? '#2a2018' : concluido ? '#1f6f3a' : '#8a4a20';

        return `
          <div onclick="window.__flgWizardFooterSelecionarAba('${this.escapar(aba.nome)}')"
            style="display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:12px;border:1px solid ${corBorda};border-radius:16px;cursor:pointer;background:#fffdfb;">
            <div style="width:38px;height:38px;min-width:38px;border-radius:50%;background:${corCirculo};color:${corTextoCirculo};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;">
              ${posicao + 1}
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
              <span style="font-size:9px;font-weight:800;color:#a5856d;text-transform:uppercase;letter-spacing:.3px;">
                ${this.escapar(this.rotuloEtapa)} ${posicao + 1} DE ${visiveis.length}
              </span>
              <span style="font-size:14px;font-weight:800;color:#2b211a;line-height:1.2;">
                ${this.escapar(aba.nome)}
              </span>
              ${aba.subtitulo ? `<span style="font-size:12px;color:#a5856d;line-height:1.2;">${this.escapar(aba.subtitulo)}</span>` : ''}
            </div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Escapa o texto para entrar seguro dentro de `onclick="...('texto')"`.
   *
   * A aspa simples vira `\'` (barra invertida) e não `&#39;`: o navegador
   * decodifica entidades HTML do atributo ANTES de interpretar o JavaScript
   * do `onclick` — com `&#39;`, o texto decodificado teria uma aspa simples
   * literal, que fecharia a string do JS mais cedo. Já a aspa dupla vira
   * `&quot;` porque ela delimita o atributo HTML por fora, então essa
   * precisa sobreviver como entidade.
   */
  private escapar(texto: string): string {
    return texto
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
