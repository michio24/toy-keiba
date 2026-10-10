// 馬図鑑
'use strict';

/* ============ FLOW ============ */
/* Catalog owns only its preview; the race and its camera remain untouched. */
const catalog = { index: null, horse: null, scene: null, camera: null, motion: 'idle', sparks: null, sparkAcc: 0,
  yaw: 0.8, pitch: 0.3, zoom: 1, radius: 3, target: new V3(), time: 0, width: 0, height: 0 };
const catalogText = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function catalogList() {
  const q = $('#catalogSearch').value.trim().normalize('NFKC').toLocaleLowerCase('ja');
  const filter = $('#catalogFilter').value;
  const matches = ROSTER.map((h, i) => ({h, i})).filter(({h}) =>
    h.name.normalize('NFKC').toLocaleLowerCase('ja').includes(q) && (filter === 'all' || (filter === 'motif' ? h.motif : filter === 'history' ? h.tags?.includes('歴史') : !h.motif && !h.tags?.includes('歴史'))));
  matches.sort((a, b) => a.h.name.localeCompare(b.h.name, 'ja'));
  $('#catalogCount').textContent = `${matches.length} / ${ROSTER.length}頭`;
  $('#catalogList').innerHTML = matches.length ? matches.map(({h, i}) =>
    `<button data-index="${i}" aria-pressed="${i === catalog.index}">${h.tags?.includes('歴史') ? '<i class="meiba history">歴史</i>' : h.motif ? '<i class="meiba">名馬</i>' : ''}${catalogText(h.name)}<small>${catalogText(h.type)}</small></button>`).join('') : '<p>該当する馬がいません。</p>';
}
function catalogReset() { catalog.yaw = 0.8; catalog.pitch = 0.3; catalog.zoom = 1; }
function catalogSelect(i) {
  const h = ROSTER[i]; if (!h) return;
  if (catalog.horse) disposeHorse(catalog.horse);
  catalog.index = i; catalog.horse = buildHorse(h, 0); catalog.scene.add(catalog.horse.root);
  catalog.horse.root.position.y = 0.2;
  const box = new THREE.Box3().setFromObject(catalog.horse.root);
  box.getCenter(catalog.target);
  // Reserve room for moving wings, tails, and the carousel's bobbing motion.
  catalog.radius = box.getSize(new V3()).length() * 0.65 + 0.5;
  catalogReset();
  const e = catalogText, labs = [['spd','スピード'],['sta','スタミナ'],['acc','加速'],['pow','根性'],['agi','器用さ']];
  $('#catalogDetails').innerHTML = `<h3>${h.tags?.includes('歴史') ? '<i class="meiba history">歴史</i>' : h.motif ? '<i class="meiba">名馬</i>' : ''}${e(h.name)}</h3><p>${e(h.type)}・${STYLE[h.style]}</p><p>${e(h.blurb)}</p>
    ${h.gait ? `<h4>走り方</h4><p>${e(h.gait.note)}</p><p class="catalogNote">研究資料を参考にしたゲーム用の表現です。実馬の動きの厳密な再現ではありません。「走る」で確認できます。</p>` : ''}
    <h4>プロフィール</h4><p class="catalogNote">このゲームのキャラクターとしての創作設定です。</p>
    <dl><dt>性格</dt><dd>${e(h.profile.personality)}</dd><dt>好きなもの</dt><dd>${e(h.profile.favorite)}</dd></dl>
    <h4>能力</h4><p class="catalogNote">ゲーム内の能力値（最大10）です。</p>
    ${labs.map(([k,l]) => `<div class="catalogStat"><span>${l}</span><meter min="0" max="10" value="${h.st[k]}" aria-label="${l}">${h.st[k]}</meter><b>${h.st[k]}</b></div>`).join('')}
    <h4>適性</h4><p>${Object.keys(SURF).map(s => `${SURF[s]} ${AFFM[affinityOf(h, s)]}`).join(' ／ ')}<br>道悪 ${AFFM[mudOf(h)]}</p>
    <p class="catalogNote">✕ 苦手 ／ △ やや苦手 ／ − 標準 ／ ○ 得意 ／ ◎ とても得意</p>
    <h4>スキル「${e(h.skill.name)}」</h4><p>${e(h.skill.desc)}</p>
    ${h.motif ? `<h4>名馬モチーフ</h4><p>${e(h.motifNote)}</p>` : ''}`;
  $('#catalogDetails').scrollTop = 0;
  catalogMotion(catalog.motion);
  catalogList();
}
function openCatalog() {
  if (S.mode !== 'lobby') return;
  if (!catalog.scene) {
    catalog.scene = new THREE.Scene(); catalog.scene.background = C('#eee5fa'); catalog.scene.environment = scene.environment;
    catalog.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    catalog.scene.add(new THREE.HemisphereLight('#ffffff', '#a08bb8', 1.5));
    const light = new THREE.DirectionalLight('#fff6ea', 2); light.position.set(4, 8, 5); catalog.scene.add(light);
    const fill = new THREE.DirectionalLight('#cbdfff', 1); fill.position.set(-4, 3, -4); catalog.scene.add(fill);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.7, 0.2, 64), new THREE.MeshStandardMaterial({color:'#cdb4e5',roughness:0.6}));
    pedestal.position.y = 0.1; catalog.scene.add(pedestal);
    catalog.sparks = new Particles(200, TEX_STAR, true); catalog.scene.add(catalog.sparks.points);
  }
  VO.stop(); AU.crowdLvl(0);
  ptrs.clear(); pinch0 = 0;
  setMode('catalog'); $('#catalog').hidden = false;
  $('#top').hidden = true; $('#fx').hidden = true;
  $('#catalogView').prepend(cv);
  catalog.width = 0; catalog.height = 0;
  catalogSelect(catalog.index === null ? ROSTER.indexOf(HORSES[S.sel]) : catalog.index);
  $('#catalogClose').focus();
}
function closeCatalog() {
  if (S.mode !== 'catalog') return;
  ptrs.clear(); pinch0 = 0;
  if (catalog.horse) { disposeHorse(catalog.horse); catalog.horse = null; }
  stage.appendChild(cv); renderer.setSize(innerWidth, innerHeight);
  $('#catalog').hidden = true; $('#top').hidden = false; $('#fx').hidden = false;
  setMode('lobby'); AU.crowdLvl(0.12); $('#catalogOpen').focus();
}
function drawCatalog(rdt) {
  const view = $('#catalogView'), w = view.clientWidth, h = view.clientHeight;
  if (!w || !h) return;
  if (w !== catalog.width || h !== catalog.height) {
    renderer.setSize(w, h); catalog.camera.aspect = w / h; catalog.camera.updateProjectionMatrix();
    catalog.width = w; catalog.height = h;
  }
  const H = catalog.horse, active = catalog.motion === 'skill';
  catalog.time += rdt;
  if (active) H.glow = 1.2;
  animHorse(H, catalog.motion === 'idle' ? 0 : active ? 22 : 14, rdt, catalog.time, active);
  const lift = active && ['pegasus', 'deep', 'hopping', 'balloon'].includes(H.def.sk) ? (H.def.sk === 'deep' ? 0.7 : 1.8) : 0;
  H.root.position.y = damp(H.root.position.y, 0.2 + lift + H.hopY, 6, rdt);
  H.root.rotation.y = damp(H.root.rotation.y, active && ['drift', 'maroon'].includes(H.def.sk) ? -0.5 : 0, 7, rdt);
  if (active) {
    const col = C(H.def.skill.color).multiplyScalar(3);
    catalog.sparkAcc += rdt * 50;
    while (catalog.sparkAcc >= 1) {
      catalog.sparkAcc--;
      catalog.sparks.emit(rand(-0.6, 0.6), H.root.position.y + rand(0.5, 2), rand(-0.6, 0.6), -4 + rand(-1, 1), rand(0, 2), rand(-1, 1), rand(0.4, 0.8), rand(0.5, 1.1), col, -1, 1);
    }
  }
  catalog.sparks.mat.uniforms.scale.value = h * renderer.getPixelRatio() * 0.5;
  catalog.sparks.update(rdt);
  const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(20)) * Math.min(1, w / h));
  const dist = catalog.radius / Math.sin(half) * catalog.zoom;
  catalog.camera.position.copy(catalog.target).add(new V3(Math.sin(catalog.yaw) * Math.cos(catalog.pitch), Math.sin(catalog.pitch), Math.cos(catalog.yaw) * Math.cos(catalog.pitch)).multiplyScalar(dist));
  catalog.camera.lookAt(catalog.target); renderer.render(catalog.scene, catalog.camera);
}
$('#catalogOpen').onclick = openCatalog; $('#catalogClose').onclick = closeCatalog;
$('#catalogSearch').oninput = catalogList; $('#catalogFilter').onchange = catalogList;
$('#catalogList').onclick = e => {
  const b = e.target.closest('button[data-index]'); if (!b) return;
  catalogSelect(+b.dataset.index);
  $('#catalogList').querySelector(`button[data-index="${catalog.index}"]`)?.focus();
};
function catalogMotion(motion) {
  catalog.motion = motion; catalog.sparkAcc = 0;
  if (catalog.sparks) { catalog.sparks.clear(); catalog.sparks.update(0); }
  if (catalog.horse) catalog.horse.glow = 0;
  for (const [id, value] of [['catalogIdle', 'idle'], ['catalogRun', 'run'], ['catalogSkill', 'skill']]) {
    $('#' + id).setAttribute('aria-pressed', String(motion === value));
  }
  $('#catalogViewHint').textContent = motion === 'skill' && catalog.horse
    ? `スキル「${catalog.horse.def.skill.name}」発動中（演出プレビュー）`
    : 'ドラッグで回転・ホイール／ピンチでズーム';
}
$('#catalogIdle').onclick = () => catalogMotion('idle'); $('#catalogRun').onclick = () => catalogMotion('run');
$('#catalogSkill').onclick = () => catalogMotion('skill');
$('#catalogReset').onclick = catalogReset;
$('#catalog').addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.preventDefault(); closeCatalog(); }
  e.stopPropagation();
});
// Drone collision uses a two-level BVH: shared local geometry, then world instances.
