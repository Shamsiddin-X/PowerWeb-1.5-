// types/logic.ts — Logic system types

export interface Condition {
  type: 'screenWidth' | 'formValid' | 'variableEquals' | 'elementVisible' | 'scrollPosition';
  operator?: '<' | '>' | '===' | '!==' | '<=' | '>=';
  value?: any;
  variableName?: string;
  formId?: string;
  elementId?: string;
}

export interface Action {
  type: 'showModal' | 'hideElement' | 'navigateToPage' | 'playAnimation' | 'setVariable' | 'toggleClass' | 'navigateToUrl';
  targetId?: string;
  url?: string;
  animationClass?: string;
  variableName?: string;
  value?: any;
  className?: string;
}

export interface LogicBlock {
  event?: {
    type: 'click' | 'hover' | 'submit' | 'scroll' | 'load';
  };
  condition?: Condition;
  actions: Action[];
  elseActions?: Action[];
}
