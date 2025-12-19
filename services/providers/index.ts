// Provider initialization - import all providers to register them
// This file should be imported once at app startup

import './geminiProvider';
import './groqProvider';
import './deepseekProvider';
import './mistralProvider';
import './huggingfaceProvider';
import './openrouterProvider';

export { geminiProvider } from './geminiProvider';
export { groqProvider } from './groqProvider';
export { deepseekProvider } from './deepseekProvider';
export { mistralProvider } from './mistralProvider';
export { huggingFaceProvider } from './huggingfaceProvider';
export { openRouterProvider } from './openrouterProvider';

// Re-export registry functions
export {
    getProvider,
    getAvailableProviders,
    selectBestModel,
    generateWithBestModel,
    getAllModels,
    getModelsByProvider
} from '../modelRegistry';
