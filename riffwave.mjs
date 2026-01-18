// ESM wrapper for riffwave.js
// This file provides ES module exports while maintaining backwards compatibility
// with CommonJS consumers who use the original .js file.

// Import the UMD module - bundlers like Vite/esbuild will convert the
// module.exports to a default export
import RIFFWAVE from './riffwave.js';

export { RIFFWAVE };
export default RIFFWAVE;
