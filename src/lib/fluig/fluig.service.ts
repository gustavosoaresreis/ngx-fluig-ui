import { Injectable } from '@angular/core';
import { FluigHistoricoCampos, FluigHistoricoLinha } from '../historico/historico.model';

// APIs que o Fluig injeta na página (vcXMLRPC.js e fluig-style-guide.min.js).
// Fora do Fluig elas não existem, por isso todo acesso é protegido por
// `typeof`. `formController` só existe dentro do app Fluig Mobile.
declare const DatasetFactory: any;
declare const ConstraintType: any;
declare const formController: any;
declare const FLUIGC: any;

/** Opções aceitas por `FLUIGC.sidebar(...)` — ver style.fluig.com/javascript.html#sidebar. */
export interface FluigSidebarOpcoes {
  title?: string;
  content: string;
  width?: string;
  backdrop?: boolean;
  actions?: Array<{ label: string; bind: string; autoClose?: boolean; flaticon?: string; btnLink?: boolean }>;
}

/**
 * Ponte entre o formulário Angular e o Fluig: leitura/escrita de campos,
 * controle da barra de ações nativa e leitura do histórico.
 *
 * Tudo aqui degrada em silêncio fora do Fluig (`ng serve`): os métodos caem
 * em valores padrão ou não fazem nada, então a tela continua rodando no
 * navegador para desenvolvimento.
 *
 * `getValue` / `setValue` / `WKNumState` / `formMode` usam os mesmos nomes do
 * pacote `fluig-form` de propósito, para quem circula entre os dois não ter
 * que decorar dois vocabulários. Diferença deliberada: aqui `WKNumState` e
 * `formMode` são *getters* que releem o DOM a cada acesso, em vez de serem
 * lidos uma única vez no construtor.
 */
@Injectable({ providedIn: 'root' })
export class FluigService {
  private static readonly ID_BOTAO_ENVIAR = 'send-process-button';

  // Um mesmo usuário costuma aparecer em várias linhas do histórico; sem
  // cache seria uma consulta ao dataset por linha.
  private readonly nomesEmCache = new Map<string, string>();

  // ---------------------------------------------------------------------
  // Formulário
  // ---------------------------------------------------------------------

  /** Lê o value de um campo do formulário pelo id. */
  getValue(id: string): string {
    const elemento = document.getElementById(id) as HTMLInputElement | null;
    return elemento?.value ?? '';
  }

  /** Grava um valor num campo do formulário. */
  setValue(id: string, valor: string): void {
    const campo = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
    if (campo) campo.value = valor;
  }

  /**
   * Id da atividade atual do processo (o `WKNumState` do Fluig).
   *
   * Depende de um campo hidden `atividade` preenchido pelo `displayFields.js`
   * do processo. Troque o id em `idCampoAtividade` se o seu form usa outro.
   */
  get WKNumState(): number {
    return Number(this.getValue(this.idCampoAtividade) || 0);
  }

  /** ADD, VIEW, EDIT — o modo em que o Fluig abriu o formulário. */
  get formMode(): string {
    return this.getValue(this.idCampoFormMode);
  }

  /** Id do campo hidden que guarda o WKNumState. Ajustável por processo. */
  idCampoAtividade = 'atividade';

  /** Id do campo hidden que guarda o formMode. Ajustável por processo. */
  idCampoFormMode = 'formMode';

  /** Atalho para o caso mais comum: tela só de leitura. */
  somenteLeitura(): boolean {
    return this.formMode === 'VIEW';
  }

  /**
   * `true` quando o formulário está rodando no app Fluig Mobile, ou em
   * qualquer tela estreita — o mesmo formulário atende os dois.
   *
   * Checa nesta ordem: `formController.getMobile()` (API oficial, só existe
   * dentro do app), depois o user-agent, depois a largura da janela.
   */
  ehMobile(): boolean {
    try {
      if (typeof formController !== 'undefined' && typeof formController.getMobile === 'function') {
        return !!formController.getMobile();
      }
    } catch {
      // formController indisponível: cai nos critérios abaixo.
    }

    const userAgent = (navigator.userAgent || '').toLowerCase();
    if (['fluig', 'android', 'iphone', 'ipad', 'mobile'].some((termo) => userAgent.includes(termo))) {
      return true;
    }

    return window.innerWidth <= 768;
  }

  /**
   * Abre o painel deslizante do fluig-style-guide (`FLUIGC.sidebar`).
   * Sem o script do style guide carregado, não faz nada.
   */
  abrirSidebar(opcoes: FluigSidebarOpcoes): void {
    try {
      if (typeof FLUIGC !== 'undefined' && typeof FLUIGC.sidebar === 'function') {
        FLUIGC.sidebar(opcoes);
      }
    } catch {
      // Style guide indisponível fora do Fluig.
    }
  }

  // ---------------------------------------------------------------------
  // Workflow — barra de ações do Fluig
  //
  // IMPORTANTE: isso só existe no DESKTOP. No app Fluig Mobile o botão
  // "Enviar" é parte do app nativo, fora do DOM acessível — não há
  // #send-process-button para esconder nem para clicar. Em telas pensadas
  // para mobile, não chame `enviar()`: apenas mantenha os campos atualizados
  // com `setValue`, e o Fluig lê o que estiver gravado quando o usuário
  // tocar no Enviar nativo.
  // ---------------------------------------------------------------------

  /**
   * Esconde o botão "Enviar" nativo e as opções de envio do menu suspenso.
   * Chame uma vez na inicialização da tela.
   *
   * O formulário roda dentro de um iframe: a barra de ações fica na página
   * PAI, por isso o acesso passa por `window.parent`.
   */
  ocultarEnvioNativo(): void {
    try {
      const pai = window.parent;
      if (!pai?.document) return;

      const botao = pai.document.getElementById(FluigService.ID_BOTAO_ENVIAR);
      if (botao) botao.style.display = 'none';

      // O menu suspenso repete as ações de envio; sem esconder, o usuário
      // ainda conseguiria enviar por ali, pulando as validações da tela.
      pai.document.querySelectorAll('#optionList li').forEach((item) => {
        if (/enviar/i.test(item.textContent ?? '')) {
          (item as HTMLElement).style.display = 'none';
        }
      });
    } catch {
      // Fora do Fluig, ou iframe de outra origem: nada a esconder.
    }
  }

  /**
   * Dispara o envio pelo botão nativo — o único caminho que realmente
   * movimenta o processo no Fluig.
   *
   * Reabilita o botão antes do clique, já que ele foi escondido por nós e um
   * elemento com `display:none` não recebe clique.
   *
   * @returns `false` quando o botão nativo não foi encontrado (fora do Fluig).
   */
  enviar(): boolean {
    try {
      const botao = window.parent?.document?.getElementById(FluigService.ID_BOTAO_ENVIAR);
      if (!botao) return false;

      botao.style.display = '';
      botao.style.visibility = 'visible';
      botao.style.pointerEvents = 'auto';
      botao.removeAttribute('disabled');
      botao.click();

      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------
  // Histórico — tabela filha do formulário
  // ---------------------------------------------------------------------

  /**
   * Lê as linhas da tabela filha do formulário.
   * Pula a linha-modelo vazia que o Fluig mantém no `<tbody>`.
   */
  lerHistorico(campos: FluigHistoricoCampos): FluigHistoricoLinha[] {
    const linhas: FluigHistoricoLinha[] = [];
    const tabela = document.getElementById(campos.tabela);
    if (!tabela) return linhas;

    tabela.querySelectorAll('tbody tr').forEach((tr) => {
      const valor = (classe: string) =>
        (tr.querySelector('.' + classe) as HTMLInputElement | null)?.value ?? '';

      const usuario = valor(campos.usuario);
      if (!usuario) return;

      linhas.push({
        usuario,
        data: valor(campos.data),
        atividade: valor(campos.atividade),
        observacao: valor(campos.observacao),
        acao: valor(campos.acao),
      });
    });

    return linhas;
  }

  /**
   * Traduz a matrícula para o nome da pessoa, via dataset `colleague`.
   * Sem o dataset disponível, devolve a própria matrícula — assim a tela
   * continua legível em vez de ficar vazia.
   */
  nomeUsuario(matricula: string): string {
    if (!matricula) return '';

    const emCache = this.nomesEmCache.get(matricula);
    if (emCache) return emCache;

    let nome = matricula;
    try {
      if (typeof DatasetFactory !== 'undefined') {
        const ds = DatasetFactory.getDataset(
          'colleague',
          null,
          [DatasetFactory.createConstraint('colleagueId', matricula, matricula, ConstraintType.MUST)],
          null,
        );
        if (ds?.values?.length) nome = ds.values[0].colleagueName || matricula;
      }
    } catch {
      // Dataset indisponível: segue com a matrícula mesmo.
    }

    this.nomesEmCache.set(matricula, nome);
    return nome;
  }

  /** URL da foto de perfil do usuário no Fluig. */
  fotoUsuario(matricula: string): string {
    return '/api/public/social/image/' + matricula;
  }
}
