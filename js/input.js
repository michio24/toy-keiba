// キーボード・ポインター入力
'use strict';

/* ============ INPUT ============ */
addEventListener('keydown', e => {
  if (S.mode === 'courseCatalog') { if (e.key === 'Escape') { e.preventDefault(); closeCourseCatalog(); } return; }
  if (S.mode === 'catalog') { if (e.key === 'Escape') { e.preventDefault(); closeCatalog(); } return; }
  if (e.target.closest?.('input, textarea, select, #stand button') || e.target.isContentEditable) return;
  if (e.repeat && e.code !== 'Space') return;
  if (e.key === 'Enter' && S.playType === 'crash' && S.mode === 'race') { e.preventDefault(); cashOutCrash(); return; }
  const race = S.mode === 'race' || S.mode === 'finish' || S.mode === 'countdown' || S.mode === 'intro';
  if (race && e.key >= '1' && e.key <= '6') { setCam(CAMS[+e.key - 1][0]); }
  else if (race && (e.key === 'c' || e.key === 'C')) { const i = CAMS.findIndex(c => c[0] === S.cam); setCam(CAMS[(i + 1) % CAMS.length][0]); }
  else if (e.code === 'Space' && S.mode === 'race') { e.preventDefault(); useCheer(); }
  else if (e.key === 'm' || e.key === 'M') $('#mute').click();
});
$('#cheer').addEventListener('click', useCheer);
function useCheer() {
  if (S.mode !== 'race' || S.cheer < 100) return;
  const r = R.runners[S.myBet.h]; if (r.fin) return;
  raceCheers++;
  if (guiding) $('#guideNote').textContent = S.playType === 'crash' ? '応援成功！クラッシュ前に確定しよう。' : '応援成功！ゴールまで見届けよう。';
  S.cheer = 0; r.fx.push({ mult: 1.06, t: 3, cheer: true });
  AU.pop(); AU.whoosh(); FX.lines = 1; FX.ab = 0.6; horses[r.i].glow = 1; crowd.userData.exc = 1;
  const q = track.pos(R.s0 + r.s, r.lane); ringBurst(new V3(q.x, q.y + 1, q.z), '#ffcf3f');
  toast(`<b>応援ブースト！</b> ${r.def.name}の脚に力がみなぎる`, '#ffcf3f');
}
const cv = renderer.domElement, ptrs = new Map(); let pinch0 = 0;
cv.tabIndex = 0;
cv.addEventListener('pointerdown', e => { if (S.mode === 'courseCatalog' && courseCatalog.drone.active) cv.focus({ preventScroll: true }); cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); } });
cv.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (S.mode === 'courseCatalog') {
    const d = courseCatalog.drone;
    if (d.active) {
      if (e.pointerId === ptrs.keys().next().value) { d.yaw += dx * 0.006; d.pitch = clamp(d.pitch - dy * 0.004, -Math.PI * 89 / 180, Math.PI * 89 / 180); }
      return;
    }
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch0 && d > 0) courseCatalog.distance = clamp(courseCatalog.distance * pinch0 / d, 4, courseCatalog.maxDistance);
      pinch0 = d; courseCatalogMove(dx / 2, dy / 2);
    } else if (courseCatalog.pan || e.shiftKey || (e.buttons & 2)) courseCatalogMove(dx, dy);
    else { courseCatalog.yaw += dx * 0.006; courseCatalog.pitch = clamp(courseCatalog.pitch + dy * 0.004, 0.02, 1.5); }
    return;
  }
  if (S.mode === 'catalog') {
    if (ptrs.size === 2) {
      const [a,b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch0 && d > 0) catalog.zoom = clamp(catalog.zoom * pinch0 / d, 0.65, 2.5);
      pinch0 = d;
    } else { catalog.yaw += dx * 0.006; catalog.pitch = clamp(catalog.pitch + dy * 0.004, 0.05, 1.2); }
    return;
  }
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0) cam.dist = clamp(cam.dist * pinch0 / d, 4, 140); pinch0 = d; return; }
  if (Math.abs(dx) + Math.abs(dy) < 1) return;
  if ((S.mode === 'race' || S.mode === 'finish') && S.cam !== 'free') setCam('free');
  cam.yaw += dx * 0.006; cam.pitch = clamp(cam.pitch + dy * 0.004, 0.04, 1.45); cam.drag = realClock;
});
const endPtr = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = 0; };
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('lostpointercapture', endPtr);
cv.addEventListener('contextmenu', e => { if (S.mode === 'courseCatalog') e.preventDefault(); });
cv.addEventListener('wheel', e => { e.preventDefault(); if (S.mode === 'courseCatalog') { if (!courseCatalog.drone.active) courseCatalog.distance = clamp(courseCatalog.distance * Math.exp(e.deltaY * 0.0012), 4, courseCatalog.maxDistance); return; } if (S.mode === 'catalog') { catalog.zoom = clamp(catalog.zoom * Math.exp(e.deltaY * 0.0012), 0.65, 2.5); return; } if ((S.mode === 'race' || S.mode === 'finish') && S.cam !== 'free') setCam('free'); cam.dist = clamp(cam.dist * (1 + e.deltaY * 0.0012), 4, 140); cam.drag = realClock; }, { passive: false });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  applyQuality();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); fxResize();
  [dustP, sparkP, fireP, amb].forEach(p => { if (p) p.mat.uniforms.scale.value = innerHeight * PR * 0.5; });
});
