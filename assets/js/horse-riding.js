/* Self-contained Canvas mini-game mounted only on the Horse Riding detail page. */
(() => {
  const W = 720, H = 900, DURATION = 38.4, CHECKPOINTS = 8, PERIOD = DURATION / CHECKPOINTS;
  const BEST_KEY = 'gtHorseRidingBestTime', REWARD_KEY = 'gtHorseRidingCollectedRewards';
  const fmt = (seconds) => { const s = Math.max(0, Math.floor(seconds)); return `00:${String(s).padStart(2, '0')}`; };
  const read = (key, fallback = null) => { try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); } catch { return fallback; } };

  function mount(root) {
    if (!root || root.dataset.mounted) return;
    root.dataset.mounted = 'true';
    root.innerHTML = `<div class="hr-game" role="application" aria-label="Horse Riding Challenge">
      <div class="hr-screen"><canvas class="hr-canvas" width="720" height="900" aria-label="Ranchová trať s koňom, checkpointmi a prekážkami"></canvas>
        <div class="hr-topbar"><span class="hr-brand">GOLD TRAIL <b>RANCH</b></span><span class="hr-live-label">HORSE RIDING CHALLENGE</span></div>
        <div class="hr-hud" aria-live="polite"><div><span>TIME LEFT</span><strong data-time>01:00</strong></div><div><span>NEXT CHECKPOINT</span><strong data-checkpoint>0 / 8</strong></div></div>
        <div class="hr-toast" aria-live="assertive"></div>
        <div class="hr-tutorial" hidden><div class="hr-arrows">← <span>☝</span> →</div><strong>SWIPE LEFT OR RIGHT</strong><small>TO CHANGE LANES</small></div>
        <section class="hr-panel hr-start" data-panel="start"><p class="hr-kicker">RANCH • SPEED TRIAL</p><h2>HORSE RIDING<br>CHALLENGE</h2><p class="hr-motto">RIDE FAST<br>STAY IN CONTROL<br>BE THE BEST!</p><div class="hr-copy"><b>RIDE FOR REWARDS!</b><p>Complete the riding course as fast as you can.<br>Follow the checkpoints and avoid obstacles.<br>The better your time, the bigger your reward!</p></div><button class="hr-button" data-start>START</button></section>
        <section class="hr-panel hr-result" data-panel="result" hidden><p class="hr-kicker">RANCH • FINISH LINE</p><h2>GREAT RIDE!</h2><div class="hr-result-stats"><div><span>TIME</span><b data-result-time>00:00</b></div><div><span>CHECKPOINTS</span><b data-result-cp>8 / 8</b></div><div><span>PENALTY TIME</span><b data-result-penalty>+00:00</b></div><div class="hr-total"><span>TOTAL TIME</span><b data-result-total>00:00</b></div></div><div class="hr-record" hidden>★ NEW BEST TIME! ★</div><div class="hr-rewards"><b>REWARDS</b><div><span>🪙<small>4 500 Gold</small></span><span>🪨<small>300 Materials</small></span><span>💎<small>2 Gems</small></span><span>✦<small>1 Skill Token</small></span></div></div><button class="hr-button" data-collect>COLLECT</button><button class="hr-again" data-again>RIDE AGAIN</button></section>
        <div class="hr-collected" hidden role="status">REWARD COLLECTED ✓ <button data-again>RIDE AGAIN</button></div>
        <div class="hr-controls-hint">SWIPE OR DRAG TO STEER <span>← →</span></div>
      </div></div>`;
    const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
    const screen = root.querySelector('.hr-screen'), startPanel = root.querySelector('[data-panel="start"]'), resultPanel = root.querySelector('[data-panel="result"]');
    const tutorial = root.querySelector('.hr-tutorial'), toast = root.querySelector('.hr-toast');
    let mode = 'ready', startedAt = 0, elapsed = 0, penalty = 0, player = 1, target = 1, lastFrame = 0, toastTimer = 0;
    let checkpoint = 0, lastObstacle = -1, shownTutorial = false, bestTime = read(BEST_KEY), newBest = false;
    let tutorialTimer = 0, dust = [], flash = 0, lastTs = performance.now();
    const obstacleLanes = [0, 2, 1, 2, 0, 1, 2, 0];
    let pointerStart = null;

    const laneX = (lane, d) => W / 2 + (lane - 1) * (38 + 224 * d) + (lane === player ? (player - target) * 0 : 0);
    const groundY = (d) => 282 + Math.pow(d, 1.45) * 550;
    const scaleAt = (d) => .17 + d * 1.02;
    function rounded(x, y, w, h, r, fill, stroke) {
      ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
    }
    function drawTree(x, y, s, pine = false) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = '#4f3826'; ctx.fillRect(-7, -45, 14, 53);
      if (pine) {
        for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#31553a','#3d6944','#47784b'][i % 3]; ctx.beginPath(); ctx.moveTo(0, -142 + i * 22); ctx.lineTo(-35 + i * 5, -70 + i * 16); ctx.lineTo(35 - i * 5, -70 + i * 16); ctx.closePath(); ctx.fill(); }
      } else {
        ctx.fillStyle = '#557b42'; ctx.beginPath(); ctx.arc(-18, -83, 29, 0, Math.PI * 2); ctx.arc(15, -91, 36, 0, Math.PI * 2); ctx.arc(39, -71, 24, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(193,174,89,.35)'; ctx.beginPath(); ctx.arc(12, -105, 14, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    function drawRanch() {
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#399bdd'); sky.addColorStop(.44, '#a7d3dc'); sky.addColorStop(.45, '#7b9c55'); sky.addColorStop(1, '#b37b3e');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f6d99c'; ctx.beginPath(); ctx.arc(560, 148, 44, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; [[120,110,1],[235,150,.7],[475,100,.8]].forEach(([x,y,s])=>{ctx.beginPath();ctx.ellipse(x,y,45*s,10*s,0,0,Math.PI*2);ctx.ellipse(x-18*s,y+6*s,23*s,9*s,0,0,Math.PI*2);ctx.ellipse(x+22*s,y+5*s,25*s,8*s,0,0,Math.PI*2);ctx.fill();});
      ctx.fillStyle = '#77929a'; ctx.beginPath(); ctx.moveTo(0, 299); ctx.lineTo(102, 207); ctx.lineTo(160, 251); ctx.lineTo(253, 184); ctx.lineTo(345, 267); ctx.lineTo(453, 196); ctx.lineTo(546, 257); ctx.lineTo(648, 205); ctx.lineTo(720, 273); ctx.lineTo(720, 351); ctx.lineTo(0, 351); ctx.fill();
      ctx.fillStyle = '#597b4e'; ctx.beginPath(); ctx.moveTo(0,278); ctx.lineTo(80,239);ctx.lineTo(172,278);ctx.lineTo(279,235);ctx.lineTo(399,283);ctx.lineTo(518,231);ctx.lineTo(720,281);ctx.lineTo(720,391);ctx.lineTo(0,391);ctx.fill();
      // Rolling ranch greens and parallax treeline.
      ctx.fillStyle = '#668b49'; ctx.fillRect(0, 321, W, 579);
      const drift = (elapsed * 18) % 380;
      for (let i = 0; i < 7; i++) { const x = ((i * 131 - drift * .28) % 900 + 900) % 900 - 80; drawTree(x, 390 + (i % 2) * 10, .43 + (i % 3) * .08, i % 2 === 0); }
      // Road narrows at the horizon and widens toward the rider.
      ctx.beginPath(); ctx.moveTo(328, 306); ctx.lineTo(392, 306); ctx.lineTo(720, 900); ctx.lineTo(0, 900); ctx.closePath();
      const road = ctx.createLinearGradient(0, 305, 0, 900); road.addColorStop(0, '#d8ab64'); road.addColorStop(1, '#c18442'); ctx.fillStyle = road; ctx.fill();
      ctx.fillStyle = 'rgba(108,68,33,.16)';
      ctx.beginPath(); ctx.moveTo(347,310);ctx.lineTo(362,310);ctx.lineTo(170,900);ctx.lineTo(132,900);ctx.fill();
      ctx.beginPath(); ctx.moveTo(374,310);ctx.lineTo(382,310);ctx.lineTo(602,900);ctx.lineTo(566,900);ctx.fill();
      // Moving hoof tracks and pale dirt streaks provide forward motion.
      for (let i = 0; i < 18; i++) { const phase = (i / 18 + (elapsed * .62) % 1) % 1; const y = groundY(phase), sc = scaleAt(phase); const x = 360 + Math.sin(i * 7.4) * (13 + 90 * phase); ctx.fillStyle = `rgba(255,225,166,${.09 + phase * .12})`; ctx.beginPath(); ctx.ellipse(x, y, 1.2 + sc * 5, 3 + sc * 8, -.2, 0, Math.PI * 2); ctx.fill(); }
      // Fence rails run toward the vanishing point on both sides.
      for (const side of [-1, 1]) {
        for (let i = 0; i < 9; i++) {
          const d = ((i / 9 + (elapsed * .18) % 1) % 1), y = groundY(d), s = .15 + d * .95;
          const center = W / 2 + side * (47 + d * 314); const postH = 28 * s, postW = 8 * s;
          ctx.fillStyle = '#684329'; ctx.fillRect(center - postW/2, y - postH, postW, postH);
          ctx.fillStyle = '#ae7845'; ctx.fillRect(center - 19*s, y - postH*.72, 38*s, 4*s); ctx.fillRect(center - 21*s, y - postH*.35, 42*s, 4*s);
          ctx.fillStyle = '#d0a269'; ctx.fillRect(center - postW/2, y - postH, postW, 3*s);
        }
      }
      // Ranch buildings, windmill and wind-blown scrub.
      ctx.save(); ctx.globalAlpha = .78; ctx.fillStyle='#754a2d';ctx.fillRect(26,290,55,34);ctx.fillStyle='#573822';ctx.beginPath();ctx.moveTo(16,292);ctx.lineTo(53,263);ctx.lineTo(91,292);ctx.fill();ctx.fillStyle='#e5c27b';ctx.fillRect(44,302,10,22);ctx.restore();
      ctx.save(); ctx.translate(629, 291); ctx.strokeStyle='#71543b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(0,57);ctx.moveTo(-21,57);ctx.lineTo(0,0);ctx.lineTo(21,57);ctx.moveTo(-13,34);ctx.lineTo(13,34);ctx.stroke();ctx.strokeStyle='#ddd0a6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-24);ctx.moveTo(0,0);ctx.lineTo(20,8);ctx.moveTo(0,0);ctx.lineTo(-15,16);ctx.stroke();ctx.restore();
    }
    function drawCheckpoint(d, index) {
      const y = groundY(d), s = scaleAt(d), cx = W / 2, spread = 44 + d * 290;
      ctx.save(); ctx.globalAlpha = Math.min(1, .25 + d * 1.25); ctx.lineWidth = Math.max(2, 7 * s); ctx.strokeStyle = '#70482c';
      ctx.beginPath(); ctx.moveTo(cx - spread, y); ctx.lineTo(cx - spread, y - 94*s); ctx.moveTo(cx + spread, y); ctx.lineTo(cx + spread, y - 94*s); ctx.moveTo(cx-spread,y-94*s);ctx.lineTo(cx+spread,y-94*s);ctx.stroke();
      for (const side of [-1,1]) { const x=cx+side*spread; ctx.fillStyle='#c5422d';ctx.beginPath();ctx.moveTo(x,y-91*s);ctx.lineTo(x+side*31*s,y-79*s);ctx.lineTo(x,y-66*s);ctx.closePath();ctx.fill(); }
      if (d > .45) { ctx.font=`bold ${Math.round(14*s)}px Georgia`;ctx.textAlign='center';ctx.fillStyle='#fff0d2';ctx.strokeStyle='#744827';ctx.lineWidth=3;ctx.strokeText(String(index),cx,y-100*s);ctx.fillText(String(index),cx,y-100*s); }
      ctx.restore();
    }
    function drawObstacle(d, index, lane) {
      if (d < 0 || d > 1.2) return;
      const x = W/2 + (lane-1)*(38+224*d), y=groundY(Math.min(1,d)), s=scaleAt(Math.min(1,d));
      ctx.save();ctx.translate(x,y);ctx.scale(s,s);
      if (index % 2 === 0) {
        ctx.fillStyle='#75432b';ctx.beginPath();ctx.ellipse(0,-22,21,27,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ad6840';ctx.fillRect(-18,-35,36,5);ctx.fillRect(-17,-10,34,5);ctx.fillStyle='#e2b77a';ctx.fillRect(-19,-30,38,3);
      } else {
        ctx.fillStyle='#cc9b45';ctx.beginPath();ctx.ellipse(0,-18,28,18,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e8c46c';ctx.lineWidth=2;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*8,-33);ctx.lineTo(i*8,-3);ctx.stroke();}
      }
      ctx.restore();
    }
    function drawHorse(now) {
      const bob = mode === 'running' ? Math.sin(now * .012) * 8 : 0, sway = mode === 'running' ? Math.sin(now * .008) * 2.5 : 0;
      const x = W/2 + (player-1)*132 + (target-player)*0, y=731+bob, lean=(target-player)*.08;
      ctx.save();ctx.translate(x,y);ctx.rotate(lean);ctx.translate(sway,0);
      // Hooves and galloping legs alternate in pairs.
      const gallop=mode==='running'?Math.sin(now*.018):0;
      for(let i=0;i<4;i++){
        const front=i<2, side=i%2?1:-1, phase=gallop*(i%2?1:-1);
        const lx=(front?34:-36)+side*12, hip=front?-3:0;
        ctx.strokeStyle='#38251c';ctx.lineWidth=15;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(lx,hip);ctx.lineTo(lx+phase*11,42+Math.max(0,phase)*5);ctx.lineTo(lx-phase*18,112+Math.max(0,phase)*8);ctx.stroke();
        ctx.strokeStyle='#61402a';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(lx+phase*11,42+Math.max(0,phase)*5);ctx.lineTo(lx-phase*18,112+Math.max(0,phase)*8);ctx.stroke();
        ctx.fillStyle='#28201b';ctx.fillRect(lx-phase*18-7,107+Math.max(0,phase)*8,17,10);
      }
      // Tail swishes behind the rump.
      ctx.strokeStyle='#241d1a';ctx.lineWidth=24;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-82,-45);ctx.bezierCurveTo(-133,-9+gallop*8,-126,57,-166,89+Math.sin(now*.009)*12);ctx.stroke();
      ctx.strokeStyle='#43332b';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-85,-48);ctx.bezierCurveTo(-129,-9+gallop*8,-132,48,-164,89+Math.sin(now*.009)*12);ctx.stroke();
      // Muscular bay body with warm highlights.
      ctx.fillStyle='#38251c';ctx.beginPath();ctx.ellipse(0,0,93,67,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#98592f';ctx.beginPath();ctx.ellipse(4,-9,78,55,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#c37a3e';ctx.beginPath();ctx.ellipse(22,-22,47,25,-.2,0,Math.PI*2);ctx.fill();
      // Neck and head, turned slightly to one side.
      ctx.fillStyle='#38251c';ctx.beginPath();ctx.moveTo(40,-42);ctx.quadraticCurveTo(57,-90,83,-119);ctx.lineTo(123,-121);ctx.quadraticCurveTo(146,-108,131,-86);ctx.lineTo(106,-71);ctx.lineTo(89,-20);ctx.closePath();ctx.fill();
      ctx.fillStyle='#995a31';ctx.beginPath();ctx.moveTo(42,-47);ctx.quadraticCurveTo(64,-88,87,-111);ctx.lineTo(120,-113);ctx.quadraticCurveTo(137,-104,125,-90);ctx.lineTo(103,-75);ctx.lineTo(83,-27);ctx.closePath();ctx.fill();
      ctx.fillStyle='#2c211b';ctx.beginPath();ctx.moveTo(91,-114);ctx.lineTo(91,-140);ctx.lineTo(103,-118);ctx.moveTo(117,-113);ctx.lineTo(132,-136);ctx.lineTo(131,-108);ctx.fill();
      ctx.fillStyle='#2b211c';ctx.beginPath();ctx.arc(118,-99,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e6b375';ctx.beginPath();ctx.ellipse(133,-82,13,9,.25,0,Math.PI*2);ctx.fill();
      // Flowing mane along the neck.
      ctx.fillStyle='#261e1b';ctx.beginPath();ctx.moveTo(81,-116);ctx.quadraticCurveTo(69,-105,76,-91);ctx.quadraticCurveTo(58,-85,73,-73);ctx.quadraticCurveTo(57,-60,77,-55);ctx.quadraticCurveTo(64,-39,92,-49);ctx.quadraticCurveTo(104,-79,125,-99);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#44352c';ctx.lineWidth=4;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(83+i*5,-107+i*10);ctx.lineTo(76+i*7,-91+i*10+gallop*3);ctx.stroke();}
      // Saddle, rider torso and hat silhouette viewed from behind.
      ctx.fillStyle='#30231c';ctx.beginPath();ctx.ellipse(-3,-50,52,22,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#513522';ctx.fillRect(-43,-64,78,11);ctx.fillStyle='#bd884e';ctx.fillRect(-35,-61,64,3);
      ctx.fillStyle='#d7c09b';ctx.beginPath();ctx.moveTo(-35,-87);ctx.lineTo(29,-87);ctx.lineTo(47,-13);ctx.lineTo(-51,-13);ctx.closePath();ctx.fill();
      ctx.fillStyle='#3c3028';ctx.beginPath();ctx.moveTo(-34,-90);ctx.lineTo(34,-90);ctx.lineTo(25,-24);ctx.lineTo(-29,-24);ctx.closePath();ctx.fill();
      ctx.fillStyle='#6b4529';ctx.beginPath();ctx.ellipse(0,-106,40,8,0,0,Math.PI*2);ctx.fill();ctx.fillRect(-19,-131,38,26);ctx.beginPath();ctx.ellipse(0,-131,19,6,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#69462d';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-34,-76);ctx.lineTo(-61,-38);ctx.moveTo(34,-76);ctx.lineTo(61,-38);ctx.stroke();
      ctx.restore();
    }
    function drawDust(now) {
      if (mode === 'running' && now-lastFrame > 85) { dust.push({x:W/2+(player-1)*100+(Math.random()-.5)*70,y:790+Math.random()*60,vx:(Math.random()-.5)*1.2,vy:-Math.random()*1.7-0.4,life:.6+Math.random()*.5}); lastFrame=now; }
      ctx.fillStyle='#f0d2a1';dust=dust.filter(p=>p.life>0);for(const p of dust){p.x+=p.vx;p.y+=p.vy;p.life-=.016;ctx.globalAlpha=Math.max(0,p.life);ctx.beginPath();ctx.arc(p.x,p.y,3+(1-p.life)*8,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    }
    function draw(now) {
      ctx.save(); if(flash>0){ctx.translate((Math.random()-.5)*8,(Math.random()-.5)*5);flash=Math.max(0,flash-.025);} drawRanch();
      if(mode==='running'){
        for(let i=checkpoint;i<CHECKPOINTS;i++){const event=(i+1)*PERIOD,d=(elapsed-(event-1.45))/1.45;if(d>=0&&d<=1)drawCheckpoint(d,i+1);}
        for(let i=Math.max(0,checkpoint-1);i<CHECKPOINTS;i++){const event=i*PERIOD+2.1,d=(elapsed-event)/1.9;if(d>=0&&d<=1.15)drawObstacle(d,i,obstacleLanes[i]);}
      } else if(mode==='ready') { drawCheckpoint(.48,1); drawObstacle(.56,0,0); }
      drawDust(now);drawHorse(now);ctx.restore();
    }
    function notify(message) { toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1150); }
    function finish() {
      mode='result';resultPanel.hidden=false;root.querySelector('[data-result-time]').textContent=fmt(elapsed);root.querySelector('[data-result-cp]').textContent=`${checkpoint} / 8`;root.querySelector('[data-result-penalty]').textContent=`+${fmt(penalty)}`;
      const total=elapsed+penalty;root.querySelector('[data-result-total]').textContent=fmt(total);newBest=bestTime===null||total<bestTime;root.querySelector('.hr-record').hidden=!newBest;
      if(newBest){bestTime=total;try{localStorage.setItem(BEST_KEY,JSON.stringify(bestTime));}catch{}}
    }
    function start() { mode='running';elapsed=0;penalty=0;checkpoint=0;lastObstacle=-1;player=1;target=1;startedAt=performance.now();startPanel.hidden=true;resultPanel.hidden=true;root.querySelector('.hr-collected').hidden=true;root.querySelector('[data-time]').textContent='01:00';root.querySelector('[data-checkpoint]').textContent='0 / 8';
      if(!shownTutorial){shownTutorial=true;tutorial.hidden=false;tutorial.classList.add('visible');tutorialTimer=window.setTimeout(()=>{tutorial.classList.remove('visible');setTimeout(()=>tutorial.hidden=true,320);},2600);}
    }
    function steer(direction) { if(mode!=='running')return;target=Math.max(0,Math.min(2,target+direction));tutorial.classList.remove('visible');if(!tutorial.hidden){tutorial.hidden=true;clearTimeout(tutorialTimer);} }
    function frame(now) {
      const dt=Math.min(.05,(now-lastTs)/1000);lastTs=now;player+=(target-player)*(1-Math.exp(-dt*8));
      if(mode==='running'){
        elapsed=(now-startedAt)/1000;
        root.querySelector('[data-time]').textContent=fmt(60-elapsed);
        while(checkpoint<CHECKPOINTS&&elapsed>=(checkpoint+1)*PERIOD){checkpoint++;root.querySelector('[data-checkpoint]').textContent=`${checkpoint} / 8`;notify(`CHECKPOINT ${checkpoint} / 8!`);}
        for(let i=0;i<CHECKPOINTS;i++){
          const hitAt=i*PERIOD+2.1+1.55;
          if(lastObstacle<i&&elapsed>=hitAt){lastObstacle=i;if(Math.abs(target-obstacleLanes[i])<.62){penalty+=5;flash=1;notify('OBSTACLE! +00:05 PENALTY');}}
        }
        if(elapsed>=DURATION){elapsed=DURATION;checkpoint=8;root.querySelector('[data-checkpoint]').textContent='8 / 8';finish();}
      }
      draw(now);requestAnimationFrame(frame);
    }
    root.querySelector('[data-start]').addEventListener('click',start);
    root.querySelector('[data-collect]').addEventListener('click',()=>{const receipts=read(REWARD_KEY,[]);receipts.push({gold:4500,materials:300,gems:2,skillTokens:1,time:elapsed+penalty,at:Date.now()});try{localStorage.setItem(REWARD_KEY,JSON.stringify(receipts));}catch{}resultPanel.hidden=true;root.querySelector('.hr-collected').hidden=false;});
    root.querySelectorAll('[data-again]').forEach(button=>button.addEventListener('click',start));
    screen.addEventListener('pointerdown',event=>{if(event.target.closest('button'))return;pointerStart={x:event.clientX,y:event.clientY,id:event.pointerId};try{screen.setPointerCapture(event.pointerId);}catch{}});
    screen.addEventListener('pointerup',event=>{if(!pointerStart)return;const dx=event.clientX-pointerStart.x;if(Math.abs(dx)>22)steer(dx<0?-1:1);pointerStart=null;});
    screen.addEventListener('pointercancel',()=>{pointerStart=null;});
    screen.addEventListener('keydown',event=>{if(['ArrowLeft','a','A'].includes(event.key)){event.preventDefault();steer(-1);}if(['ArrowRight','d','D'].includes(event.key)){event.preventDefault();steer(1);}});
    screen.tabIndex=0;
    requestAnimationFrame(frame);
  }
  window.HorseRidingGame={mount};
})();
