// Contratos do wizard. Genéricos de propósito: nenhum processo específico
// aparece aqui, então dá para reaproveitar em qualquer formulário Fluig.

/**
 * Etapa da barra de progresso do topo (macro-etapa do processo).
 *
 * `atividades` são os ids das atividades do diagrama BPMN que pertencem a
 * esta etapa. Um mesmo passo pode agrupar várias atividades — inclusive as
 * de retrabalho, que voltam para a mesma fase do processo.
 *
 * `visivel` é opcional: quando informado, a etapa só aparece se retornar
 * `true`. Serve para esconder etapas que não se aplicam à solicitação.
 *
 * @example
 * { nome: 'Aprovação', atividades: [6, 44] }
 * { nome: 'Diretoria', atividades: [80], visivel: () => valorAcimaDoLimite }
 */
export interface FluigWizardEtapa {
  nome: string;
  atividades: number[];
  visivel?: () => boolean;
}

/**
 * Aba do rodapé — cada uma é uma "página" do formulário.
 *
 * Diferente da etapa (que reflete onde o processo está), a aba é navegação
 * livre: o usuário troca de página sem mexer no fluxo.
 *
 * @example
 * { nome: 'Documentos', subtitulo: 'Anexos da solicitação' }
 */
export interface FluigWizardAba {
  nome: string;
  subtitulo?: string;
  visivel?: () => boolean;
}
