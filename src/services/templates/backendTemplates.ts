import { backendExpress, backendFastify, backendNestjs } from './backend/nodeBackendTemplates';
import { backendFastAPI, backendDjango, backendFlask } from './backend/pythonBackendTemplates';
import { backendGo, backendRust, backendSpring, backendDotNet } from './backend/compiledBackendTemplates';

export {
  backendExpress,
  backendFastify,
  backendNestjs,
  backendFastAPI,
  backendDjango,
  backendFlask,
  backendGo,
  backendRust,
  backendSpring,
  backendDotNet,
};

export const allBackendTemplates = [
  backendExpress,
  backendFastify,
  backendNestjs,
  backendFastAPI,
  backendDjango,
  backendFlask,
  backendGo,
  backendRust,
  backendSpring,
  backendDotNet,
];
