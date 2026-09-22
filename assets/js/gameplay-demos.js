/* Small, self-contained playable samples for the catalog's non-riding games. */
(() => {
  const titles = {
    'western-dice':'Western Dice', archery:'Archery Challenge', 'knife-throwing':'Knife Throwing',
    'safe-cracking':'Safe Cracking', 'quick-draw':'Quick Draw Duel', 'revolver-shooting':'Revolver Shooting',
    'wanted-poster':'Wanted Poster Hunt', 'gold-panning':'Gold Panning', fishing:'Fishing',
    'dynamite-mining':'Dynamite Mining', horseshoe:'Horseshoe Challenge', lasso:'Lasso Challenge',
    'train-loading':'Train Loading', combat:'Combat', expeditions:'Expeditions',
    'trading-post':'Trading Post', 'living-conditions':'Living Conditions'
  };
  const intros = {
    'western-dice':'Vyber stávku a hoď kockami. Traf správny rozsah.', archery:'Mier na terč a vystreľ tri šípy.',
    'knife-throwing':'Odhadni pruh letiaceho terča a hoď tri nože.', 'safe-cracking':'Počúvaj nápovedu a nastav číselník trezoru.',
    'quick-draw':'Počkaj na signál DRAW! a reaguj čo najrýchlejšie.', 'revolver-shooting':'Zasiahni banditov, civilistov nechaj na pokoji.',
    'wanted-poster':'Prečítaj si stopy a vyber hľadaného muža.', 'gold-panning':'Prepláchni tri panvice a nájdi zlaté nugety.',
    fishing:'Nahodíš, zasekneš rybu a opatrne ju navinieš.', 'dynamite-mining':'Vyber tri miesta na odstrel a nájdi rudu.',
    horseshoe:'Vyber silu hodu a dostaň podkovu čo najbližšie ku kolíku.', lasso:'Načasuj hod lasa, keď dobytok prechádza otvorom.',
    'train-loading':'Priraď každý náklad do správneho vagóna.', combat:'Blokuj útok a využi otvorenie na protiútok.',
    expeditions:'Vyber trasu a bezpečne prejdi tromi zastávkami.', 'trading-post':'Vyjednaj cenu s obchodníkom.',
    'living-conditions':'Rozdeľ obmedzené zásoby a zlepši pohodlie osady.'
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const btn = (label, attrs='') => `<button type="button" class="md-btn" ${attrs}>${label}</button>`;

  function mount(root, id) {
    if (!root || !titles[id]) return;
    if (root.__demoTimer) clearTimeout(root.__demoTimer);
    let score = 0;
    root.innerHTML = `<section class="mini-demo-card" data-demo="${esc(id)}">
      <header class="md-heading"><div><span>INTERACTIVE SAMPLE</span><h2>${esc(titles[id])}</h2></div><b class="md-status" data-status>READY</b></header>
      <p class="md-instructions">${esc(intros[id])}</p><div class="md-playfield" data-board></div>
      <footer class="md-footer"><output data-feedback aria-live="polite">Vyber akciu a začni.</output>${btn('RESTART','data-restart')}</footer>
    </section>`;
    const board = root.querySelector('[data-board]'), output = root.querySelector('[data-feedback]'), status = root.querySelector('[data-status]');
    const say = (message, state='READY') => { output.textContent=message; status.textContent=state; };
    const restart = () => mount(root,id);
    root.querySelector('[data-restart]').addEventListener('click',restart);

    if (id==='western-dice') {
      let bet='SEVEN';
      board.innerHTML=`<div class="md-choice-row">${['LOW','SEVEN','HIGH'].map((x,i)=>btn(`${['2–6','7','8–12'][i]} · ${x}`,`data-bet="${x}"`)).join('')}</div><div class="md-dice" data-dice>⚀　⚀</div>${btn('ROLL DICE','data-roll')}`;
      board.querySelectorAll('[data-bet]').forEach(b=>b.addEventListener('click',()=>{bet=b.dataset.bet;board.querySelectorAll('[data-bet]').forEach(x=>x.classList.toggle('selected',x===b));say(`${bet} vybraté.`);}));
      board.querySelector('[data-bet="SEVEN"]').classList.add('selected');
      board.querySelector('[data-roll]').addEventListener('click',()=>{const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6),sum=a+b;board.querySelector('[data-dice]').textContent=`${['⚀','⚁','⚂','⚃','⚄','⚅'][a-1]}　${['⚀','⚁','⚂','⚃','⚄','⚅'][b-1]}　= ${sum}`;const win=bet==='LOW'?sum<=6:bet==='HIGH'?sum>=8:sum===7;say(win?'Výhra! Správny tip.':'Tentoraz to nevyšlo. Skús ďalší hod.',win?'WIN':'TRY AGAIN');});
    } else if (id==='archery') {
      let arrows=3, points=0;
      board.innerHTML=`<button type="button" class="md-target" aria-label="Terč: klikni a vystreľ"><i><i><i></i></i></i></button><div class="md-statline">ŠÍPY <b data-arrows>3</b>　BODY <b data-points>0</b></div>`;
      board.querySelector('.md-target').addEventListener('click',e=>{if(!arrows)return;const r=e.currentTarget.getBoundingClientRect(),d=Math.hypot(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2),radius=r.width/2;const value=d<radius*.2?10:d<radius*.45?7:d<radius*.72?4:1;points+=value;arrows--;board.querySelector('[data-arrows]').textContent=arrows;board.querySelector('[data-points]').textContent=points;say(`${value} bodov! ${arrows?`Zostáva šípov: ${arrows}.`:'Séria hotová.'}`,arrows?'AIM':'DONE');});
    } else if (id==='knife-throwing') {
      let throws=3, points=0, lane=Math.floor(Math.random()*3);
      board.innerHTML=`<div class="md-lane-target"><span>LETÍCI TERČ</span><b data-lane>${['←','●','→'][lane]}</b></div><div class="md-choice-row">${['ĽAVO','STRED','PRAVO'].map((x,i)=>btn(x,`data-lane-choice="${i}"`)).join('')}</div>${btn('HODIŤ NOŽ','data-throw')}<div class="md-statline">HODY <b data-left>3</b>　BODY <b data-score>0</b></div>`;
      board.querySelector('[data-throw]').addEventListener('click',()=>{if(!throws)return;const pick=Number(board.querySelector('[data-lane-choice].selected')?.dataset.laneChoice??1),hit=pick===lane;throws--;points+=hit?100:0;board.querySelector('[data-left]').textContent=throws;board.querySelector('[data-score]').textContent=points;lane=Math.floor(Math.random()*3);board.querySelector('[data-lane]').textContent=['←','●','→'][lane];say(hit?'Presný zásah!':`Minul si. Terč sa presunul ${['doľava','do stredu','doprava'][lane]}.`,throws?'AIM':'DONE');});
      board.querySelectorAll('[data-lane-choice]').forEach(b=>b.addEventListener('click',()=>{board.querySelectorAll('[data-lane-choice]').forEach(x=>x.classList.toggle('selected',x===b));}));
      board.querySelector('[data-lane-choice="1"]').classList.add('selected');
    } else if (id==='safe-cracking') {
      const code=2+Math.floor(Math.random()*7);let dial=0;
      board.innerHTML=`<div class="md-safe"><span>ČÍSELNÍK TREZORU</span><strong data-dial>00</strong><small data-clue>Počúvaj mechanizmus…</small></div><div class="md-choice-row">${btn('↶ OTOČIŤ','data-turn="-1"')}${btn('OTOČIŤ ↷','data-turn="1"')}</div>${btn('VYSKÚŠAŤ ZÁMOK','data-try')}`;
      const update=()=>board.querySelector('[data-dial]').textContent=String(dial).padStart(2,'0');
      board.querySelectorAll('[data-turn]').forEach(b=>b.addEventListener('click',()=>{dial=(dial+Number(b.dataset.turn)+10)%10;update();board.querySelector('[data-clue]').textContent=dial===code?'Zámok cvakol…':dial<code?'Mechanizmus znie vyššie.':'Mechanizmus znie nižšie.';}));
      board.querySelector('[data-try]').addEventListener('click',()=>say(dial===code?'Trezor sa otvoril!':'Zámok drží. Použi zvukovú nápovedu.',dial===code?'OPEN':'LISTEN'));
    } else if (id==='quick-draw') {
      board.innerHTML=`<div class="md-duel"><span>PROTIĽAHLO SI SÚPEROVI</span><strong data-duel>ČAKAJ NA SIGNÁL</strong></div>${btn('TAS!','data-draw disabled')}${btn('ZAČAŤ DUEL','data-begin')}`;
      const draw=board.querySelector('[data-draw]');draw.disabled=true;
      board.querySelector('[data-begin]').addEventListener('click',()=>{draw.disabled=true;board.querySelector('[data-duel]').textContent='NEPREDBIEHAJ…';say('Sleduj signál.','WAIT');root.__demoTimer=setTimeout(()=>{board.querySelector('[data-duel]').textContent='DRAW!';draw.disabled=false;draw.dataset.time=performance.now();say('Teraz!','DRAW');},900+Math.random()*1800);});
      draw.addEventListener('click',()=>{if(draw.disabled){say('Priskoro! Sústredi sa a skús znova.','FALSE START');return;}const ms=Math.max(1,Math.round(performance.now()-Number(draw.dataset.time)));draw.disabled=true;board.querySelector('[data-duel]').textContent=`${ms} ms`;say(ms<500?'Vyhral si duel!':'Výstrel bol pomalý. Skús znova.','RESULT');});
    } else if (id==='revolver-shooting') {
      const targets=['bandit','civilian','bottle','bandit','bottle','civilian'];let shot=0,points=0;
      board.innerHTML=`<div class="md-range"><span data-target-icon>🤠</span><b data-target-label>BANDITA!</b></div><div class="md-statline">NÁBOJE <b data-ammo>6</b>　SKÓRE <b data-score>0</b></div>${btn('VYSTRELIŤ','data-fire')}`;
      const drawTarget=()=>{const t=targets[shot%targets.length];board.querySelector('[data-target-icon]').textContent=t==='bandit'?'🤠':t==='civilian'?'🧑':'🍾';board.querySelector('[data-target-label]').textContent=t==='bandit'?'BANDITA!':t==='civilian'?'CIVILISTA — NESTRIEĽAJ':'FĽAŠA';};
      board.querySelector('[data-fire]').addEventListener('click',()=>{if(shot>=6)return;const t=targets[shot++];points+=t==='bandit'?2:t==='bottle'?1:-2;board.querySelector('[data-ammo]').textContent=6-shot;board.querySelector('[data-score]').textContent=points;if(shot<6)drawTarget();say(t==='civilian'?'Pozor! Civilista. Body dole.':t==='bandit'?'Bandita zasiahnutý!':'Fľaša rozbitá.',shot===6?'DONE':'AIM');});
    } else if (id==='wanted-poster') {
      const suspects=[{name:'RED JACK',hat:'ČERVENÝ',horse:'ČIERNY',scar:'ĽAVÁ'},{name:'BILLY REED',hat:'ČIERNY',horse:'HNEDÝ',scar:'PRAVÁ'},{name:'DOC HAYES',hat:'HNEDÝ',horse:'ČIERNY',scar:'PRAVÁ'}];
      board.innerHTML=`<div class="md-clue">STOPY: <b>ČERVENÝ KLOBÚK</b> · <b>ČIERNY KÔŇ</b> · <b>JAZVA VĽAVO</b></div><div class="md-suspects">${suspects.map((s,i)=>btn(`🤠<b>${s.name}</b><small>KLOBÚK ${s.hat}<br>KÔŇ ${s.horse}<br>JAZVA ${s.scar}</small>`,`data-suspect="${i}"`)).join('')}</div>`;
      board.querySelectorAll('[data-suspect]').forEach(b=>b.addEventListener('click',()=>{const right=b.dataset.suspect==='0';board.querySelectorAll('[data-suspect]').forEach(x=>x.disabled=true);b.classList.add(right?'correct':'incorrect');say(right?'Správny muž! Odmena je tvoja.':'To nie je on. Znovu si prezri stopy.',right?'CAUGHT':'MISSED');}));
    } else if (id==='gold-panning') {
      const nuggets=new Set([1,5,7]);let tries=3,found=0;
      board.innerHTML=`<div class="md-pan-grid">${Array.from({length:9},(_,i)=>btn('▪',`data-pan="${i}"`)).join('')}</div><div class="md-statline">PANVICE <b data-pans>3</b>　NUGETY <b data-gold>0</b></div>`;
      board.querySelectorAll('[data-pan]').forEach(b=>b.addEventListener('click',()=>{if(b.disabled||tries<=0)return;const i=Number(b.dataset.pan);b.disabled=true;tries--;if(nuggets.has(i)){found++;b.textContent='✦';b.classList.add('gold');}else b.textContent='·';board.querySelector('[data-pans]').textContent=tries;board.querySelector('[data-gold]').textContent=found;say(nuggets.has(i)?'Zlato! Dobre prepláchnuté.':'Len piesok a kamienky.',tries?'PAN':'DONE');}));
    } else if (id==='fishing') {
      let state='ready',reeled=0;
      board.innerHTML=`<div class="md-water"><span data-fish>🐟</span><b data-fish-state>RIEKA JE TICHÁ</b></div>${btn('NAHODIŤ','data-cast')}${btn('SEKNÚŤ!','data-hook disabled')}${btn('NAVINÚŤ','data-reel disabled')}<div class="md-tension"><i data-tension></i></div><div class="md-statline">POSTUP <b data-progress>0 / 4</b></div>`;
      const hook=board.querySelector('[data-hook]'),reel=board.querySelector('[data-reel]');hook.disabled=true;reel.disabled=true;
      board.querySelector('[data-cast]').addEventListener('click',()=>{if(state!=='ready')return;state='waiting';board.querySelector('[data-fish-state]').textContent='ČAKAJ NA ZÁBER…';say('Udica dopadla. Počkaj na rybu.','WAIT');root.__demoTimer=setTimeout(()=>{state='bite';board.querySelector('[data-fish-state]').textContent='ZÁBER!';hook.disabled=false;say('Teraz zasekni!','BITE!');},900+Math.random()*1700);});
      hook.addEventListener('click',()=>{if(state!=='bite')return;state='fight';hook.disabled=true;reel.disabled=false;board.querySelector('[data-fish-state]').textContent='RYBA ZABRALA!';say('Ťukaj NAVINÚŤ, sleduj napätie.','FIGHT');});
      reel.addEventListener('click',()=>{if(state!=='fight')return;reeled++;board.querySelector('[data-progress]').textContent=`${Math.min(reeled,4)} / 4`;board.querySelector('[data-tension]').style.width=`${Math.min(28+reeled*17,96)}%`;if(reeled>=4){state='caught';reel.disabled=true;board.querySelector('[data-fish-state]').textContent='ÚLOVOK!';say('Pstruh vytiahnutý na breh!','CAUGHT');}else if(reeled===3){say('Napätie rastie — ešte jeden opatrný záťah.','TENSION');}});
    } else if (id==='dynamite-mining') {
      const ore=new Set([0,4,8]);let blasts=3,found=0;
      board.innerHTML=`<div class="md-rock-grid">${Array.from({length:9},(_,i)=>btn('⛰',`data-rock="${i}"`)).join('')}</div><div class="md-statline">NÁLOŽE <b data-blasts>3</b>　RUDY <b data-ore>0</b></div>`;
      board.querySelectorAll('[data-rock]').forEach(b=>b.addEventListener('click',()=>{if(b.disabled||!blasts)return;b.disabled=true;blasts--;if(ore.has(Number(b.dataset.rock))){found++;b.textContent='💎';b.classList.add('ore');}else b.textContent='🪨';board.querySelector('[data-blasts]').textContent=blasts;board.querySelector('[data-ore]').textContent=found;say(ore.has(Number(b.dataset.rock))?'Odkryté ložisko!':'Skala bez rudy.',blasts?'MINE':'DONE');}));
    } else if (id==='horseshoe') {
      let throws=3,points=0;
      board.innerHTML=`<div class="md-horseshoe"><span>PIN</span><b>⌖</b></div><label class="md-range">SILA HODU <input type="range" min="1" max="100" value="55" data-power><b data-power-label>55%</b></label>${btn('HODIŤ PODKOVU','data-throw')}<div class="md-statline">HODY <b data-throws>3</b>　SKÓRE <b data-score>0</b></div>`;
      const power=board.querySelector('[data-power]');power.addEventListener('input',()=>board.querySelector('[data-power-label]').textContent=`${power.value}%`);
      board.querySelector('[data-throw]').addEventListener('click',()=>{if(!throws)return;throws--;const distance=Math.abs(Number(power.value)-68)+Math.floor(Math.random()*13);const award=distance<8?3:distance<20?2:distance<38?1:0;points+=award;board.querySelector('[data-throws]').textContent=throws;board.querySelector('[data-score]').textContent=points;say(award===3?'RINGER! Podkova obopla kolík.':award?`Tesne vedľa. +${award} body.`:'Mimo kolíka.',throws?'THROW':'DONE');});
    } else if (id==='lasso') {
      let throws=3,points=0;
      board.innerHTML=`<div class="md-rope"><span>🐄</span><b data-window>TEĽA PREBIEHA…</b></div><div class="md-meter"><i data-meter></i></div>${btn('HODIŤ LASO','data-rope')}<div class="md-statline">HODY <b data-throws>3</b>　CHYTENÉ <b data-caught>0</b></div>`;
      board.querySelector('[data-rope]').addEventListener('click',()=>{if(!throws)return;throws--;const phase=(throws*31+Math.floor(performance.now()/100))%100,hit=phase>37&&phase<70;if(hit)points++;board.querySelector('[data-throws]').textContent=throws;board.querySelector('[data-caught]').textContent=points;board.querySelector('[data-meter]').style.width=`${phase}%`;board.querySelector('[data-window]').textContent=hit?'CHYTENÉ!':'LASO PRELETelo';say(hit?'Pekný hod — chytil si dobytok!':'Minul si správne načasovanie.',throws?'AIM':'DONE');});
    } else if (id==='train-loading') {
      const cargo=['DREVO','UHLIE','ZÁSOBY'],items=['DREVO','UHLIE','ZÁSOBY','DREVO','UHLIE'];let loaded=0,selected=null;
      board.innerHTML=`<div class="md-cargo-row">${items.map((x,i)=>btn(`📦 ${x}`,`data-cargo="${i}"`)).join('')}</div><p class="md-small-label">VYBER VAGÓN:</p><div class="md-choice-row">${cargo.map((x,i)=>btn(`🚃 ${x}`,`data-car="${x}"`)).join('')}</div><div class="md-statline">NALOŽENÉ <b data-loaded>0 / 5</b></div>`;
      board.querySelectorAll('[data-cargo]').forEach(b=>b.addEventListener('click',()=>{selected=b;board.querySelectorAll('[data-cargo]').forEach(x=>x.classList.toggle('selected',x===b));say(`Vybraté: ${items[Number(b.dataset.cargo)]}. Zvoľ vagón.`);}));
      board.querySelectorAll('[data-car]').forEach(b=>b.addEventListener('click',()=>{if(!selected)return;const good=items[Number(selected.dataset.cargo)]===b.dataset.car;if(good){selected.disabled=true;loaded++;board.querySelector('[data-loaded]').textContent=`${loaded} / 5`;board.querySelectorAll('[data-cargo]').forEach(x=>x.classList.remove('selected'));selected=null;}say(good?'Náklad naložený do správneho vagóna.':'Nesprávny vagón — skús znova.',loaded===5?'DONE':'LOAD');}));
    } else if (id==='combat') {
      let round=1,success=0;
      board.innerHTML=`<div class="md-duel"><span data-round>KOLO 1 / 3</span><strong data-combat>Bandita sa pripravuje na úder…</strong></div><div class="md-choice-row">${btn('BLOK','data-fight="block"')}${btn('ÚTOK','data-fight="attack"')}</div><div class="md-statline">ÚSPEŠNÉ BLOKY <b data-blocks>0</b></div>`;
      board.querySelectorAll('[data-fight]').forEach(b=>b.addEventListener('click',()=>{if(round>3)return;const move=b.dataset.fight,blockNow=Math.floor(performance.now()/500)%2===0,good=(move==='block')===blockNow;if(good)success++;board.querySelector('[data-blocks]').textContent=success;board.querySelector('[data-combat]').textContent=good?(move==='block'?'Úder zablokovaný — protiútok!':'Zásah! Bandita cúva.'):(move==='block'?'Zlý okamih na blok.':'Bandita ťa zasiahol.');round++;board.querySelector('[data-round]').textContent=round<=3?`KOLO ${round} / 3`:'SÚBOJ UKONČENÝ';say(good?'Dobré načasovanie!':'Zmeškal si okno. Sleduj súpera.',round>3?'DONE':'FIGHT');}));
    } else if (id==='expeditions') {
      const routes=['HORSKÝ PRIESMYK','RIEČNA CESTA','KAŇON'];let stops=0,loot=0,route='';
      board.innerHTML=`<div class="md-choice-row">${routes.map((x,i)=>btn(x,`data-route="${i}"`)).join('')}</div><div class="md-expedition" data-expedition>Vyber trasu výpravy.</div>${btn('POKRAČOVAŤ','data-next disabled')}<div class="md-statline">ZASTÁVKY <b data-stops>0 / 3</b>　KORISŤ <b data-loot>0</b></div>`;
      const next=board.querySelector('[data-next]');next.disabled=true;
      board.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>{route=routes[Number(b.dataset.route)];board.querySelector('[data-expedition]').textContent=`Trasa: ${route}. Pribaľ si odvahu a vyraz!`;next.disabled=false;say(`${route} zvolená.`);}));
      next.addEventListener('click',()=>{if(!route||stops>=3)return;stops++;const find=Math.random()>.3;loot+=find?1:0;board.querySelector('[data-stops]').textContent=`${stops} / 3`;board.querySelector('[data-loot]').textContent=loot;board.querySelector('[data-expedition]').textContent=find?'Našiel si zásoby pri starej ceste.':'Stretol si banditov — pokračuješ opatrne.';say(find?'Zásoby pridané do koristi.':'Bez koristi, ale výprava pokračuje.',stops===3?'DONE':'TRAVEL');});
    } else if (id==='trading-post') {
      const ask=80;let offers=0;
      board.innerHTML=`<div class="md-trader"><span>OBCHODNÍK PÝTA</span><strong>$${ask}</strong><small>Koľko ponúkneš za balík zásob?</small></div><div class="md-choice-row">${[45,60,72].map(x=>btn(`PONÚKNUŤ $${x}`,`data-offer="${x}"`)).join('')}</div><div class="md-statline">VYJEDNÁVANIA <b data-offers>0 / 3</b></div>`;
      board.querySelectorAll('[data-offer]').forEach(b=>b.addEventListener('click',()=>{if(offers>=3)return;offers++;const value=Number(b.dataset.offer),accepted=value>=70;board.querySelector('[data-offers]').textContent=`${offers} / 3`;say(accepted?`Dohodnuté za $${value}. Výhodný obchod!`:`Obchodník odmietol $${value}. Skús lepšiu cenu.`,accepted?'DEAL':offers===3?'DONE':'HAGGLE');}));
    } else if (id==='living-conditions') {
      const needs=[{id:'water',name:'ČISTÁ VODA',cost:1,comfort:2},{id:'food',name:'ČERSTVÉ JEDLO',cost:1,comfort:2},{id:'heat',name:'KÚRENIE',cost:2,comfort:3},{id:'housing',name:'OPRAVA DOMOV',cost:2,comfort:4}];let budget=4,comfort=0;
      board.innerHTML=`<div class="md-statline">ZÁSOBY <b data-budget>4</b>　POHODLIE <b data-comfort>0</b></div><div class="md-needs">${needs.map(n=>btn(`${n.name}<small>CENA ${n.cost} · POHODLIE +${n.comfort}</small>`,`data-need="${n.id}"`)).join('')}</div>${btn('SKONČIŤ DEŇ','data-day')}`;
      board.querySelectorAll('[data-need]').forEach(b=>b.addEventListener('click',()=>{const n=needs.find(x=>x.id===b.dataset.need);if(b.disabled||budget<n.cost)return;budget-=n.cost;comfort+=n.comfort;b.disabled=true;board.querySelector('[data-budget]').textContent=budget;board.querySelector('[data-comfort]').textContent=comfort;say(`${n.name} zlepšuje život v osade.`,'SUPPLIES');}));
      board.querySelector('[data-day]').addEventListener('click',()=>say(comfort>=6?`Osada spokojná! Pohodlie ${comfort}.`:`Ľudia potrebujú viac zásob. Pohodlie ${comfort}.`,comfort>=6?'THRIVING':'REVIEW'));
    }
  }
  window.GameplayDemos={mount};
})();
