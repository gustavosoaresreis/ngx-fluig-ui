// Contratos do histórico de movimentações. Genéricos: nenhum processo
// específico aparece aqui.

/**
 * Uma movimentação do processo, lida da tabela filha que o Fluig mantém no
 * formulário (normalmente alimentada no `beforeTaskSave` via
 * `hAPI.addCardChild`).
 */
export interface FluigHistoricoLinha {
  /** Matrícula de quem movimentou (colleagueId). */
  usuario: string;
  /** Data crua, no formato que o Fluig grava: `yyyy-MM-dd HH:mm:ss`. */
  data: string;
  /** Nome da etapa de onde a solicitação saiu. */
  atividade: string;
  /** Observação/justificativa digitada por quem movimentou. */
  observacao: string;
  /** Ação registrada (ex: "Aprovar", "Reprovar", "Enviar"). */
  acao: string;
  /** Etapa de destino, quando a tela conseguir deduzi-la. */
  proximaAtividade?: string;
}

/**
 * Nomes dos elementos no HTML do formulário. Só precisa mexer se o seu
 * processo batizou a tabela ou as colunas de outro jeito.
 */
export interface FluigHistoricoCampos {
  /** id da `<table>` que guarda as linhas. */
  tabela: string;
  /** classe do input com a matrícula. */
  usuario: string;
  /** classe do input com a data. */
  data: string;
  /** classe do input com o nome da etapa. */
  atividade: string;
  /** classe do input com a observação. */
  observacao: string;
  /** classe do input com a ação. */
  acao: string;
}

/** Convenção sugerida de nomes — sobrescreva se o seu form usar outros. */
export const FLUIG_HISTORICO_CAMPOS_PADRAO: FluigHistoricoCampos = {
  tabela: 'tableHistorico',
  usuario: 'tableHistoricoUsuario',
  data: 'tableHistoricoData',
  atividade: 'tableHistoricoAtividade',
  observacao: 'tableHistoricoObservacao',
  acao: 'tableHistoricoAcao',
};
