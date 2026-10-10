// 共通ユーティリティ・保存・THREEの短縮名
'use strict';

const $ = s => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
const mod = (a, n) => ((a % n) + n) % n;
const fmt = n => Math.round(n).toLocaleString('ja-JP');
const store = {
  get(k, d) { try { const v = localStorage.getItem('dopa_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('dopa_' + k, JSON.stringify(v)); } catch (e) {} }
};
THREE.ColorManagement.legacyMode = false;
const V3 = THREE.Vector3;
const C = c => new THREE.Color(c);
