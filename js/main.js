// メインループ・画質設定・ゴール写真・共有・起動
'use strict';

function updHud(rdt) {
  hud.t -= rdt; if (hud.t > 0) return; hud.t = 0.1;
  updateCamTargetUI();
  const ord = R.order, lead = ord[0];
  const rh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rh')) || 30;
  ord.forEach((r, k) => {
    const el = document.getElementById('sr' + r.i); if (!el) return;
    el.style.transform = `translateY(${k * rh}px)`;
    el.children[0].textContent = k + 1;
    el.children[3].textContent = r.fin ? `${r.place}着` : k === 0 ? '先頭' : gapTxt((lead.s - r.s) / 2.4);
    const d = document.getElementById('pd' + r.i); if (d) d.style.left = clamp(raceSectionDistance(r, R) / R.D * 100, 0, 100) + '%';
  });
  const mine = R.runners[S.myBet.h];
  $('#myRank').textContent = `${mine.fin ? mine.place : ord.indexOf(mine) + 1}位`;
  $('#remain').textContent = R.continuous ? Math.floor(Math.max(0, lead.s)) : Math.max(0, Math.ceil(R.D - (lead.fin ? R.D : lead.s)));
  $('#rtime').textContent = fmtTime(R.running ? R.t : 0);
  const ch = $('#cheer'); ch.style.setProperty('--p', S.cheer.toFixed(0)); ch.classList.toggle('ready', S.cheer >= 100 && S.mode === 'race' && !mine.fin);
  ch.disabled = S.cheer < 100 || S.mode !== 'race' || mine.fin;
  ch.querySelector('small').textContent = mine.fin ? 'ゴール！' : S.cheer >= 100 && S.mode === 'race' ? '応援できる！' : `チャージ ${Math.floor(S.cheer)}%`;
  board.t -= 0.1; if (board.t <= 0) { board.t = 0.3; drawBoard(); }
}
function updRings(rdt) {
  for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += rdt; const s = 1 + r.t * 14; r.m.scale.set(s, s, s); r.m.material.opacity = Math.max(0, 1 - r.t / 0.8); if (r.t > 0.8) { scene.remove(r.m); r.m.material.dispose(); rings.splice(i, 1); } }
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.max(0, (now - last) / 1000); last = now;
  const crashActive = S.playType === 'crash' && S.crash && !S.crash.settled;
  if (crashActive && document.hidden) return;
  const rdt = crashActive ? elapsed : Math.min(0.05, elapsed);
  if (S.mode === 'catalog') { drawCatalog(rdt); return; }
  if (S.mode === 'courseCatalog') { drawCourseCatalog(rdt); return; }
  if (!crashActive) timeScale = damp(timeScale, timeTarget, 8, rdt);
  const dt = rdt * timeScale;
  if (!crashActive) { clock += dt; realClock += rdt; }
  if (!R) return;
  updRace(dt, rdt);
  if (crashActive && S.mode !== 'result') renderCrashHud();
  updHorses(dt, rdt);
  if (S.mode !== 'lobby' && S.mode !== 'result') updHud(rdt);
  else if (S.mode === 'lobby' && Math.random() < rdt * 0.4) { /* idle */ }
  updCamera(dt, rdt);
  updCrowd(realClock, rdt);
  themeUpd.forEach(f => f(realClock, rdt));
  updWeather(rdt);
  dustP.update(dt); sparkP.update(dt); fireP.update(rdt); updRings(rdt); updCoins(rdt);
  if (S.mode === 'result' && Math.random() < rdt * 0.8) firework(new V3(boardPos.x + rand(-80, 80), rand(40, 80), boardPos.z - rand(10, 90)), 110);
  FX.lines = Math.max(0, FX.lines - rdt * 0.9); FX.flash = Math.max(0, FX.flash - rdt * 1.8); FX.ab = Math.max(0, FX.ab - rdt * 0.7);
  FU.uAb.value = FX.ab * 0.012 + (timeScale < 0.6 ? 0.004 : 0); FU.uFlash.value = FX.flash; FU.uTime.value = realClock;
  FU.uSat.value = (1.16 + (timeScale < 0.6 ? 0.15 : 0)) * (wxState.sat || 1);
  if (AU.ctx && S.mode === 'race') { AU.ht = (AU.ht || 0) - rdt; if (AU.ht <= 0) { AU.ht = rand(0.05, 0.1) / Math.max(timeScale, 0.3); AU.thump(0.05 + 0.05 * Math.random()); } }
  fxDraw(rdt);
  updateCameraVisibility();
  composer.render();
}

function applyQuality() {
  courseCatalog.drone.collision = null; if (courseCatalog.drone.active) courseCatalog.drone.pendingStart = true;
  courseCatalog.width = 0; courseCatalog.height = 0;
  catalog.width = 0; catalog.height = 0;
  const q = $('#quality').value;
  const light = q === 'low' || (q === 'auto' && matchMedia('(max-width:760px)').matches);
  PR = Math.min(window.devicePixelRatio || 1, light ? 1 : 1.75);
  renderer.setPixelRatio(PR); composer.setPixelRatio(PR);
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = !light; bloom.enabled = !light;
  applyThemeQuality();
  [dustP, sparkP, fireP, amb].forEach(p => { if (p) p.mat.uniforms.scale.value = innerHeight * PR * 0.5; });
}
function captureFinishPhoto(me) {
  // Capture after the complete simulation step, before another step moves the horses.
  const width = 840, height = 360;
  const roots = horses.map(H => ({ position: H.root.position.clone(), rotation: H.root.rotation.clone(), visible: H.root.visible }));
  const posts = world.userData.finishPosts, postVisibility = posts.map(post => post.visible);
  const skyPosition = sky.position.clone(), sunPosition = sun.position.clone(), sunTarget = sun.target.position.clone();
  const previousTarget = renderer.getRenderTarget(), viewport = renderer.getViewport(new THREE.Vector4()), scissor = renderer.getScissor(new THREE.Vector4()), scissorTest = renderer.getScissorTest();
  let raw, output, pass;
  try {
    if (renderer.getContext().isContextLost()) return null;
    R.runners.forEach(r => {
      const H = horses[r.i], s = r.i === me.i ? R.D : r.s, q = track.pos(R.s0 + s, r.lane);
      H.root.position.set(q.x, q.y + r.fly * (r.flyH || 1.8) + H.hopY, q.z);
      H.root.rotation.set(0, -q.h + H.yaw + (H.drift || 0), Math.atan(track.visGrade(R.s0 + s)) * 0.8, 'YZX');
      H.root.visible = true;
    });
    const f = tp(R.s0 + R.D, me.lane), H = horses[me.i];
    const target = H.root.position.clone().add(new V3(0, 1.3 * H.scale, 0));
    const distance = Math.max(8, 10 * H.scale);
    const side = me.lane < W / 2 ? -1 : 1;
    const shotCamera = new THREE.PerspectiveCamera(32, width / height, 0.1, camera.far);
    shotCamera.position.copy(target).addScaledVector(f.n, distance * side).addScaledVector(f.dir, distance * 0.35).add(new V3(0, distance * 0.3, 0));
    shotCamera.lookAt(target);
    posts.forEach(post => { post.visible = false; });
    sky.position.copy(shotCamera.position);
    sun.position.copy(target).addScaledVector(sunDir, 160); sun.target.position.copy(target);
    raw = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType });
    output = new THREE.WebGLRenderTarget(width, height);
    pass = new THREE.ShaderPass(FinalShader);
    pass.uniforms.uExp.value = FU.uExp.value;
    pass.uniforms.uSat.value = FU.uSat.value;
    pass.uniforms.uTime.value = realClock;
    // Apply the game's colour grading without the GOAL flash or camera shake.
    renderer.setRenderTarget(raw); renderer.setScissorTest(false); renderer.clear(); renderer.render(scene, shotCamera);
    pass.render(renderer, output, raw);
    const pixels = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(output, 0, 0, width, height, pixels);
    if (renderer.getContext().isContextLost() || !pixels.some((v, i) => i % 4 === 3 && v)) return null;
    const photo = document.createElement('canvas'); photo.width = width; photo.height = height;
    const c = photo.getContext('2d'), image = c.createImageData(width, height), stride = width * 4;
    for (let y = 0; y < height; y++) image.data.set(pixels.subarray((height - 1 - y) * stride, (height - y) * stride), y * stride);
    c.putImageData(image, 0, 0);
    return photo;
  } catch (e) {
    return null;
  } finally {
    horses.forEach((H, i) => { H.root.position.copy(roots[i].position); H.root.rotation.copy(roots[i].rotation); H.root.visible = roots[i].visible; });
    posts.forEach((post, i) => { post.visible = postVisibility[i]; });
    sky.position.copy(skyPosition); sun.position.copy(sunPosition); sun.target.position.copy(sunTarget);
    renderer.setRenderTarget(previousTarget); renderer.setViewport(viewport); renderer.setScissor(scissor); renderer.setScissorTest(scissorTest);
    raw?.dispose(); output?.dispose();
    // FullScreenQuad shares its geometry with the live composer; dispose only our material.
    pass?.material.dispose();
  }
}
function setupShare(me, pay, reward) {
  const canvas = $('#shareCard'), c = canvas.getContext('2d');
  const photo = R.finishPhoto;
  canvas.height = photo ? 720 : 560;
  canvas.setAttribute('aria-label', photo ? '応援した馬のゴール写真付きレース結果カード' : 'レース結果カード');
  const url = /^https?:$/.test(location.protocol) ? location.href.split('#')[0].split('?')[0] : '';
  if (photo) {
    c.fillStyle = '#35204f'; c.fillRect(0, 0, 840, 720);
    c.drawImage(photo, 0, 0, 840, 360);
    c.fillStyle = 'rgba(26,8,48,0.85)'; c.fillRect(24, 24, 320, 48);
    c.fillStyle = '#fff5fb'; c.font = 'bold 24px sans-serif'; c.fillText(`ゴールの瞬間 ／ ${me.i + 1}番`, 40, 57);
    c.fillStyle = '#ffcf3f'; c.font = 'bold 36px sans-serif'; c.fillText('トイ競馬', 40, 418);
    c.font = 'bold 48px sans-serif'; c.textAlign = 'right'; c.fillText(`${me.place}着！`, 800, 424); c.textAlign = 'left';
    c.fillStyle = '#fff5fb'; c.font = 'bold 36px sans-serif'; c.fillText(`${me.i + 1}番 ${me.def.name}`, 40, 480, 760);
    c.font = '24px sans-serif'; c.fillText(track.def.name, 40, 526, 760);
    c.fillText(`${WX[S.wx.w]}・${GOING[S.wx.g]} ／ タイム ${fmtTime(me.finT)}`, 40, 567, 760);
    c.fillStyle = '#46f0c6'; c.fillText(`払戻 ${fmt(pay)} ／ 実績報酬 ${fmt(reward)} コイン`, 40, 614, 760);
    c.fillStyle = '#fff5fb'; c.font = '20px sans-serif'; c.fillText(url || 'かわいい馬を選んで、応援しよう！', 40, 682, 760);
  } else {
    const gradient = c.createLinearGradient(0,0,840,560); gradient.addColorStop(0,'#35204f'); gradient.addColorStop(1,'#951f63');
    c.fillStyle = gradient; c.fillRect(0,0,840,560);
    c.fillStyle = '#ffcf3f'; c.font = 'bold 42px sans-serif'; c.fillText('トイ競馬',48,70);
    c.fillStyle = '#fff5fb'; c.font = 'bold 82px sans-serif'; c.fillText(`${me.place}着！`,48,175);
    c.font = 'bold 36px sans-serif'; c.fillText(me.def.name,48,240,744);
    c.font = '26px sans-serif'; c.fillText(track.def.name,48,300,744);
    c.fillText(`${WX[S.wx.w]}・${GOING[S.wx.g]} ／ タイム ${fmtTime(me.finT)}`,48,350,744);
    c.fillStyle = '#46f0c6'; c.fillText(`払戻 ${fmt(pay)} ／ 実績報酬 ${fmt(reward)} コイン`,48,410,744);
    c.fillStyle = '#fff5fb'; c.font = '20px sans-serif'; c.fillText(url || 'かわいい馬を選んで、応援しよう！',48,510,744);
  }
  const text = `トイ競馬で${me.def.name}を応援して${me.place}着！ ${track.def.name}`;
  const blobPromise = new Promise(resolve => canvas.toBlob(resolve,'image/png'));
  $('#saveCard').onclick = async () => {
    const blob = await blobPromise; if (!blob) { $('#shareStatus').textContent = '画像を作成できませんでした。'; return; }
    const src = URL.createObjectURL(blob), a = document.createElement('a'); a.href = src; a.download = 'toy-keiba-result.png'; a.click(); setTimeout(() => URL.revokeObjectURL(src),60000);
    $('#shareStatus').textContent = '結果カードを保存しました。';
  };
  $('#shareResult').onclick = async () => {
    try {
      const blob = await blobPromise, file = blob && typeof File !== 'undefined' ? new File([blob],'toy-keiba-result.png',{type:'image/png'}) : null;
      if (navigator.share) {
        const data = {title:'トイ競馬',text,...(url ? {url} : {})};
        if (file && navigator.canShare?.({files:[file]})) data.files = [file];
        await navigator.share(data); $('#shareStatus').textContent = '共有しました。';
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text + (url ? '\n' + url : ''));
        $('#shareStatus').textContent = '共有文をコピーしました。画像も保存できます。';
      } else $('#shareStatus').textContent = text + (url ? ' ' + url : '') + '（画像を保存して共有できます）';
    } catch (e) { $('#shareStatus').textContent = e.name === 'AbortError' ? '共有をキャンセルしました。' : '共有できませんでした。画像を保存して共有できます。'; }
  };
}
$('#quality').value = ['auto','low','high'].includes(store.get('quality','auto')) ? store.get('quality','auto') : 'auto';
$('#quality').onchange = () => { store.set('quality',$('#quality').value); applyQuality(); };
applyQuality();

/* ============ BOOT ============ */
guiding = !store.get(S.playType === 'crash' ? 'crashGuideDone' : 'guideDone', false);
setMuteIcon(); setCoins();
setCam('broadcast');
enterLobby(true);
cam.pos.set(0, 140, track.extent); camera.position.copy(cam.pos);
requestAnimationFrame(frame);
setTimeout(() => { const l = $('#loading'); l.style.opacity = 0; setTimeout(() => l.remove(), 700); }, 250);
