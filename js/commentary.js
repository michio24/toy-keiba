// 実況の台詞と選択
'use strict';

// Calls are selected by race facts; historical excerpts are credited in docs/references.md.
const CALLS = {
  intro: ['{T}、天候{WX}、馬場は{GOING}。本命は{F}！'],
  monaco: ['ここはモナコモンテカルロ、絶対に抜けない'],
  start: ['ゲートが開きました！各馬そろってスタート！', 'さあ発走！まずは先行争い、どの馬が行くか！', 'スタートしました！各馬、最初のポジションを取りに行きます！', 'あなたの、そして私の夢が走っています。さあ、スタート！'],
  hana: ['先手を取ったのは{L}！{B}が続きます。', '{L}がハナに立ちました。2番手は{B}！', '序盤の先頭は{L}。後続を引っ張ります！'],
  change: ['{L}が先頭に替わった！{B}は2番手！', 'ここで{L}が前に出る！先頭が入れ替わりました！', '{B}をかわして{L}、先頭です！', '先頭争いに動き！{L}が一歩リード！'],
  half: ['距離の半分を通過。{L}、{B}の順です。', 'レースは後半へ。先頭{L}、2番手{B}！', 'ここまで先頭は{L}。後半の攻防に入ります！'],
  straightSolo: ['最後の直線！{L}が{G}馬身ほどリード！', '直線に入りました！{L}、後続を離して先頭！', '最後の直線、{L}を追って{B}！差はおよそ{G}馬身！'],
  straightDuel: ['最後の直線！{L}と{B}、ほとんど差がない！', '直線勝負！{L}、{B}、並びかける2頭！', '最後の直線に入りました！先頭争いは接戦です！'],
  straight: ['最後の直線！先頭{L}、{B}が追います！', '直線に向きました！{L}を後続が追いかける！', 'さあ直線の攻防！前は{L}、続いて{B}！'],
  distanceSolo: ['残り{N}メートル！{L}、まだ{G}馬身ほどのリード！', 'あと{N}メートル！{L}が先頭、{B}は届くか！', '残り{N}！{L}、後続を離したまま！'],
  distanceDuel: ['残り{N}！{L}か、{B}か！', 'あと{N}メートル！先頭2頭、差がありません！', '残り{N}！{L}と{B}、譲らない！'],
  distance: ['残り{N}！先頭は{L}、追う{B}！', 'あと{N}メートル！{L}、リードを守れるか！', '残り{N}！ここから最後の勝負です！'],
  three: ['{L}、{B}、{C}！3頭が横一線に近い！', '先頭3頭、差がありません！どの馬が抜けるか！', '{C}も加わった！前は3頭の激しい争い！'],
  duel: ['{B}が迫る！{L}、並ばせるか！', '{L}と{B}！先頭争いはわずかな差！', '前の2頭、接戦です！{L}がわずかに先頭！', '{B}も譲らない！{L}との競り合い！'],
  closing: ['{B}が差を詰めてきた！{L}を追う！', '{B}の脚色がいい！先頭との差を縮めます！', '前を行く{L}に、{B}が接近！', '{B}が迫ってきます！先頭争いに持ち込めるか！'],
  rally: ['{SIDE}から{M}が上がってきた！現在{K}番手！', '{M}が順位を上げています！{SIDE}を通って進出！', '{M}、ここ数秒で{UP}頭をかわした！', '{SIDE}から追い上げる{M}！前を目指します！'],
  solo: ['{L}が後続を離しています！差はおよそ{G}馬身！', '{L}、単独先頭！{B}との差を保っています。', '先頭{L}、{G}馬身ほどのリードがあります！', '前を行く{L}。後続は追いつけるか！'],
  pack: ['馬群はひとかたまり。先頭は{L}！', '各馬が接近しています！前は{L}、続く{B}！', 'まだ馬群は凝縮。ここからどう動くか！'],
  order: ['先頭{L}、2番手{B}、3番手{C}の順です。', '{L}が引っ張る展開。{B}、{C}が続きます。', '前から{L}、{B}、{C}。各馬、次の動きをうかがいます。'],
  skill: ['{M}が「{SK}」を発動！ここで動きます！', '{M}の「{SK}」！展開を変えられるか！', 'ここで{M}、「{SK}」を繰り出した！'],
  finishClose: ['{M}が1着でゴール！最後まで僅差の勝負でした！', '接戦を制したのは{M}！1着でゴールイン！', '{M}が先にゴール！後続もすぐそこでした！'],
  finishSolo: ['{M}、後続を離して1着でゴール！', '{M}が堂々と1着！見事にリードを守りました！', 'これが夢に見た栄光のゴールだ！{M}、1着！'],
  finish: ['{M}が1着でゴールイン！', '勝ったのは{M}！先頭でゴールを駆け抜けました！', '{M}、先頭でゴール！1着です！']
};
// Original homages: course scenery is an introduction, not a live location claim.
// RESULT and BAND retain the actual finish/straight gap even in a special call.
const COURSE_CALLS = {
  'sakura:turf': {
    intro: ['桜の舞台に夢が咲く！', '桜色の歓声、今日はどんな勝負が花開くか！', '満開の吉野山！七曲り坂を上り、上千本の花矢倉を回って、花吹雪の坂を駆け下りる桜花ヶ丘の大一番です！'],
    straight: ['最後の直線！桜の舞台で脚を比べる！先頭{L}、追う{B}！{BAND}', '紅白幕の花見の桟敷へ帰ってきた！長い直線、先頭{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！桜の舞台に勝利の花を咲かせました！', '{RESULT}{M}、1着！千本桜の山に、勝利の花吹雪が舞い上がります！'] },
  'neon:dirt': {
    intro: ['ネオンの街に蹄音が響く！夜の主役は誰だ！', '光の街のダート決戦、歓声まで輝いています！', '摩天楼に囲まれた跑馬地の夜！海沿いの高架とネオン回廊、ナイトマーケットのS字を巡る夜の香港の一戦です！'],
    straight: ['最後の直線！夜の主役を懸けて{L}、{B}が追う！{BAND}', '摩天楼の谷間、跑馬地のホーム直線へ帰ってきた！{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！ネオンの街の主役になりました！'] },
  'aurora:snow': {
    intro: ['雪原の夢を乗せて、オーロラの舞台へ！', '白い大地の力比べ！雪上の栄光をつかむのは誰か！', 'オーロラの揺れるラップランド！キルナへの深雪の坂を上り、凍った湖のほとりへ下る雪原の大一番です！'],
    straight: ['最後の直線！白い大地の追い比べ、{L}を追う{B}！{BAND}', '氷のスタンドへ帰ってきた！雪けむりを上げて先頭{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！雪原の舞台に勝利の蹄跡を刻みました！', '{RESULT}{M}、1着！ラップランドの夜空に、オーロラの冠が開きます！'] },
  'dune:sand': {
    intro: ['夕陽の砂漠、最後まで続く脚がものを言う！', '砂の長丁場に挑む各馬！夕陽に栄光を誓います！', '夕陽に染まるサハラの入口！シェビ砂丘の大砂丘を上り、カスバの路地を抜ける砂漠の大一番です！'],
    straight: ['最後の直線！砂の勝負はもうひと踏ん張り！{L}、追う{B}！{BAND}', 'カスバのスタンドへ帰ってきた！砂けむりを上げて先頭{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！砂の長丁場を走り抜きました！', '{RESULT}{M}、1着！ランタンが灯り、大砂時計の砂が光になって夕空へ舞い上がります！'] },
  'tokyo:turf': {
    intro: ['府中の舞台に夢が集う！長い直線に何を描くか！', '大ケヤキのある府中、広い舞台で夢の競演です！'],
    straight: ['最後の直線！府中の長い追い比べ！先頭{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！府中の舞台で夢をゴールへ届けました！'] },
  'nakayama:turf': {
    intro: ['中山に集まった夢と声援！最後の坂まで目が離せない！', '小回りと急坂の中山！あなたの夢はどの馬に！'],
    straight: ['最後の直線！中山の短い直線、最後まで力を振り絞れ！{L}、{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！中山の歓声を背に栄光のゴール！'] },
  'kyoto:turf': {
    intro: ['淀の長丁場、速さだけでは届かない栄光へ！', '坂と長丁場の京都！最後の一伸びに夢を懸けます！'],
    straight: ['最後の直線！淀の追い比べ、残した脚をここで使う！{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！淀の長丁場に答えを出しました！'] },
  'niigata:turf': {
    intro: ['曲がらず、迷わず、一直線！新潟の千メートル勝負！', '新潟の千直！横に広がるスピードの競演です！'],
    straight: ['千直の終盤！一直線の速さ比べ、{L}を追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！新潟の一直線を駆け抜けました！'] },
  'longchamp:turf': {
    intro: ['ロンシャンの夢舞台！長い直線へ脚を残せるか！', '丘と偽りの直線を持つロンシャン！夢の先にあるゴールへ！'],
    straight: ['最後の直線！ロンシャンの夢を懸けた追い比べ！{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！ロンシャンの夢舞台に勝利の足跡！'] },
  'churchill:dirt': {
    intro: ['二つの尖塔が見守る砂の舞台！バラの栄光は誰に！', 'ケンタッキーの夢を乗せて！砂のスピード勝負です！'],
    straight: ['最後の直線！バラの栄光を目指して{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！バラの舞台に勝利の花が咲きました！'] },
  'monaco:asphalt': {
    intro: ['港の歓声、市街地の駆け引き！モナコの勝負が始まる！', 'ヘアピンとトンネルを持つモナコ！抜くか、守るか！'],
    straight: ['最後の直線！モナコの攻防に決着を！{L}を追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！港の舞台で栄光をつかみました！'] },
  'hanshin:turf': {
    intro: ['阪神の桜の舞台！最後の坂にどんな答えを出すか！', '大きな外回りと最後の急坂！桜の夢が走ります！'],
    straight: ['最後の直線！阪神の坂にも負けるな！{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！阪神の桜の舞台で勝利をつかみました！'] },
  'chukyo:turf': {
    intro: ['中京のスパイラル、坂の先の栄光へ！', '下りとカーブ、直線の坂！中京は力と器用さの勝負です！'],
    straight: ['最後の直線！中京の追い比べ、坂に負けない脚を！{L}、{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！中京の舞台を走り切りました！'] },
  'sapporo:turf': {
    intro: ['北の洋芝に夢が集う！短い直線へ勝機を運べ！', '札幌の丸いコース！早めの判断が勝負を分けるか！'],
    straight: ['最後の直線！札幌の短い勝負どころ、{L}を追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！北の洋芝に勝利の蹄音！'] },
  'meydan:dirt': {
    intro: ['ドバイの夜、砂の舞台に夢が輝く！', '三日月の屋根が見守るダート決戦！夜の栄光を目指せ！'],
    straight: ['最後の直線！ドバイの砂の追い比べ！{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！ドバイのダートで夢が輝きました！'] },
  'meydan:turf': {
    intro: ['ドバイの夜に浮かぶ緑の舞台！華やかな芝の競演です！', '広いカーブと長い直線！ドバイの芝に夢を描け！'],
    straight: ['最後の直線！ドバイの芝で末脚を競う！{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！ドバイの緑の舞台に栄光のゴール！'] },
  'shatin:turf': {
    intro: ['香港の華やかな舞台！山並みを背に夢が走る！', 'シャティンの長い直線へ！歓声に応えるのはどの馬か！', '城門河のほとり、獅子山を望むシャティン！香港カップの発走です！'],
    straight: ['最後の直線！香港の舞台で脚を比べる！{L}、追う{B}！{BAND}', '2棟のスタンドから大歓声！直線430m、{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！香港の舞台に勝利の歓声！'] },
  'kasamatsu:dirt': {
    intro: ['内馬場のパドックを囲む笠松！白砂の小回りで勝負です！', '笠松の短い直線へ、まずはコーナーの位置取りに注目です！'],
    straight: ['最後の直線！笠松の短い追い比べ！{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！笠松の白砂に勝利の蹄跡を刻みました！'] },
  'skyGarden:turf': {
    intro: ['天空の庭園、夢まで高く駆け上がれ！', '浮島と虹橋の舞台！空に届くような勝負を見せてくれ！', '雲海に浮かぶ天空都市！段々畑の観覧席から、虹橋と太陽の門を巡る一周です！'],
    straight: ['最後の直線！天空の栄光を目指す{L}、追う{B}！{BAND}', '段々畑の観覧席へ帰ってきた！最後の直線、{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！天空の庭園に勝利の虹を描きました！'] },
  'candy:dirt': {
    intro: ['甘い景色に熱い勝負！お菓子の国の主役は誰だ！', 'クッキーの道とケーキの丘！勝利のごほうびを目指せ！', 'ジンジャーブレッドの町トルンがお菓子の国に！チョコレートの川からケーキの丘、旧市街の路地を巡る一周です！'],
    straight: ['最後の直線！甘い栄光は譲れない！{L}、追う{B}！{BAND}', 'ジンジャーブレッドのスタンドへ帰ってきた！最後の直線、{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！お菓子の国で甘い勝利をつかみました！', '{RESULT}{M}、1着！大聖堂の鐘が揺れて、お菓子の国が祝福に包まれます！'] },
  'moonForest:turf': {
    intro: ['月光の森に蹄音が響く！夢の道を切り開け！', 'きのこの光と森の起伏！静かな舞台に熱い勝負です！', '月に35日雨が降るという屋久島の森！トロッコ道から縄文杉の丘へ、光るきのこの谷を巡る月夜の一周です！'],
    straight: ['最後の直線！森の舞台に響く追い比べ！{L}、{B}！{BAND}', '苔の屋根のスタンドへ帰ってきた！きのこの灯りの下、先頭{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！月光の森に勝利の光！', '{RESULT}{M}、1着！月光の大きのこが胞子の花火を打ち上げ、森じゅうのきのこが灯ります！'] },
  'dragonCrater:dirt': {
    intro: ['竜の火口で燃える勝負！最後まで力を残せるか！', '火口の縁をぐるりと一周！噴煙の最高地点と急な下りが待っています！', '夜明けのブロモ山！砂の海に囲まれた火口の縁を一周する、竜の火口の大一番です！'],
    straight: ['最後の直線！火口の舞台で燃える追い比べ！{L}、追う{B}！{BAND}', '割れ門の待つ火口縁の台地へ帰ってきた！最後の直線、{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！竜の舞台で勝利の炎をともしました！'] },
  'pearlOcean:turf': {
    intro: ['珊瑚の舞台に夢がきらめく！海底の栄光を目指せ！', '海流と起伏の海底決戦！真珠のような勝利は誰に！', '真珠採りの海の底へ！ブー・マーヒル砦の脇から、真珠貝の海床と珊瑚礁を巡る一周です！'],
    straight: ['最後の直線！海底の夢をゴールへ！{L}、追う{B}！{BAND}', '真珠商人の家並みのスタンドへ帰ってきた！最後の直線、{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！海底の舞台で真珠のような勝利！'] },
  'clockwork:dirt': {
    intro: ['歯車の王国、勝負の時計が動き出す！', '回廊とシケインの舞台！ぴたりと合う走りを見せるのは誰か！', '時計の町の搬送路からスタート！カリヨン、大時計台、からくり人形の前を巡るゼンマイ王国の一周です！'],
    straight: ['最後の直線！勝負の歯車を回せ！{L}、追う{B}！{BAND}', '記念噴水の大通りへ帰ってきた！最後の直線、{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！ゼンマイ王国で勝利の時を刻みました！'] },
  'hakone:asphalt': {
    intro: ['国道1号の最高地点から箱根湯本へ！箱根の山下りが始まります！', '標高874mから一気に駆け下りる！大平台のヘアピンを制するのは誰だ！'],
    straight: ['函嶺洞門を過ぎて湯本の街へ！最後の直線、{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！箱根の山を下り切って、湯本のゴールへ飛び込みました！'] },
  'boxHill:turf': {
    intro: ['妖精の丘、上って下って夢の先へ！', '二つの丘を巡る長丁場！最後まで続く脚に声援を！', 'ジグザグ・ロードから頂上の展望台へ、そして妖精の森へ！ボックス・ヒルを一周するクロスカントリーです！'],
    straight: ['最後の直線！丘の勝負にもうひと伸び！{L}、追う{B}！{BAND}', 'バーフォードの牧草地へ帰ってきた！最後の直線、{L}、追う{B}！{BAND}'],
    finish: ['{RESULT}{M}、1着！妖精の丘に勝利の風を届けました！'] }
};
const HORSE_CALLS = {
  deep: {
    skill: ['{M}、「{SK}」！翼を広げるような末脚、夢を乗せて飛んでいけ！', '{M}が「{SK}」！小さな体に大きな夢、ここから空へ羽ばたくか！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！飛ぶような脚で前を目指す！'],
    finish: ['{RESULT}{M}、1着！翼のような末脚の夢がゴールに届いた！'] },
  orfe: {
    skill: ['{M}、「{SK}」！金色の暴君、今日はどんな答えを出すか！', '{M}が「{SK}」！荒ぶる金色の力、この勝負を揺さぶるか！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！金色の暴君が前を狙う！'],
    finish: ['{RESULT}{M}、1着！金色の暴君が勝利の輝きを放った！'] },
  oguri: {
    skill: ['{M}、「{SK}」！芦毛の根性、声援を力に変えられるか！', '{M}が「{SK}」！叩き上げの意地を見せろ、ここが勝負だ！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！芦毛の怪物に声援が重なる！'],
    finish: ['{RESULT}{M}、1着！芦毛の怪物が夢に応えました！'] },
  suzuka: {
    skill: ['{M}、「{SK}」！逃げの夢を乗せて、どこまで行けるか！', '{M}が「{SK}」！異次元を思わせる加速、風を置き去りにするか！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！快速の脚で前を目指す！'],
    finish: ['{RESULT}{M}、1着！風のような快速馬がゴールを駆け抜けた！'] },
  goldship: {
    skill: ['{M}、「{SK}」！気まぐれな芦毛、長く続く脚に夢を懸ける！', '{M}が「{SK}」！ここから何を見せる、豪快な芦毛の挑戦！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！芦毛のロングスパートが前へ進む！'],
    finish: ['{RESULT}{M}、1着！気まぐれな芦毛が歓声をさらいました！'] },
  matsuri: {
    skill: ['{M}、「{SK}」！お祭りの声援、粘り腰に力を！', '{M}が「{SK}」！大きな体に大きな声援、祭りの勝負どころ！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！前へ進めば歓声もお祭りだ！'],
    finish: ['{RESULT}{M}、1着！勝利のゴールにお祭りの歓声！'] },
  urara: {
    skill: ['{M}、「{SK}」！みんなの夢がこの一歩に、奇跡を目指せ！', '{M}が「{SK}」！走るひたむきさに声援を、夢の続きはここから！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！ひたむきな脚に声援を送れ！'],
    finish: ['{RESULT}{M}、1着！夢が届いた、みんなの笑顔のゴールです！'] },
  big31: {
    skill: ['{M}、「{SK}」！ビッグレッドの力、さらに前へ進むか！', '{M}が「{SK}」！大きな赤い夢を乗せて、豪快な勝負に出る！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！ビッグレッドの力強い進出！'],
    finish: ['{RESULT}{M}、1着！ビッグレッドが栄光のゴールを駆け抜けた！'] },
  queen: {
    skill: ['{M}、「{SK}」！ティアラの輝き、女王の脚を見せるか！', '{M}が「{SK}」！気品の奥に鋭い加速、女王の勝負どころ！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！女王の脚で前を狙う！'],
    finish: ['{RESULT}{M}、1着！勝利のティアラが輝きました！'] },
  unbeaten: {
    skill: ['{M}、「{SK}」！王者の威圧感、この勝負を動かすか！', '{M}が「{SK}」！揺るがぬ気迫、ライバルたちはどう応える！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！王者の気迫で前へ進む！'],
    finish: ['{RESULT}{M}、1着！王者の風格を見せるゴールです！'] },
  teio: {
    skill: ['{M}、「{SK}」！弾むステップ、夢をもう一度前へ！', '{M}が「{SK}」！あきらめない脚に声援を、ここから夢をつなげ！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！弾むステップが夢を前へ運ぶ！'],
    finish: ['{RESULT}{M}、1着！あきらめない夢が弾むステップで届いた！'] },
  haou: {
    skill: ['{M}、「{SK}」！覇王の答えはこの一歩、勝負を切り開くか！', '{M}が「{SK}」！世紀末の覇王を思わせる気迫、前への道を探る！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！覇王の気迫で前へ迫る！'],
    finish: ['{RESULT}{M}、1着！覇王の名に応える栄光のゴール！'] },
  rudolf: {
    skill: ['{M}、「{SK}」！皇帝が動く、堂々たる勝負の采配！', '{M}が「{SK}」！慌てず騒がず、皇帝の一手がここに！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！皇帝の風格で前へ進む！'],
    finish: ['{RESULT}{M}、1着！皇帝の風格がゴールに輝いた！'] },
  brian: {
    skill: ['{M}、「{SK}」！黒い影に宿る豪脚、勝負を切り裂くか！', '{M}が「{SK}」！言葉はいらない、この脚で答えを出せ！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！黒い影の豪脚が前へ迫る！'],
    finish: ['{RESULT}{M}、1着！黒い影の豪脚が勝利をつかんだ！'] },
  rice: {
    skill: ['{M}、「{SK}」！小さな体の大きな底力、静かな勝負の一手！', '{M}が「{SK}」！狙いを定めた追撃、ひたむきな脚に声援を！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！小さな挑戦者が静かに前へ迫る！'],
    finish: ['{RESULT}{M}、1着！小さな体の底力が勝利に届いた！'] },
  bakushin: {
    skill: ['{M}、「{SK}」！桜色の加速、夢を乗せて突き進め！', '{M}が「{SK}」！スタートの合図に燃える快速、勢いを見せろ！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！桜色のロケットが前を目指す！'],
    finish: ['{RESULT}{M}、1着！桜色の快速がゴールを駆け抜けた！'] },
  kurofune: {
    skill: ['{M}、「{SK}」！白銀の力で新たな航路を切り開け！', '{M}が「{SK}」！大きな芦毛の挑戦、力強い航跡を描くか！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！白銀の航跡が前へ伸びる！'],
    finish: ['{RESULT}{M}、1着！白銀の航路は勝利のゴールへ！'] },
  equinox: {
    skill: ['{M}、「{SK}」！速さと持続力の調和、この脚を見届けろ！', '{M}が「{SK}」！流れるような走り、夢の先へ伸びるか！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！調和の取れた脚で前へ迫る！'],
    finish: ['{RESULT}{M}、1着！速さと調和が織りなす勝利のゴール！'] },
  redhare: {
    skill: ['{M}、「{SK}」！千里の気風を乗せて、誇り高く駆け出す！', '{M}が「{SK}」！夕焼けのような赤い力、先駆けの夢を届けろ！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！千里を思わせる脚で前へ！'],
    finish: ['{RESULT}{M}、1着！千里の気風が栄光のゴールに届いた！'] },
  wuzhui: {
    skill: ['{M}、「{SK}」！逆境にひるまぬ黒い風、底力を見せるか！', '{M}が「{SK}」！覇王の相棒を思わせる気迫、ここで動く！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！黒い風が逆境を越えて前へ！'],
    finish: ['{RESULT}{M}、1着！逆境にひるまぬ底力が実を結んだ！'] },
  buce: {
    skill: ['{M}、「{SK}」！太陽へ向かう気風、ためらいを越えて進め！', '{M}が「{SK}」！信頼を力に変える一歩、夢の道を切り開け！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！太陽へ向かうように前を目指す！'],
    finish: ['{RESULT}{M}、1着！太陽へ向かう夢がゴールに届いた！'] },
  marengo: {
    skill: ['{M}、「{SK}」！小さな芦毛の大きな粘り、行軍の力を見せろ！', '{M}が「{SK}」！落ち着いた歩みを勝負の脚へ、皇帝の相棒の気風！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！小さな芦毛の行軍が前へ進む！'],
    finish: ['{RESULT}{M}、1着！小さな芦毛が粘りの行軍を勝利へつないだ！'] },
  matsukaze: {
    skill: ['{M}、「{SK}」！傾奇者の気風、華やかな勝負を見せるか！', '{M}が「{SK}」！自由な風を背に、豪快な一歩で前を目指せ！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！傾奇の風が前へ吹く！'],
    finish: ['{RESULT}{M}、1着！傾奇者の気風が勝利の舞台を飾った！'] },
  maroon: {
    skill: ['{M}、「{SK}」！電車がドリフトしているー！隣の線路へ乗り移った！', '{M}が「{SK}」！マルーンの車体が横を向いた、カーブを線路ごと攻める！'],
    rally: ['{M}が{UP}頭をかわして{K}番手！マルーンの車体が次の駅へ…いや、前へ！'],
    finish: ['{RESULT}{M}、1着！終点ゴール、定刻どおりの到着です！'] }
};
// Combination calls describe a win here, never a recreated historical achievement.
const COMBO_CALLS = {
  'nakayama:turf:oguri': {finish: ['{RESULT}{M}、1着！中山の夢に応えた芦毛の怪物、歓声が重なります！']},
  'nakayama:turf:teio': {finish: ['{RESULT}{M}、1着！中山に響く夢のステップ、あきらめない思いが届いた！']},
  'nakayama:turf:haou': {finish: ['{RESULT}{M}、1着！中山の勝負に覇王の答え、栄光のゴールです！']},
  'tokyo:turf:deep': {finish: ['{RESULT}{M}、1着！府中の空へ羽ばたくような夢、ゴールに届きました！']},
  'tokyo:turf:rudolf': {finish: ['{RESULT}{M}、1着！府中の舞台に皇帝の風格、堂々たる勝利です！']},
  'tokyo:turf:brian': {finish: ['{RESULT}{M}、1着！府中の舞台に刻んだ黒い影の豪脚！']},
  'kyoto:turf:rice': {finish: ['{RESULT}{M}、1着！淀の長丁場、小さな挑戦者の大きな答えです！']},
  'kyoto:turf:goldship': {finish: ['{RESULT}{M}、1着！淀の長丁場に響く歓声、気まぐれな芦毛が夢を届けた！']},
  'meydan:turf:equinox': {finish: ['{RESULT}{M}、1着！ドバイの緑の舞台に、速さと調和の夢が輝いた！']},
  'longchamp:turf:orfe': {finish: ['{RESULT}{M}、1着！ロンシャンの夢舞台で金色の輝き、勝利のゴールです！']},
  'hanshin:turf:maroon': {finish: ['{RESULT}{M}、1着！仁川の駅からひと駆け、地元の電車が勝利をつかんだ！']},
  'yamanote:turf:maroon': {rally: ['{M}が{UP}頭をかわして{K}番手！他社線から乗り入れたマルーンの電車が快走！'], finish: ['{RESULT}{M}、1着！山手線に乗り入れたマルーンの電車、終点東京に到着！']},
  'osakaLoop:turf:maroon': {rally: ['{M}が{UP}頭をかわして{K}番手！梅田の街からやって来たマルーンの電車が、環状線を快走！'], finish: ['{RESULT}{M}、1着！梅田から乗り入れたマルーンの電車、大阪駅に到着！']}
};
// Short historical excerpts, with original broadcast context and source attribution.
// These join the existing pool; they do not replace every original homage.
const CLASSIC_CALLS = [
  {id: 'oguri-effort', keys: ['rally'], horse: 'oguri',
    text: 'さあ頑張るぞ、{M}！{UP}頭をかわして現在{K}番手！',
    credit: '白川次郎／1990年有馬記念・オグリキャップ',
    source: 'https://www.tv-tokyo.co.jp/broad_tvtokyo/program/detail/201712/18073_201712132248.html'},
  {id: 'suzuka-escape', keys: ['straightSolo'], horse: 'suzuka', racingOnly: true,
    text: '最後の直線！どこまで行っても逃げてやる！先頭{L}、{B}におよそ{G}馬身のリード！',
    credit: '青嶋達也／1998年毎日王冠・サイレンススズカ',
    source: 'https://www.nikkansports.com/keiba/column/rapusodi/news/202510200000459.html?Page=1'},
  {id: 'photo-duel', keys: ['finishClose'],
    text: '大接戦ドゴォーン！{RESULT}{M}、1着でゴール！',
    credit: '青嶋達也／2008年天皇賞（秋）・ウオッカとダイワスカーレット',
    source: 'https://www.nikkansports.com/keiba/column/rapusodi/news/202510200000459.html?Page=1'},
  {id: 'kyoto-sakura', keys: ['intro'], course: 'kyoto:turf',
    text: 'かつて「菊の季節にサクラが満開」と響いた淀の舞台。今日の夢はどの馬に！',
    credit: '杉本清／1987年菊花賞・サクラスターオー',
    source: 'https://www.youtube.com/watch?v=FSn22kw5N8g'},
  {id: 'orfe-golden', keys: ['finish', 'finishClose', 'finishSolo'], horse: 'orfe',
    text: '金色の馬体が弾んでいる！{RESULT}{M}、1着！',
    credit: '岡安譲／2011年菊花賞・オルフェーヴル',
    source: 'https://www.youtube.com/watch?v=NUgdhlHAKOs'},
  {id: 'deep-horsemen', keys: ['finish', 'finishClose', 'finishSolo'], horse: 'deep', course: 'kyoto:turf',
    text: '世界のホースマンよ見てくれ！{RESULT}{M}、1着！',
    credit: '馬場鉄志／2005年菊花賞・ディープインパクト',
    source: 'https://thetv.jp/news/detail/199858/p2/'},
  {id: 'haou-arima-rally', keys: ['rally'], horse: 'haou', course: 'nakayama:turf', maxRemaining: 300, racingOnly: true,
    text: '{M}来た！{M}来た！{UP}頭をかわして現在{K}番手！',
    credit: '堺正幸／2000年有馬記念・テイエムオペラオー（馬名を置換）',
    source: 'https://www.famitsu.com/news/202112/31246776.html'},
  {id: 'haou-arima-close', keys: ['finishClose'], horse: 'haou', course: 'nakayama:turf',
    text: 'わずかに{M}か！{RESULT}{M}、1着！',
    credit: '堺正幸／2000年有馬記念・テイエムオペラオー（馬名を置換）',
    source: 'https://meijikkyou.blog84.fc2.com/blog-entry-372.html'}
];
const RC = {
  previous: {}, history: null, sampleT: 0, lastT: -10, lastLead: -1,
  milestones: new Set(),
  reset(race) {
    this.previous = {}; this.history = null; this.sampleT = race.t; this.lastT = -10;
    this.lastLead = -1; this.milestones = new Set();
  },
  line(key, data = {}, context = {}) {
    const event = key.startsWith('straight') ? 'straight' : key.startsWith('finish') ? 'finish' : key;
    if (context.continuous && (event === 'straight' || event === 'finish')) return '';
    const courseId = context.tr ? `${context.tr.def.theme}:${context.tr.def.surf}` : '';
    const horseId = context.horse?.sk;
    const comboId = `${courseId}:${horseId}`;
    let choices = CALLS[key], pool = key;
    for (const [id, calls] of [[`combo:${comboId}`, COMBO_CALLS[comboId]], [`horse:${horseId}`, HORSE_CALLS[horseId]], [`course:${courseId}`, COURSE_CALLS[courseId]]]) {
      if (calls?.[event]?.length) { choices = calls[event]; pool = `${id}:${event}`; break; }
    }
    const classics = CLASSIC_CALLS.filter(call => call.keys.includes(key) &&
      (!call.course || call.course === courseId) && (!call.horse || call.horse === horseId) &&
      (call.maxRemaining == null || (context.remaining >= 0 && context.remaining <= call.maxRemaining)) &&
      (!call.racingOnly || !context.continuous));
    if (classics.length) {
      choices = [...choices, ...classics.map(call => call.text)];
      pool += ':' + classics.map(call => call.id).join(',');
    }
    const available = choices.map((_, i) => i).filter(i => choices.length === 1 || i !== this.previous[pool]);
    const i = available[Math.floor(Math.random() * available.length)];
    this.previous[pool] = i;
    const render = text => text.replace(/\{(\w+)\}/g, (_, k) => data[k]);
    const text = render(choices[i]);
    return key === 'intro' && pool !== key ? render(CALLS.intro[0]) + text : text;
  },
  emit(key, data, priority = false, context = {}) { this.lastT = R.t; say(this.line(key, data, context), priority); },
  update(race, tr) {
    // Re-sort live positions: simulation callbacks can finish a horse before R.order refreshes.
    const order = race.runners.slice().sort((a, b) => b.s - a.s);
    const [lead, second, third] = order;
    if (!third || race.finished || lead.fin) return;
    const remaining = Math.max(0, race.D - lead.s), progress = lead.s / race.D;
    const gap = Math.max(0, lead.s - second.s);
    const data = { L: lead.def.name, B: second.def.name, C: third.def.name, G: Math.max(1, Math.round(gap / 2.4)) };
    const spread = lead.s - order[order.length - 1].s;
    const snap = Object.fromEntries(order.map((r, i) => [r.i, {rank: i + 1, s: r.s}]));
    const history = this.history;
    if (!history || race.t - this.sampleT >= 3) { this.history = snap; this.sampleT = race.t; }
    const band = gap < 1.2 ? 'Duel' : gap >= 7.2 ? 'Solo' : '';
    // Only one call per update. Nearby milestones are consumed together to avoid stale distances.
    if (this.milestones.has('hana') && this.lastLead !== lead.i && race.t - this.lastT >= 3) {
      this.lastLead = lead.i; this.emit('change', data, remaining < 200); return;
    }
    if (race.t - this.lastT < 3) return;
    if (tr.def.theme === 'monaco' && race.t >= 8 && !this.milestones.has('monaco')) {
      this.milestones.add('monaco'); this.emit('monaco', data); return;
    }
    // 地点実況：先頭馬がその地点を過ぎた直後に一度だけ（遅れて届いた古い実況は捨てる）
    for (const [at, text] of race.continuous ? [] : tr.def.placeCalls || []) {
      const passed = race.s0 + lead.s - at;
      if (passed < 0 || this.milestones.has(text)) continue;
      this.milestones.add(text);
      if (passed < 60) { this.lastT = race.t; say(text.replace(/\{(\w+)\}/g, (_, k) => data[k]), false); return; }
    }
    for (const distance of race.continuous ? [] : [100, 200, 400]) {
      if (race.D > distance && remaining <= distance && !this.milestones.has(distance)) {
        [400, 200, 100].filter(n => n >= distance).forEach(n => this.milestones.add(n));
        if (remaining < distance - 70) continue;
        this.emit('distance' + band, {...data, N: distance}, distance <= 200);
        if (distance <= 200) AU.crowdLvl(0.9);
        return;
      }
    }
    const straightLength = tr.finishS - tr.homeS0;
    if (!race.continuous && !this.milestones.has('straight') && remaining < straightLength && progress > 0.5) {
      this.milestones.add('straight');
      if (remaining > 100) {
        this.emit('straight' + band, {...data, BAND: band === 'Duel' ? '先頭2頭、差はわずか！' : band === 'Solo' ? `およそ${data.G}馬身のリード！` : '先頭を追う後続！'}, true, {tr, horse: lead.def});
        crowd.userData.exc = 1.3; return;
      }
    }
    if (!this.milestones.has('hana') && race.t > 3) {
      this.milestones.add('hana'); this.lastLead = lead.i; this.emit('hana', data); return;
    }
    if (!race.continuous && !this.milestones.has('half') && progress >= 0.5) {
      this.milestones.add('half');
      if (progress < 0.65 && remaining > 200) { this.emit('half', data); return; }
    }
    if (race.t - Math.max(this.lastT, tickT) < 5) return;
    const mover = history && order.find((r, i) => history[r.i] && history[r.i].rank - (i + 1) >= 2 && i > 0);
    if ((race.continuous || remaining < 300) && lead.s - third.s < 1.8) this.emit('three', data);
    else if ((race.continuous || remaining < 400) && gap < 1.2) this.emit('duel', data);
    else if (gap > 1.2 && gap < 12 && second.v - lead.v > 0.7) this.emit('closing', data);
    else if (mover) {
      const rank = order.indexOf(mover) + 1;
      this.emit('rally', {...data, M: mover.def.name, K: rank, UP: history[mover.i].rank - rank, SIDE: mover.lane < lead.lane - 1 ? '内' : mover.lane > lead.lane + 1 ? '外' : '馬群の中'}, false, {tr, horse: mover.def, remaining, continuous: race.continuous});
    } else if (gap >= 7.2) this.emit('solo', data);
    else if (spread < 10) this.emit('pack', data);
    else this.emit('order', data);
  },
  finish(race, winner, tr) {
    if (race.continuous) return '';
    const next = race.runners.filter(r => r !== winner).sort((a, b) => b.s - a.s)[0];
    const gap = next ? Math.max(0, winner.s - next.s) : 0;
    return this.line(gap < 1.2 ? 'finishClose' : gap >= 7.2 ? 'finishSolo' : 'finish', {M: winner.def.name, RESULT: gap < 1.2 ? '接戦を制した' : gap >= 7.2 ? '後続を離した' : ''}, {tr, horse: winner.def});
  }
};
function commentary() { RC.update(R, track); }
