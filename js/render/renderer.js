// WebGLレンダラー・シーン・ポストエフェクト
'use strict';

const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
let PR = Math.min(window.devicePixelRatio || 1, 1.75);
renderer.setPixelRatio(PR);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.LinearEncoding;
renderer.toneMapping = THREE.NoToneMapping;
stage.appendChild(renderer.domElement);
const MAXANI = Math.min(8, renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 2600);
camera.position.set(0, 60, 180);

if (THREE.RoomEnvironment) {
  try { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture; } catch (e) {}
}

const rt = new THREE.WebGLRenderTarget(innerWidth * PR, innerHeight * PR, { type: THREE.HalfFloatType });
rt.samples = 4;
const composer = new THREE.EffectComposer(renderer, rt);
composer.setPixelRatio(PR);
composer.setSize(innerWidth, innerHeight);
composer.addPass(new THREE.RenderPass(scene, camera));
const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.8, 0.55, 1.0);
composer.addPass(bloom);
const FinalShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.19 }, uAb: { value: 0 }, uFlash: { value: 0 }, uExp: { value: 1 }, uSat: { value: 1.16 }, uHeat: { value: 0 } },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: [
    'uniform sampler2D tDiffuse;uniform float uTime,uVig,uAb,uFlash,uExp,uSat,uHeat;varying vec2 vUv;',
    'vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
    'void main(){vec2 uv=vUv;',
    ' uv.x+=sin(uv.y*90.0+uTime*7.0)*uHeat*smoothstep(0.5,0.0,uv.y);',
    ' vec2 d=uv-0.5;float r2=dot(d,d);vec3 c;',
    ' if(uAb>0.0){vec2 o=d*uAb*(0.4+r2*5.0);c=vec3(texture2D(tDiffuse,uv+o).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-o).b);}else{c=texture2D(tDiffuse,uv).rgb;}',
    ' c=aces(c*uExp);float l=dot(c,vec3(0.2126,0.7152,0.0722));c=mix(vec3(l),c,uSat);',
    ' c=pow(max(c,0.0),vec3(1.0/2.2));',
    ' c*=1.0-uVig*smoothstep(0.1,0.8,r2*1.9);',
    ' c+=(hash(uv*1000.0+fract(uTime))-0.5)*0.006;',
    ' c=mix(c,vec3(1.0),uFlash);',
    ' gl_FragColor=vec4(c,1.0);}'
  ].join('\n')
};
const finalPass = new THREE.ShaderPass(FinalShader);
composer.addPass(finalPass);
const FU = finalPass.uniforms;
