import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FluigService } from '../fluig/fluig.service';
import { FluigWizardEtapa } from '../wizard/wizard.model';
import {
  FLUIG_HISTORICO_CAMPOS_PADRAO,
  FluigHistoricoCampos,
  FluigHistoricoLinha,
} from './historico.model';

/**
 * Linha do tempo com as movimentações do processo.
 *
 * Basta jogar a tag na tela — o componente lê a tabela filha do formulário,
 * resolve o nome e a foto de cada usuário e monta os cards. Também aceita as
 * linhas prontas via `[linhas]`, útil para testes e para telas que já têm os
 * dados em mãos.
 *
 * Cada card mostra quem movimentou, de qual etapa para qual, quando, e a
 * observação. A borda fica verde quando o processo avançou e vermelha quando
 * voltou (reprovação, correção).
 *
 * @example
 * <flg-historico [etapas]="etapas" [atividadeAtual]="fluig.WKNumState" />
 */
@Component({
  selector: 'flg-historico',
  standalone: true,
  template: `
    <div class="flg-historico">
      <div class="flg-historico-painel">
        <div class="flg-historico-cabecalho">{{ titulo }}</div>

        <div class="flg-historico-corpo">
          @if (itens().length === 0) {
            <div class="flg-historico-vazio">{{ textoVazio }}</div>
          } @else {
            <div class="flg-historico-lista">
              @for (linha of itens(); track $index) {
                <div [class]="classeCard(linha)">
                  <div class="flg-historico-avatar">
                    <img class="flg-historico-foto" [src]="foto(linha.usuario)" alt=""
                      (error)="esconderFoto($event)" />
                  </div>

                  <div class="flg-historico-conteudo">
                    <h3 class="flg-historico-usuario">
                      {{ nome(linha.usuario) }}
                      <small class="flg-historico-etapa">{{ linha.atividade }}</small>
                      @if (linha.proximaAtividade) {
                        <!-- Seta em texto de propósito: não depende da fonte
                             de ícones do Fluig, então o componente renderiza
                             igual dentro e fora do portal. -->
                        <span class="flg-historico-seta" aria-hidden="true">&#8594;</span>
                        <small class="flg-historico-etapa">{{ linha.proximaAtividade }}</small>
                      }
                    </h3>

                    <small class="flg-historico-data">{{ formataData(linha.data) }}</small>
                    <p class="flg-historico-texto">{{ linha.observacao.trim() || linha.acao }}</p>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    /* Nomenclatura: flg-historico-<elemento>--<modificador> */

    :host {
      --flg-historico-borda: #ddd;
      --flg-historico-fundo: #fff;
      --flg-historico-cabecalho-fundo: #eaeaea;
      --flg-historico-cabecalho-texto: #58595b;
      --flg-historico-positivo: #1f7a3f;
      --flg-historico-negativo: #c1392b;
      --flg-historico-texto-fraco: #777;
      --flg-historico-raio: 4px;
    }

    .flg-historico-painel {
      border: 1px solid var(--flg-historico-borda);
      border-radius: var(--flg-historico-raio);
      overflow: hidden;
      background: var(--flg-historico-fundo);
    }

    .flg-historico-cabecalho {
      background-color: var(--flg-historico-cabecalho-fundo);
      border-bottom: 1px solid var(--flg-historico-borda);
      padding: 10px 15px;
      font-size: 16px;
      font-weight: 700;
      color: var(--flg-historico-cabecalho-texto);
    }

    .flg-historico-corpo { padding: 15px; }

    .flg-historico-vazio {
      padding: 24px;
      text-align: center;
      color: #999;
      font-size: 13px;
      border: 1px dashed var(--flg-historico-borda);
      border-radius: var(--flg-historico-raio);
      background: #f7f8fa;
    }

    .flg-historico-lista {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* Card de uma movimentação. */
    .flg-historico-card {
      display: flex;
      gap: 20px;
      padding: 15px;
      background: var(--flg-historico-fundo);
      border: 1px solid var(--flg-historico-borda);
      border-radius: var(--flg-historico-raio);
    }

    /* Processo avançou (aprovação, envio). */
    .flg-historico-card--positivo { border-color: var(--flg-historico-positivo); }

    /* Processo voltou (reprovação, correção, devolução). */
    .flg-historico-card--negativo { border-color: var(--flg-historico-negativo); }

    .flg-historico-avatar {
      width: 60px;
      height: 60px;
      min-width: 60px;
      background: #ececec;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }

    .flg-historico-foto {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
    }

    .flg-historico-conteudo { min-width: 0; }

    .flg-historico-usuario {
      font-size: 16px;
      font-weight: 600;
      color: #000;
      margin: 0 0 2px;
      line-height: 1.35;
    }

    .flg-historico-etapa {
      color: var(--flg-historico-texto-fraco);
      font-weight: 400;
      font-size: 12px;
      margin-left: 4px;
    }

    .flg-historico-seta {
      color: var(--flg-historico-texto-fraco);
      font-size: 12px;
      font-weight: 400;
      margin: 0 4px;
    }

    .flg-historico-data {
      font-size: 12px;
      color: var(--flg-historico-texto-fraco);
    }

    .flg-historico-texto {
      margin: 6px 0 0;
      color: #333;
      font-size: 14px;
      line-height: 1.55;
      word-break: break-word;
    }
  `,
})
export class FluigHistoricoComponent implements OnInit {
  private readonly fluig = inject(FluigService);

  /** Título do painel. */
  @Input() titulo = 'Histórico';

  /** Texto mostrado quando não há nenhuma movimentação. */
  @Input() textoVazio = 'Nenhuma movimentação registrada até o momento.';

  /**
   * As mesmas etapas passadas ao wizard. Servem para descobrir a ORDEM das
   * etapas e, com isso, saber se cada movimentação avançou ou voltou no
   * fluxo. Sem elas o componente ainda funciona, mas cai na análise por
   * palavra-chave ("aprovar" / "reprovar") para colorir a borda.
   */
  @Input() etapas: FluigWizardEtapa[] = [];

  /** Atividade atual — vira o destino da última movimentação registrada. */
  @Input() atividadeAtual = 0;

  /**
   * Nome REAL da atividade atual, para usar como destino da última linha.
   * Use quando `etapas` agrupa mais de uma atividade na mesma macro-etapa
   * (ex: Aprovação e Correção juntas na barra do wizard). Sem essa entrada,
   * o componente deriva o nome de `etapas`, o que mostra o nome do GRUPO em
   * vez do nome da atividade em si.
   */
  @Input() nomeAtividadeAtual?: string;

  /** Só mexer se o processo batizou a tabela/colunas de outro jeito. */
  @Input() campos: FluigHistoricoCampos = FLUIG_HISTORICO_CAMPOS_PADRAO;

  /** Se informado, o componente usa esta lista em vez de ler o formulário. */
  @Input() linhas?: FluigHistoricoLinha[];

  protected readonly itens = signal<FluigHistoricoLinha[]>([]);

  ngOnInit(): void {
    const lidas = this.linhas ?? this.fluig.lerHistorico(this.campos);
    this.itens.set(this.encadearDestinos(lidas).reverse());
  }

  /**
   * A tabela guarda de ONDE cada movimentação saiu, mas não para onde foi.
   * O destino de uma linha é a origem da linha seguinte; a última
   * movimentação aponta para a etapa em que o processo está agora.
   */
  private encadearDestinos(linhas: FluigHistoricoLinha[]): FluigHistoricoLinha[] {
    const etapaAtual = this.nomeAtividadeAtual ?? this.nomeEtapa(this.atividadeAtual);

    return linhas.map((linha, i) => ({
      ...linha,
      proximaAtividade: linhas[i + 1]?.atividade ?? (i === linhas.length - 1 ? etapaAtual : ''),
    }));
  }

  /** Nome da etapa que contém a atividade informada. */
  private nomeEtapa(atividade: number): string {
    return this.etapas.find((e) => e.atividades.indexOf(atividade) !== -1)?.nome ?? '';
  }

  /** Posição da etapa na lista, 1-based. Devolve 0 quando não encontra. */
  private ordemEtapa(nome: string): number {
    const indice = this.etapas.findIndex((e) => e.nome === (nome || '').trim());
    return indice === -1 ? 0 : indice + 1;
  }

  /**
   * Verde quando a movimentação avançou no fluxo, vermelho quando voltou.
   * A comparação por ordem das etapas é a fonte confiável; a análise das
   * palavras só entra quando alguma das etapas não está mapeada.
   */
  protected classeCard(linha: FluigHistoricoLinha): string {
    const origem = this.ordemEtapa(linha.atividade);
    const destino = this.ordemEtapa(linha.proximaAtividade ?? '');

    let modificador = '';
    if (origem && destino && destino !== origem) {
      modificador = destino > origem ? '--positivo' : '--negativo';
    } else {
      const acao = (linha.acao || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');

      if (/reprov|devolv|corrig|correcao|cancel/.test(acao)) modificador = '--negativo';
      else if (/aprov|envi|reenvio|finaliz/.test(acao)) modificador = '--positivo';
    }

    return modificador
      ? `flg-historico-card flg-historico-card${modificador}`
      : 'flg-historico-card';
  }

  /** `2026-09-02 16:53:29` (formato do Fluig) vira `02/09/2026 16:53:29`. */
  protected formataData(data: string): string {
    const [dia, hora = ''] = (data || '').split(' ');
    if (!dia) return '';

    const partes = dia.split('-');
    if (partes.length !== 3) return data;

    return `${partes.reverse().join('/')} ${hora}`.trim();
  }

  protected nome(matricula: string): string {
    return this.fluig.nomeUsuario(matricula);
  }

  protected foto(matricula: string): string {
    return this.fluig.fotoUsuario(matricula);
  }

  /** Usuário sem foto cadastrada: esconde a imagem e deixa o círculo cinza. */
  protected esconderFoto(evento: Event): void {
    (evento.target as HTMLImageElement).style.display = 'none';
  }
}
