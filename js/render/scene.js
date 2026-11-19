/** Renderer, Kamera, Bloom und Qualitätsstufen. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

export function pickQuality() {
  const q = new URLSearchParams(location.search).get('q');
  if (q === 'low' || q === 'medium' || q === 'high') return q;
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const small = Math.min(screen.width, screen.height) < 760;
  if (mem <= 2 || cores <= 2) return 'low';
  if (small || mem <= 4 || cores <= 4) return 'medium';
  return 'high';
}

export const FOV = 50;

export function createScene(canvas, quality) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== 'low', powerPreference: 'high-performance' });
  const maxPr = quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPr));
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 2e6);

  let composer = null, bloom = null;
  if (quality !== 'low') {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.55, 0.12);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  let W = 1, H = 1, useBloom = !!composer;
  function resize(w, h) {
    W = w; H = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
  }

  /**
   * Qualitätsstufe zur Laufzeit (automatische Anpassung bei langsamen Geräten):
   * 0 = voll, 1 = Auflösung 1×, 2 = zusätzlich ohne Glow, 3 = Auflösung 0,75×.
   */
  function setLevel(level) {
    const dpr = window.devicePixelRatio || 1;
    const pr = level >= 3 ? 0.75 : level >= 1 ? 1 : Math.min(dpr, maxPr);
    renderer.setPixelRatio(Math.min(dpr, pr));
    useBloom = !!composer && level < 2;
    resize(W, H);
  }

  const render = () => (useBloom ? composer.render() : renderer.render(scene, camera));
  return { renderer, scene, camera, composer, bloom, resize, render, quality, setLevel };
}
