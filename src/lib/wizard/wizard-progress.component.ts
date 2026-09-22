import { Component, Input, inject } from '@angular/core';
import { FluigService } from '../fluig/fluig.service';
import { FluigWizardEtapa } from './wizard.model';

/**
 * Barra de etapas do topo (as "setas" encaixadas).
 *
 * Só depende do Fluig para uma coisa: saber se está rodando no app Fluig
 * Mobile (`FluigService.ehMobile()`), para colapsar a barra numa seta só. O
 * resto é apresentação pura — recebe as etapas e a atividade atual, sem
 * conhecer nenhum processo específico.
 *
 * No app Fluig Mobile a tela é estreita demais para caber 3+ setas sem
 * espremer o texto a ponto de ficar ilegível, então por padrão só a etapa
 * ATUAL aparece. Desligue com `[somenteEtapaAtualNoMobile]="false"` para
 * manter a barra completa (ela passa a rolar na horizontal).
 *
 * As cores saem de variáveis CSS — sobrescreva no seu tema para aplicar a
 * identidade visual da sua empresa, sem tocar no componente.
 *
 * @example
 * <flg-wizard-progress [etapas]="etapas" [atividadeAtual]="fluig.WKNumState" />
 */
@Component({
  selector: 'flg-wizard-progress',
  standalone: true,
  template: `
    <div class="flg-wizard">
      @for (etapa of etapasVisiveis(); track etapa.nome; let indice = $index) {
        <div [class]="classeEtapa(indice)">{{ etapa.nome }}</div>
      }
    </div>
  `,
  styles: `
    /* Nomenclatura: flg-wizard-<elemento>--<modificador> */

    :host {
      --flg-wizard-raio: 14px;
      --flg-wizard-fundo: #fff;
      --flg-wizard-etapa-fundo: linear-gradient(145deg, #f0f0f0, #dcdcdc);
      --flg-wizard-etapa-texto: #333;
      --flg-wizard-ativa-fundo: linear-gradient(135deg, #ffe259, #ffa751);
      --flg-wizard-ativa-texto: #000;
      --flg-wizard-ativa-sombra: rgba(255, 193, 7, 0.25);
      --flg-wizard-concluida-fundo: linear-gradient(to right, #43cea2, #185a9d);
      --flg-wizard-concluida-texto: #fff;
      --flg-wizard-fonte: 'Inter', 'Open Sans', sans-serif;
    }

    .flg-wizard {
      display: flex;
      font-family: var(--flg-wizard-fonte);
      overflow: hidden;
      border-radius: var(--flg-wizard-raio);
      background: var(--flg-wizard-fundo);
      margin-bottom: 20px;
      width: 99%;
    }

    /* Cada seta. O clip-path recorta a ponta à direita e o encaixe à
       esquerda; a margem negativa é o que faz uma encaixar na outra. */
    .flg-wizard .flg-wizard-etapa {
      position: relative;
      flex: 1;
      padding: 16px 20px;
      background: var(--flg-wizard-etapa-fundo);
      color: var(--flg-wizard-etapa-texto);
      text-align: center;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: .5px;
      text-transform: uppercase;
      clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%, 20px 50%);
      margin-left: -20px;
      z-index: 1;
      transition: all .3s ease;
      white-space: nowrap;
    }

    /* A primeira não tem encaixe à esquerda, a última não tem ponta à
       direita. */
    .flg-wizard .flg-wizard-etapa:first-child {
      margin-left: 0;
      clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%);
      border-top-left-radius: var(--flg-wizard-raio);
      border-bottom-left-radius: var(--flg-wizard-raio);
    }

    .flg-wizard .flg-wizard-etapa:last-child {
      clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 0, 100% 100%, calc(100% - 20px) 100%, 0 100%, 20px 50%);
      border-top-right-radius: var(--flg-wizard-raio);
      border-bottom-right-radius: var(--flg-wizard-raio);
    }

    /* Etapa em que o processo está agora. */
    .flg-wizard .flg-wizard-etapa--ativa {
      background: var(--flg-wizard-ativa-fundo);
      color: var(--flg-wizard-ativa-texto);
      z-index: 2;
      box-shadow: 0 8px 16px var(--flg-wizard-ativa-sombra);
      transform: scale(1.02);
    }

    /* Etapas que já ficaram para trás. */
    .flg-wizard .flg-wizard-etapa--concluida {
      background: var(--flg-wizard-concluida-fundo);
      color: var(--flg-wizard-concluida-texto);
    }

    .flg-wizard .flg-wizard-etapa:not(.flg-wizard-etapa--ativa):hover {
      box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    /* Quando só sobra UMA etapa (mobile colapsado), as regras de first-child
       E last-child caem no mesmo elemento. A cascata escolheria a última
       declarada (last-child), que ainda corta a pontinha esquerda e deixa um
       "bico" torto numa barra que devia ser um retângulo. :only-child entra
       depois das duas e vence a disputa, removendo o recorte por completo. */
    .flg-wizard .flg-wizard-etapa:only-child {
      clip-path: none;
      margin-left: 0;
      border-radius: var(--flg-wizard-raio);
    }

    /* No celular a barra rola na horizontal em vez de espremer as etapas —
       só entra em jogo se [somenteEtapaAtualNoMobile]="false". */
    @media (max-width: 767px) {
      .flg-wizard {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .flg-wizard .flg-wizard-etapa {
        flex-shrink: 0;
        font-size: 11px;
        padding: 12px 10px;
      }
    }
  `,
})
export class FluigWizardProgressComponent {
  private readonly fluig = inject(FluigService);

  /** Macro-etapas do processo, na ordem em que devem aparecer. */
  @Input({ required: true }) etapas!: FluigWizardEtapa[];

  /** Id da atividade em que a solicitação está (WKNumState). */
  @Input({ required: true }) atividadeAtual!: number;

  /** No app Fluig Mobile, mostra só a etapa atual em vez da barra inteira. */
  @Input() somenteEtapaAtualNoMobile = true;

  /** Etapas que a regra `visivel` deixa aparecer, antes do recorte de mobile. */
  private etapasBase(): FluigWizardEtapa[] {
    return this.etapas.filter((etapa) => (etapa.visivel ? etapa.visivel() : true));
  }

  /** As etapas que de fato aparecem na tela — já considerando o mobile. */
  etapasVisiveis(): FluigWizardEtapa[] {
    const base = this.etapasBase();
    if (!this.somenteEtapaAtualNoMobile || !this.fluig.ehMobile()) return base;

    const etapaAtual = base[this.indiceEtapaAtivaEm(base)];
    return etapaAtual ? [etapaAtual] : base;
  }

  /**
   * Posição da etapa em que o processo está, dentro da lista informada.
   * Se a atividade atual não estiver mapeada em nenhuma etapa, cai na
   * primeira em vez de deixar a barra sem destaque nenhum.
   */
  private indiceEtapaAtivaEm(etapas: FluigWizardEtapa[]): number {
    for (let i = 0; i < etapas.length; i++) {
      if (etapas[i].atividades.indexOf(this.atividadeAtual) !== -1) return i;
    }

    return 0;
  }

  /** Posição da etapa ativa dentro do que está sendo exibido agora. */
  indiceEtapaAtiva(): number {
    return this.indiceEtapaAtivaEm(this.etapasVisiveis());
  }

  /** Etapas antes da atual ficam "concluída"; a atual fica "ativa". */
  classeEtapa(indice: number): string {
    const ativa = this.indiceEtapaAtiva();
    let classe = 'flg-wizard-etapa';
    if (indice < ativa) classe += ' flg-wizard-etapa--concluida';
    if (indice === ativa) classe += ' flg-wizard-etapa--ativa';
    return classe;
  }
}
