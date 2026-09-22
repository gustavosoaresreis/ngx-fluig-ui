import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FluigService } from '../fluig/fluig.service';
import { FluigAcaoDecisao } from './acoes.model';

/**
 * Botões de decisão + campo de observação da etapa.
 *
 * No DESKTOP, substitui o botão "Enviar" nativo do Fluig: ao clicar, grava a
 * decisão e a observação nos campos do formulário e só então dispara o envio
 * nativo (que fica escondido por `FluigService.ocultarEnvioNativo()`).
 *
 * Na atividade 0 (Início) o componente ignora `acoes` e mostra só o botão de
 * envio — Aprovar/Reprovar não fazem sentido antes de a solicitação existir.
 * Use `[somenteEnviarNoInicio]="false"` para desligar essa regra.
 *
 * NO APP FLUIG MOBILE o botão "Enviar" é nativo do app, fora do DOM
 * acessível, sem como esconder nem clicar por código. Por isso, havendo 2+
 * ações no mobile, os botões viram CHECKBOXES: marcar um já grava a decisão
 * no campo na hora, e quando o usuário toca no Enviar nativo, o Fluig lê o
 * que estava gravado. **Consequência:** `exigeObservacao` só bloqueia de
 * verdade no desktop — no mobile o componente apenas mostra um aviso.
 *
 * @example
 * <flg-acoes
 *   [acoes]="[
 *     { rotulo: 'Aprovar', valor: 'aprovar', estilo: 'positivo' },
 *     { rotulo: 'Reprovar', valor: 'reprovar', estilo: 'negativo', exigeObservacao: true }
 *   ]" />
 */
@Component({
  selector: 'flg-acoes',
  standalone: true,
  template: `
    <div class="flg-acoes">
      @if (mobileComCheckbox()) {
        <div class="flg-acoes-checkboxes">
          @for (acao of acoesVisiveis(); track acao.valor) {
            <label [class]="classeCheckboxItem(acao)">
              <input type="checkbox" [checked]="decisaoSelecionada() === acao.valor"
                (change)="selecionarViaCheckbox(acao, $event)" />
              <span>{{ acao.rotulo }}</span>
            </label>
          }
        </div>

        @if (precisaJustificar()) {
          <span class="flg-acoes-erro">
            {{ acaoSelecionada()?.rotulo }} normalmente pede uma justificativa — preencha antes de tocar em Enviar.
          </span>
        }
      } @else if (acoesVisiveis().length) {
        <div class="flg-acoes-botoes">
          @for (acao of acoesVisiveis(); track acao.valor) {
            <button type="button" [class]="classeBotao(acao)" [disabled]="enviando()"
              (click)="decidir(acao)">
              {{ acao.rotulo }}
            </button>
          }
        </div>
      }

      <div class="flg-acoes-observacao">
        <label [attr.for]="idObservacao">{{ rotuloObservacao }}</label>
        <textarea [id]="idObservacao" rows="4" [placeholder]="placeholder"
          [class.flg-acoes-campo--erro]="erro()"
          [value]="observacao()"
          (input)="aoDigitar($event)"></textarea>

        @if (erro()) {
          <span class="flg-acoes-erro">{{ erro() }}</span>
        }
      </div>
    </div>
  `,
  styles: `
    /* Nomenclatura: flg-acoes-<elemento>--<modificador> */

    :host {
      --flg-acoes-positivo: #1f7a3f;
      --flg-acoes-negativo: #b03a2e;
      --flg-acoes-neutro: #58595b;
      --flg-acoes-erro: #d9534f;
      --flg-acoes-borda: #ccc;
      --flg-acoes-campo-fundo: #f7f8fa;
      --flg-acoes-raio: 4px;
    }

    .flg-acoes-botoes {
      display: flex;
      justify-content: center;
      gap: 14px;
      margin-bottom: 22px;
      flex-wrap: wrap;
    }

    .flg-acoes-botao {
      min-width: 300px;
      padding: 8px 24px;
      font-size: 14px;
      font-weight: 400;
      color: #fff;
      border: none;
      border-radius: var(--flg-acoes-raio);
      cursor: pointer;
      transition: filter .15s ease;
    }

    .flg-acoes-botao:hover:not(:disabled) { filter: brightness(1.08); }

    .flg-acoes-botao:disabled {
      opacity: .6;
      cursor: not-allowed;
    }

    .flg-acoes-botao--positivo { background: var(--flg-acoes-positivo); }
    .flg-acoes-botao--negativo { background: var(--flg-acoes-negativo); }
    .flg-acoes-botao--neutro { background: var(--flg-acoes-neutro); }

    /* Checkboxes de decisão, usados só no app Fluig Mobile. */
    .flg-acoes-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 18px;
    }

    .flg-acoes-checkboxItem {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border: 1px solid var(--flg-acoes-borda);
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #333;
    }

    .flg-acoes-checkboxItem input {
      width: 18px;
      height: 18px;
    }

    .flg-acoes-checkboxItem--positivo { border-color: var(--flg-acoes-positivo); }
    .flg-acoes-checkboxItem--negativo { border-color: var(--flg-acoes-negativo); }

    .flg-acoes-observacao { margin-bottom: 24px; }

    .flg-acoes-observacao label {
      display: block;
      margin-bottom: 7px;
      font-weight: 600;
      color: var(--flg-acoes-neutro);
    }

    .flg-acoes-observacao textarea {
      width: 100%;
      box-sizing: border-box;
      min-height: 100px;
      resize: vertical;
      border: 1px solid var(--flg-acoes-borda);
      border-radius: var(--flg-acoes-raio);
      background-color: var(--flg-acoes-campo-fundo);
      padding: 6px 12px;
      font-size: 14px;
      font-family: inherit;
      color: var(--flg-acoes-neutro);
    }

    .flg-acoes-observacao textarea:focus {
      border-color: #66afe9;
      outline: 0;
    }

    .flg-acoes-campo--erro {
      border-color: var(--flg-acoes-erro) !important;
      background-color: #fff5f5 !important;
    }

    .flg-acoes-erro {
      display: block;
      margin-top: 6px;
      font-size: 13px;
      color: var(--flg-acoes-erro);
    }

    @media (max-width: 720px) {
      .flg-acoes-botao { min-width: 100%; }
    }
  `,
})
export class FluigAcoesComponent {
  private readonly fluig = inject(FluigService);

  /** Os botões de decisão desta etapa. Vazio = só o campo de observação. */
  @Input() acoes: FluigAcaoDecisao[] = [];

  /**
   * Na atividade 0 (Início — solicitação nova), só o botão de envio fica
   * disponível, não importa o que tenha em `acoes`. Aprovar/Reprovar só
   * fazem sentido depois que a solicitação já foi enviada. Passe `false`
   * para desligar essa regra.
   */
  @Input() somenteEnviarNoInicio = true;

  /** Rótulo do botão de envio, mostrado só na etapa Início. */
  @Input() rotuloEnviar = 'Enviar Solicitação';

  /** Valor gravado no campo de decisão ao enviar da etapa Início. */
  @Input() valorEnviar = 'enviar';

  /**
   * No app Fluig Mobile, havendo 2 ou mais ações, elas viram checkboxes
   * (marcar já grava a decisão; quem envia de fato é o botão nativo do app).
   * Desligue para manter os botões mesmo no mobile — nesse caso o clique
   * chama `FluigService.enviar()`, que no app não encontra o botão nativo e
   * simplesmente não faz nada.
   */
  @Input() acoesComoCheckboxNoMobile = true;

  /**
   * Atividade atual, para saber se está no Início. Sem ela, o componente lê
   * direto do formulário — na maioria dos casos nem precisa passar.
   */
  @Input() atividadeAtual?: number;

  /** Rótulo acima do campo de texto. */
  @Input() rotuloObservacao = 'Demais Informações:';

  @Input() placeholder = 'Digite aqui sua observação, justificativa ou orientação para a próxima etapa.';

  /** id do campo onde a decisão é gravada (lido pelo gateway). */
  @Input() campoDecisao = 'selectDecisao';

  /** id do campo onde a observação é gravada (lida pelo `beforeTaskSave`). */
  @Input() campoObservacao = 'observacaoValidacao';

  /** id do textarea; não usa o do campo do form para os dois não colidirem. */
  @Input() idObservacao = 'flgAcoesObservacao';

  /**
   * Avisa qual decisão foi tomada, logo antes de o envio nativo disparar
   * (ou assim que marcada, no modo checkbox do mobile).
   */
  @Output() decidiu = new EventEmitter<FluigAcaoDecisao>();

  protected readonly observacao = signal('');
  protected readonly erro = signal('');
  protected readonly enviando = signal(false);

  /** Valor marcado nos checkboxes do modo mobile. `null` = nada marcado. */
  protected readonly decisaoSelecionada = signal<string | null>(null);

  /** A atividade 0 é sempre o início (solicitação nova) no Fluig. */
  private noInicio(): boolean {
    return (this.atividadeAtual ?? this.fluig.WKNumState) === 0;
  }

  protected acoesVisiveis(): FluigAcaoDecisao[] {
    if (this.somenteEnviarNoInicio && this.noInicio()) {
      return [{ rotulo: this.rotuloEnviar, valor: this.valorEnviar, estilo: 'positivo' }];
    }

    return this.acoes.filter((acao) => (acao.visivel ? acao.visivel() : true));
  }

  /** Checkboxes só fazem sentido havendo uma decisão real entre 2+ opções. */
  protected mobileComCheckbox(): boolean {
    return this.acoesComoCheckboxNoMobile && this.fluig.ehMobile() && this.acoesVisiveis().length > 1;
  }

  protected classeBotao(acao: FluigAcaoDecisao): string {
    return `flg-acoes-botao flg-acoes-botao--${acao.estilo ?? 'neutro'}`;
  }

  protected classeCheckboxItem(acao: FluigAcaoDecisao): string {
    return `flg-acoes-checkboxItem flg-acoes-checkboxItem--${acao.estilo ?? 'neutro'}`;
  }

  protected acaoSelecionada(): FluigAcaoDecisao | undefined {
    return this.acoesVisiveis().find((acao) => acao.valor === this.decisaoSelecionada());
  }

  /** Aviso best-effort — não bloqueia o toque no Enviar nativo do app. */
  protected precisaJustificar(): boolean {
    return !!this.acaoSelecionada()?.exigeObservacao && !this.observacao().trim();
  }

  /**
   * Marca a decisão e já grava no campo, na hora — diferente do modo botão,
   * aqui não existe um clique final para disparar a gravação depois.
   * Desmarcar o checkbox limpa a decisão gravada.
   */
  protected selecionarViaCheckbox(acao: FluigAcaoDecisao, evento: Event): void {
    const marcado = (evento.target as HTMLInputElement).checked;
    this.decisaoSelecionada.set(marcado ? acao.valor : null);
    this.fluig.setValue(this.campoDecisao, marcado ? acao.valor : '');

    if (marcado) this.decidiu.emit(acao);
  }

  protected aoDigitar(evento: Event): void {
    const texto = (evento.target as HTMLTextAreaElement).value;
    this.observacao.set(texto);
    if (this.erro()) this.erro.set('');

    // No mobile não existe um clique final que grave a observação antes do
    // envio — grava a cada tecla para estar pronta quando o Enviar nativo do
    // app for tocado.
    if (this.mobileComCheckbox()) {
      this.fluig.setValue(this.campoObservacao, texto.trim());
    }
  }

  /**
   * Grava decisão e observação nos campos do formulário e dispara o envio.
   * A ordem importa: os campos precisam estar preenchidos ANTES do clique no
   * botão nativo, porque é ele que salva o card e movimenta o processo.
   *
   * Só usado no modo botão (desktop, ou mobile com uma ação só / com
   * `[acoesComoCheckboxNoMobile]="false"`).
   */
  protected decidir(acao: FluigAcaoDecisao): void {
    const texto = this.observacao().trim();

    if (acao.exigeObservacao && !texto) {
      this.erro.set('Informe uma justificativa para continuar.');
      return;
    }

    this.erro.set('');
    this.enviando.set(true);

    this.fluig.setValue(this.campoDecisao, acao.valor);
    this.fluig.setValue(this.campoObservacao, texto);

    this.decidiu.emit(acao);

    if (!this.fluig.enviar()) {
      // Fora do Fluig (ou no app Mobile) não há botão nativo para clicar;
      // libera os botões de volta para não deixar a tela travada.
      this.enviando.set(false);
    }
  }
}
