// コース図鑑とドローン操作UI
'use strict';

const courseCatalog = { index: null, saved: null, width: 0, height: 0, target: new V3(), yaw: 0.8, pitch: 0.65, distance: 500, pan: false, time: 0,
  drone: { active: false, position: new V3(), yaw: 0, pitch: 0, speed: 40, keys: new Set(), touches: new Map(), pad: null, x: 0, z: 0, collision: null } };
function clearCourseDroneInput() {
  const d = courseCatalog.drone; d.keys.clear(); d.touches.clear(); d.pad = null; d.x = 0; d.z = 0;
  $('#courseDronePad span').style.transform = ''; ptrs.clear(); pinch0 = 0;
}
function courseDroneUI() {
  const d = courseCatalog.drone;
  $('#courseDroneControls').hidden = !d.active;
  $('#courseCatalogDrone').setAttribute('aria-pressed', String(d.active));
  $('#courseCatalogRotate').setAttribute('aria-pressed', String(!d.active && !courseCatalog.pan));
  $('#courseCatalogPan').setAttribute('aria-pressed', String(!d.active && courseCatalog.pan));
  $('#courseCatalogViewHint').textContent = d.active ? 'WASD／左パッドで移動・E/Q／▲▼で上下・ドラッグ／スワイプで見回す。地形・建物で停止' : 'ドラッグで回転・ホイール／ピンチでズーム。移動モードで平行移動';
}
function startCourseDrone() {
  const d = courseCatalog.drone; if (d.active) return;
  clearCourseDroneInput();
  d.position.copy(orbit(courseCatalog.target, courseCatalog.yaw, courseCatalog.pitch, courseCatalog.distance));
  d.yaw = courseCatalog.yaw; d.pitch = -courseCatalog.pitch;
  d.active = true; d.pendingStart = true; courseDroneUI();
  cv.focus({ preventScroll: true });
}
function updateCourseDrone(dt) {
  const d = courseCatalog.drone;
  if (!d.collision) d.collision = new DroneCollision(world);
  if (d.pendingStart) {
    d.pendingStart = false;
    if (d.collision.overlaps(d.position)) {
      const saved = { target: courseCatalog.target.clone(), yaw: courseCatalog.yaw, pitch: courseCatalog.pitch, distance: courseCatalog.distance, pan: courseCatalog.pan };
      courseCatalogReset();
      d.position.copy(orbit(courseCatalog.target, courseCatalog.yaw, courseCatalog.pitch, courseCatalog.distance));
      d.yaw = courseCatalog.yaw; d.pitch = -courseCatalog.pitch;
      // Above the entire collision world is always a valid fallback.
      if (d.collision.overlaps(d.position)) d.position.y = d.collision.tree.box.max.y + 2;
      courseCatalog.target.copy(saved.target); courseCatalog.yaw = saved.yaw; courseCatalog.pitch = saved.pitch; courseCatalog.distance = saved.distance; courseCatalog.pan = saved.pan;
      d.active = true; courseDroneUI();
    }
  }
  const key = c => Number(d.keys.has(c));
  const up = [...d.touches.values()].reduce((a, b) => a + b, 0) + key('KeyE') - key('KeyQ');
  const delta = droneDisplacement(d.yaw, d.x + key('KeyD') - key('KeyA'), d.z + key('KeyW') - key('KeyS'), clamp(up, -1, 1), d.speed, dt);
  d.position.copy(d.collision.move(d.position, delta));
  camera.position.copy(d.position);
  camera.lookAt(d.position.clone().add(new V3(-Math.cos(d.yaw) * Math.cos(d.pitch), Math.sin(d.pitch), -Math.sin(d.yaw) * Math.cos(d.pitch))));
}
function courseCatalogList() {
  const q = $('#courseCatalogSearch').value.trim().normalize('NFKC').toLocaleLowerCase('ja');
  const filter = $('#courseCatalogFilter').value;
  const matches = TRACKS.map((t, i) => ({t, i})).filter(({t}) =>
    t.name.normalize('NFKC').toLocaleLowerCase('ja').includes(q) && (filter === 'all' || trackGroupOf(t) === filter));
  $('#courseCatalogCount').textContent = `${matches.length} / ${TRACKS.length}コース`;
  $('#courseCatalogList').innerHTML = matches.length ? matches.map(({t, i}) =>
    `<button data-index="${i}" aria-pressed="${i === courseCatalog.index}">${catalogText(t.name)}<small>${SURF[t.surf]} ${t.D}m・${catalogText(t.time)}</small></button>`).join('') : '<p>該当するコースがありません。</p>';
}
function courseCatalogSelect(i) {
  const t = TRACKS[i]; if (!t) return;
  clearCourseDroneInput(); courseCatalog.drone.collision = null;
  courseCatalog.index = i;
  if (S.mode === 'courseCatalog') {
    buildWorld(i); gate.g.visible = false; drawBoard();
    // Exhibit cameras sit beyond race fog distances; keep the whole course clear.
    scene.fog = null;
    // 霧のない俯瞰では遠景の山が巨大な円盤に見えるため、図鑑では隠す
    world.traverse(o => { if (o.userData.backdrop) o.visible = false; });
    courseCatalog.width = 0; courseCatalog.height = 0;
    courseCatalogReset();
  }
  const tr = new Track(t), e = catalogText;
  let low = Infinity, high = -Infinity;
  for (const y of tr.ys) { low = Math.min(low, y / tr.ex); high = Math.max(high, y / tr.ex); }
  const group = TRACK_GROUPS.find(([g]) => g === trackGroupOf(t))[1];
  $('#courseCatalogDetails').innerHTML = `<h3>${e(t.name)}</h3><p>${e(group)}・${SURF[t.surf]} ${t.D}m</p>
    <div class="courseCatalogMap" style="--g:${t.grad}" role="img" aria-label="${e(t.name)}のコース概形。ピンクの印はゴール">${coursePreview(t)}</div>
    <p class="catalogNote">ゲーム内のコース概形です。ピンクの印はゴール。実在の競馬場の実測図ではありません。</p>
    <h4>コースデータ</h4><dl><dt>距離</dt><dd>${t.D}m</dd><dt>路面</dt><dd>${SURF[t.surf]}</dd><dt>舞台</dt><dd>${e(t.time)}</dd>
    <dt>走路</dt><dd>${tr.closed ? t.dir === 'right' ? '右回り・周回' : '左回り・周回' : '一本道（スタートとゴールが別）'}</dd>
    <dt>高低差</dt><dd>${(high - low).toFixed(1)}m（ゲーム内）</dd><dt>対応モード</dt><dd>${tr.closed ? '競馬・クラッシュ' : '競馬のみ'}</dd></dl>
    <h4>特徴・攻略のヒント</h4><p>${e(t.desc)}</p>
    ${t.motif ? `<h4>モチーフ</h4><p>${e(t.motif)}</p>${t.motifNote ? `<p>${e(t.motifNote)}</p>` : ''}` : ''}
    <h4>専用区間</h4>${t.stationRecovery ? `<p>主要駅の通過で最大スタミナの30％を回復します。開始地点とゴール後には発動しません。</p><p>${tr.stations.filter(s => s.major).map(s => e(s.name)).join('・')}</p>` : tr.zones.length ? `<ul>${tr.zones.map(z => `<li><b>${e(z.name)}</b>：${courseCatalogZoneText(z)}</li>`).join('')}</ul>` : '<p>専用区間なし。距離・路面・カーブ・坂を活かして走ります。</p>'}
    <p class="catalogNote">形状・距離・高低差はゲーム向けのアレンジです。坂の見た目は強調されています。</p>`;
  $('#courseCatalogDetails').scrollTop = 0;
  courseCatalogList();
}
function courseCatalogZoneText(z) {
  const effects = [];
  if (z.speed > 1) effects.push('加速');
  if (z.speed < 1) effects.push('減速');
  if (z.drain < 0) effects.push('スタミナ消耗軽減');
  if (z.drain > 0) effects.push('スタミナ消耗増加');
  if (z.recover > 0) effects.push('スタミナ回復');
  if (z.power) effects.push('パワーで速度が変化');
  if (z.agility) effects.push('器用さで速度が変化');
  return effects.join('・');
}
function courseCatalogReset() {
  clearCourseDroneInput(); courseCatalog.drone.active = false; courseCatalog.drone.pendingStart = false; courseCatalog.pan = false; courseDroneUI();
  const view = $('#courseCatalogView'), aspect = Math.max(0.3, view.clientWidth / Math.max(1, view.clientHeight));
  let low = Infinity, high = -Infinity;
  for (const y of track.ys) { low = Math.min(low, y); high = Math.max(high, y); }
  courseCatalog.target.set(0, (low + high) / 2, 0);
  courseCatalog.yaw = track.def.theme === 'monaco' ? 0 : 0.8; courseCatalog.pitch = 0.65;
  const cy = Math.cos(courseCatalog.yaw), sy = Math.sin(courseCatalog.yaw);
  const cp = Math.cos(courseCatalog.pitch), sp = Math.sin(courseCatalog.pitch);
  const tanV = Math.tan(Math.PI / 8), tanH = tanV * aspect, padding = W + 10;
  let distance = 20;
  const fit = (x, y, z) => {
    y -= courseCatalog.target.y;
    const along = cy * x + sy * z, depth = cp * along + sp * y;
    distance = Math.max(distance, depth + (Math.abs(sy * x - cy * z) + padding) / tanH,
      depth + (Math.abs(cp * y - sp * along) + padding) / tanV);
  };
  // Fit the actual course in camera space instead of a sphere around its longest side.
  for (let i = 0; i <= track.N; i++) {
    fit(track.xs[i], track.ys[i], track.zs[i]);
  }
  world.updateMatrixWorld(true);
  for (const g of world.userData.landmarks || []) {
    const box = new THREE.Box3().setFromObject(g);
    if (box.isEmpty()) continue;  // 中身のないグループは境界が無限大になり、距離がNaNになる
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) fit(x, y, z);
  }
  courseCatalog.maxDistance = Math.max(1800, distance * 1.1);
  courseCatalog.distance = distance * 1.1;
}
function courseCatalogMove(dx, dy) {
  const scale = 2 * courseCatalog.distance * Math.tan(Math.PI / 8) / Math.max(1, $('#courseCatalogView').clientHeight);
  const right = new V3(1, 0, 0).applyQuaternion(camera.quaternion), up = new V3(0, 1, 0).applyQuaternion(camera.quaternion);
  courseCatalog.target.addScaledVector(right, -dx * scale).addScaledVector(up, dy * scale);
  const limit = track.extent * 2;
  courseCatalog.target.x = clamp(courseCatalog.target.x, -limit, limit);
  courseCatalog.target.z = clamp(courseCatalog.target.z, -limit, limit);
  courseCatalog.target.y = clamp(courseCatalog.target.y, -50, limit);
}
function drawCourseCatalog(rdt) {
  const view = $('#courseCatalogView'), w = view.clientWidth, h = view.clientHeight;
  if (!w || !h) return;
  if (courseCatalog.width !== w || courseCatalog.height !== h) {
    renderer.setSize(w, h); composer.setSize(w, h);
    camera.aspect = w / h; camera.fov = 45; camera.updateProjectionMatrix();
    courseCatalog.width = w; courseCatalog.height = h;
  }
  courseCatalog.time += rdt;
  themeUpd.forEach(f => f(courseCatalog.time, rdt));
  const drone = courseCatalog.drone;
  if (drone.active) updateCourseDrone(rdt);
  else { camera.position.copy(orbit(courseCatalog.target, courseCatalog.yaw, courseCatalog.pitch, courseCatalog.distance)); camera.lookAt(courseCatalog.target); }
  const far = Math.max(courseCatalog.saved.far, camera.position.length() + track.extent * 4);
  // A race-sized near plane loses depth precision in the distant exhibit view.
  const near = drone.active ? 0.1 : clamp(courseCatalog.distance * 0.01, 0.1, 10);
  if (camera.near !== near || camera.far !== far) { camera.near = near; camera.far = far; camera.updateProjectionMatrix(); }
  sky.position.copy(camera.position);
  const lightTarget = drone.active ? drone.position : courseCatalog.target;
  sun.position.copy(lightTarget).addScaledVector(sunDir, 160); sun.target.position.copy(lightTarget);
  if (amb) amb.mat.uniforms.scale.value = h * PR * 0.5;
  FU.uAb.value = 0; FU.uFlash.value = 0; FU.uTime.value = courseCatalog.time; FU.uSat.value = 1.16;
  composer.render();
}
function openCourseCatalog() {
  if (S.mode !== 'lobby') return;
  courseCatalog.drone.speed = 40; $('#courseDroneSpeed').value = '40';
  VO.stop(); AU.crowdLvl(0);
  AU.rainLvl(0); ptrs.clear(); pinch0 = 0;
  // Preserve the lobby world and race while the builder creates exhibit worlds.
  courseCatalog.saved = { world, track, sun, sunDir, sky, amb, board, gate, crowd, themeUpd, themeFinish, themeReset, themeDetails, WR,
    boardPos: boardPos.clone(), fog: scene.fog, position: camera.position.clone(), quaternion: camera.quaternion.clone(), fov: camera.fov, near: camera.near, far: camera.far,
    uniforms: Object.fromEntries(Object.entries(FU).map(([k, u]) => [k, u.value])),
    bloom: [bloom.strength, bloom.radius, bloom.threshold], objects: scene.children.filter(o => o !== world).map(o => [o, o.visible]) };
  scene.remove(world); world = null; amb = null;
  courseCatalog.saved.objects.forEach(([o]) => { o.visible = false; });
  setMode('courseCatalog'); $('#courseCatalog').hidden = false;
  $('#top').hidden = true; $('#fx').hidden = true;
  $('#courseCatalogSearch').value = ''; $('#courseCatalogFilter').value = 'all';
  $('#courseCatalogView').prepend(cv);
  courseCatalogSelect(S.ti); $('#courseCatalogClose').focus();
}
function closeCourseCatalog() {
  if (S.mode !== 'courseCatalog') return;
  clearCourseDroneInput(); courseCatalog.drone.active = false; courseCatalog.drone.collision = null; courseCatalog.drone.pendingStart = false; courseDroneUI();
  ptrs.clear(); pinch0 = 0;
  disposeWorld();
  const saved = courseCatalog.saved;
  ({ world, track, sun, sunDir, sky, amb, board, gate, crowd, themeUpd, themeFinish, themeReset, themeDetails, WR } = saved);
  boardPos.copy(saved.boardPos); scene.fog = saved.fog; scene.add(world);
  saved.objects.forEach(([o, visible]) => { o.visible = visible; });
  Object.entries(saved.uniforms).forEach(([k, value]) => { FU[k].value = value; });
  [bloom.strength, bloom.radius, bloom.threshold] = saved.bloom;
  camera.position.copy(saved.position); camera.quaternion.copy(saved.quaternion); camera.fov = saved.fov; camera.near = saved.near; camera.far = saved.far;
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  stage.appendChild(cv); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  if (amb) amb.mat.uniforms.scale.value = innerHeight * PR * 0.5;
  courseCatalog.saved = null;
  AU.rainLvl(wxState.rainN ? (wxState.rainN > 1000 ? 0.09 : 0.045) : 0);
  $('#courseCatalog').hidden = true; $('#top').hidden = false; $('#fx').hidden = false;
  setMode('lobby'); AU.crowdLvl(0.12); $('#courseCatalogOpen').focus();
}
$('#courseCatalogOpen').onclick = openCourseCatalog; $('#courseCatalogClose').onclick = closeCourseCatalog;
$('#courseCatalogReset').onclick = courseCatalogReset;
function courseCatalogPanMode(pan) {
  clearCourseDroneInput(); courseCatalog.drone.active = false; courseCatalog.drone.pendingStart = false;
  courseCatalog.pan = pan;
  courseDroneUI();
}
$('#courseCatalogRotate').onclick = () => courseCatalogPanMode(false);
$('#courseCatalogPan').onclick = () => courseCatalogPanMode(true);
$('#courseCatalogDrone').onclick = startCourseDrone;
$('#courseDroneSpeed').onchange = e => { courseCatalog.drone.speed = +e.target.value; };
const courseDroneCodes = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyQ']);
function courseDroneKey(e) {
  if (!courseCatalog.drone.active || !courseDroneCodes.has(e.code) || e.ctrlKey || e.metaKey || e.altKey || e.isComposing || e.target.closest?.('input, textarea, select') || e.target.isContentEditable) return;
  e.preventDefault(); courseCatalog.drone.keys.add(e.code);
}
addEventListener('keyup', e => { courseCatalog.drone.keys.delete(e.code); });
addEventListener('blur', clearCourseDroneInput);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearCourseDroneInput(); });
$('#courseCatalog').addEventListener('focusin', e => { if (e.target.closest('input, textarea, select') || e.target.isContentEditable) clearCourseDroneInput(); });
const dronePad = $('#courseDronePad');
function moveDronePad(e) {
  const d = courseCatalog.drone; if (d.pad !== e.pointerId) return;
  const r = dronePad.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / 34, y = (e.clientY - r.top - r.height / 2) / 34;
  const size = Math.max(1, Math.hypot(x, y)); d.x = x / size; d.z = -y / size;
  $('#courseDronePad span').style.transform = `translate(${d.x * 30}px, ${-d.z * 30}px)`;
}
dronePad.addEventListener('pointerdown', e => {
  const d = courseCatalog.drone; if (!d.active || d.pad !== null) return;
  e.preventDefault(); d.pad = e.pointerId; dronePad.setPointerCapture(e.pointerId); moveDronePad(e);
});
dronePad.addEventListener('pointermove', moveDronePad);
function endDronePad(e) {
  const d = courseCatalog.drone; if (d.pad !== e.pointerId) return;
  d.pad = null; d.x = 0; d.z = 0; $('#courseDronePad span').style.transform = '';
}
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) dronePad.addEventListener(event, endDronePad);
$('#courseDroneHeight').querySelectorAll('button').forEach(b => {
  b.addEventListener('pointerdown', e => {
    if (!courseCatalog.drone.active) return;
    e.preventDefault(); b.setPointerCapture(e.pointerId); courseCatalog.drone.touches.set(e.pointerId, +b.dataset.droneHeight);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(event, e => { courseCatalog.drone.touches.delete(e.pointerId); });
});
$('#courseCatalogSearch').oninput = courseCatalogList; $('#courseCatalogFilter').onchange = courseCatalogList;
$('#courseCatalogList').onclick = e => {
  const b = e.target.closest('button[data-index]'); if (!b) return;
  courseCatalogSelect(+b.dataset.index);
  $('#courseCatalogList').querySelector(`button[data-index="${courseCatalog.index}"]`)?.focus();
};
$('#courseCatalog').addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.preventDefault(); closeCourseCatalog(); }
  else courseDroneKey(e);
  e.stopPropagation();
});
