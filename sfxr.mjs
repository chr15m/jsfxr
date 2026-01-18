// ESM wrapper for sfxr.js (jsfxr)
// This file provides ES module exports while maintaining backwards compatibility
// with CommonJS consumers who use the original .js file.

// IMPORTANT: Import riffwave first and set up global BEFORE sfxr.js loads
// sfxr.js's SoundEffect.generate() expects RIFFWAVE to be a global
import RIFFWAVE from './riffwave.js';
if (typeof globalThis !== 'undefined') globalThis.RIFFWAVE = RIFFWAVE;
if (typeof window !== 'undefined') window.RIFFWAVE = RIFFWAVE;

// Now import sfxr.js - it can now find RIFFWAVE in the global scope
import jsfxr from './sfxr.js';

// Extract the sfxr API for convenience
const sfxr = jsfxr.sfxr;

export { jsfxr, sfxr };
export default jsfxr;
