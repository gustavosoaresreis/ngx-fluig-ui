// Contrato das ações de decisão. Genérico: cada processo declara as suas.

/**
 * Um botão de decisão da etapa (Aprovar, Reprovar, Enviar Solicitação...).
 *
 * @example
 * { rotulo: 'Aprovar', valor: 'aprovar', estilo: 'positivo' }
 * { rotulo: 'Reprovar', valor: 'reprovar', estilo: 'negativo', exigeObservacao: true }
 */
export interface FluigAcaoDecisao {
  /** Texto do botão. */
  rotulo: string;

  /**
   * Valor gravado no campo de decisão do formulário — é o que as condições
   * do gateway leem com `hAPI.getCardValue`. Precisa bater exatamente com o
   * que está escrito no diagrama BPMN.
   */
  valor: string;

  /** Cor do botão. Padrão: `neutro`. */
  estilo?: 'positivo' | 'negativo' | 'neutro';

  /**
   * Quando `true`, o envio é bloqueado se a observação estiver vazia.
   * Use em reprovações e devoluções, onde a justificativa é obrigatória.
   */
  exigeObservacao?: boolean;

  /** Regra opcional de exibição. Sem ela, o botão sempre aparece. */
  visivel?: () => boolean;
}
