(()=>{
const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d');
const racers=[
 {name:'Jordan',flag:['#111','#fff','#18743d','#d8323d']},{name:'Palestine',flag:['#111','#fff','#18864a','#e23a42']},
 {name:'Israel',flag:['#fff','#fff','#fff','#2767c7']},{name:'Russia',flag:['#fff','#fff','#fff','#3d62c9']},
 {name:'Iran',flag:['#19844e','#fff','#df3a43','#fff']},{name:'Pakistan',flag:['#fff','#126441','#126441','#fff']},
 {name:'China',flag:['#d93635','#d93635','#d93635','#ffe477']},{name:'North Korea',flag:['#ed404b','#ed404b','#ed404b','#2856a8']}
];
const AI=[{name:'Palestine',flag:racers[1].flag},{name:'Israel',flag:racers[2].flag},{name:'Russia',flag:racers[3].flag},{name:'Iran',flag:racers[4].flag},{name:'Pakistan',flag:racers[5].flag},{name:'China',flag:racers[6].flag},{name:'North Korea',flag:racers[7].flag}];
let W=0,H=0,dpr=1,selected=0,state='menu',last=0,world=0,playerSpeed=0,lateral=0,boost=0,shake=0,paused=false,muted=true,audio=null,toastTimer=0;
const raceLength=2100,totalDistance=raceLength*3,maxSpeed=225,keys=new Set(),collected=new Set();
const player={speed:0,dist:0,lateral:0,item:'',hit:0};
let rivals=[];
const $=s=>document.querySelector(s);
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function flagBall(x,y,r,flag){
 ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();ctx.fillStyle=flag[0];ctx.fillRect(x-r,y-r,2*r,2*r);
 if(flag[0]===flag[1]&&flag[1]===flag[2]){ctx.fillStyle=flag[3];ctx.fillRect(x-r,y-r/3,2*r,2*r/3);ctx.fillStyle=flag[0];ctx.fillRect(x-r,y-r,2*r,r/3)}
 else {ctx.fillStyle=flag[1];ctx.fillRect(x-r,y-r/3,2*r,2*r/3);ctx.fillStyle=flag[2];ctx.fillRect(x-r,y+r/3,2*r,2*r/3);if(flag[3]&&flag[3]!==flag[2]&&flag[3]!==flag[0]&&flag[3]!=='#fff'){ctx.fillStyle=flag[3];ctx.beginPath();ctx.moveTo(x-r,y-r);ctx.lineTo(x-r+r*.72,y);ctx.lineTo(x-r,y+r);ctx.fill()}}
 ctx.restore();ctx.strokeStyle='#1d2534';ctx.lineWidth=Math.max(1,r*.09);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#192235';ctx.beginPath();ctx.ellipse(x-r*.28,y-r*.02,r*.085,r*.14,0,0,Math.PI*2);ctx.ellipse(x+r*.27,y-r*.02,r*.085,r*.14,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#192235';ctx.lineWidth=Math.max(1,r*.06);ctx.beginPath();ctx.arc(x,y+r*.17,r*.17,.12,Math.PI-.12);ctx.stroke();
}
function drawKart(x,y,s,flag,name,playerKart=false){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,7,34,11,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#172033';ctx.fillRect(-28,-1,11,17);ctx.fillRect(17,-1,11,17);
 ctx.fillStyle=playerKart?'#d8ff55':'#f0a849';ctx.beginPath();ctx.moveTo(-25,-8);ctx.quadraticCurveTo(-27,-22,-16,-25);ctx.lineTo(16,-25);ctx.quadraticCurveTo(27,-22,25,-8);ctx.lineTo(31,5);ctx.quadraticCurveTo(0,15,-31,5);ctx.closePath();ctx.fill();ctx.strokeStyle='#151c2a';ctx.lineWidth=2;ctx.stroke();
 ctx.fillStyle='#26344a';ctx.fillRect(-9,-16,18,8);ctx.fillStyle='#f8fbff';ctx.fillRect(-20,1,7,3);ctx.fillRect(13,1,7,3);
 flagBall(0,-34,playerKart?18:14,flag);
 if(name){ctx.font='bold 8px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#101525';ctx.strokeText(name,0,-55);ctx.fillStyle='#fff';ctx.fillText(name,0,-55)}
 ctx.restore();
}
function hills(t){
 let sky=ctx.createLinearGradient(0,0,0,H*.68);sky.addColorStop(0,'#83d8ed');sky.addColorStop(.72,'#e4f2dc');sky.addColorStop(1,'#b4d284');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#fff9';for(let i=0;i<4;i++){let x=((i*W*.34+t*(i%2?7:-4))%(W+130))-65,y=H*(.12+(i%3)*.06);ctx.beginPath();ctx.ellipse(x,y,38,10,0,0,Math.PI*2);ctx.ellipse(x+27,y-6,24,13,0,0,Math.PI*2);ctx.ellipse(x+48,y+1,34,9,0,0,Math.PI*2);ctx.fill()}
 ctx.fillStyle='#69afaa';ctx.beginPath();ctx.moveTo(0,H*.39);for(let x=0;x<=W+10;x+=10)ctx.lineTo(x,H*.35+Math.sin(x*.008+t*.0002)*H*.035+Math.sin(x*.017)*H*.015);ctx.lineTo(W,H*.55);ctx.lineTo(0,H*.55);ctx.fill();
 ctx.fillStyle='#87bc69';ctx.beginPath();ctx.moveTo(0,H*.46);for(let x=0;x<=W+10;x+=10)ctx.lineTo(x,H*.43+Math.sin(x*.006+t*.00015+2)*H*.04+Math.sin(x*.013)*H*.018);ctx.lineTo(W,H*.59);ctx.lineTo(0,H*.59);ctx.fill();
 ctx.fillStyle='#88bf5f';ctx.fillRect(0,H*.48,W,H*.52);
}
function bend(z){return Math.sin(z/430)*.72+Math.sin(z/990+1.1)*.52+Math.sin(z/1800)*.24}
function roadCenter(ahead){return W*.5+(bend(player.dist+ahead)-bend(player.dist))*W*.31}
function project(ahead){let horizon=H*.37,far=1150;let q=Math.max(0,1-ahead/far);return {y:horizon+q*q*(H-horizon),q}}
function road(){
 hills(performance.now());let horizon=H*.37,far=1150,rows=76,step=far/rows,prev=null;
 for(let i=rows;i>=0;i--){let a=i*step,p=project(a),center=roadCenter(a),half=(W*.045+W*.43*p.q),y=p.y;let seg=Math.floor((player.dist+a)/24),stripe=seg%2===0;
  if(prev){let py=prev.y,pc=prev.center,ph=prev.half;
   ctx.fillStyle=stripe?'#e7e8d5':'#d6dfc2';ctx.fillRect(0,py,W,y-py+1);
   ctx.fillStyle=stripe?'#ca5250':'#f7f0dc';poly(pc-ph*1.12,py,pc+ph*1.12,py,center+half*1.12,y,center-half*1.12,y);
   ctx.fillStyle=stripe?'#59606b':'#555b65';poly(pc-ph,py,pc+ph,py,center+half,y,center-half,y);
   let roadY0=(py+y)/2;ctx.fillStyle='#ffffff';for(let lane=1;lane<=2;lane++){let qx=pc-ph+2*ph*lane/3,qy=center-half+2*half*lane/3;if((seg%10)<5){poly(qx-1,py,qx+1,py,qy+1,y,qy-1,y)}}
   ctx.fillStyle='#00000008';ctx.fillRect(0,py,W,y-py+1);
   if(i%5===0){tree(pc-ph*1.36,py,Math.max(3,ph*.055));tree(pc+ph*1.36,py,Math.max(3,ph*.055))}
  }prev={y,center,half};
 }
 // Sunlit horizon glint
}
function poly(x1,y1,x2,y2,x3,y3,x4,y4){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.lineTo(x4,y4);ctx.closePath();ctx.fill()}
function tree(x,y,s){ctx.fillStyle='#78513b';ctx.fillRect(x-s*.2,y-s*.65,s*.4,s*.8);ctx.fillStyle='#276c4c';ctx.beginPath();ctx.moveTo(x,y-s*2.7);ctx.lineTo(x-s,y-s*.3);ctx.lineTo(x+s,y-s*.3);ctx.fill();ctx.fillStyle='#3c9160';ctx.beginPath();ctx.moveTo(x,y-s*2);ctx.lineTo(x-s*.8,y-s*.05);ctx.lineTo(x+s*.8,y-s*.05);ctx.fill()}
function startRace(){
 player.dist=0;player.lateral=0;player.speed=75;player.item='';player.hit=0;boost=0;collected.clear();paused=false;state='race';
 rivals=AI.map((r,i)=>({...r,dist:-(i*20+Math.random()*12),lane:[-.62,-.25,.25,.62][i%4],pace:45+Math.random()*20,phase:Math.random()*9}));
 $('#intro').classList.add('hidden');$('#result').classList.add('hidden');$('#pause').classList.add('hidden');$('#hud').classList.add('show');$('#itemIcon').textContent='—';$('#toast').classList.remove('show');last=performance.now();
}
function notify(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1250)}
function ranking(){return 1+rivals.filter(r=>r.dist>player.dist).length}
function update(dt){
 if(state!=='race'||paused)return;
 dt=Math.min(dt,.04);let steer=(keys.has('ArrowLeft')||keys.has('a')||keys.has('A')?-1:0)+(keys.has('ArrowRight')||keys.has('d')||keys.has('D')?1:0);
 const touch=document.querySelector('[data-control="left"]');if(touch?.dataset.down==='1')steer=-1;const tr=document.querySelector('[data-control="right"]');if(tr?.dataset.down==='1')steer=1;
 let braking=keys.has('ArrowDown')||keys.has('s')||keys.has('S');let accelerating=keys.has('ArrowUp')||keys.has('w')||keys.has('W');
 player.speed+=((accelerating?42:19)-(braking?100:0))*dt;player.speed=Math.max(42,Math.min(maxSpeed,player.speed));if(boost>0){boost-=dt;player.speed=Math.min(270,player.speed+45*dt)}if(player.hit>0){player.hit-=dt;player.speed=Math.max(50,player.speed-25*dt)}
 player.lateral+=steer*dt*(1.55+player.speed/210);player.lateral*=Math.pow(.985,dt*60);player.lateral=Math.max(-.93,Math.min(.93,player.lateral));
 if(Math.abs(player.lateral)>.82){player.speed=Math.max(70,player.speed-37*dt);shake=Math.max(shake,.1)}
 player.dist+=player.speed/3.6*dt;
 for(const r of rivals){r.dist+=r.pace*dt+Math.sin(performance.now()/900+r.phase)*3*dt;r.lane=Math.max(-.7,Math.min(.7,r.lane+Math.sin(performance.now()/1700+r.phase)*dt*.08));let ahead=r.dist-player.dist;
  if(ahead>-8&&ahead<16&&Math.abs(r.lane-player.lateral)<.27&&player.hit<=0){player.hit=.8;player.speed=Math.max(58,player.speed*.55);player.lateral+=(player.lateral<r.lane?-.2:.2);notify('BUMP! Keep rolling');shake=.35}
 }
 // A floating mystery box appears once every 360 metres in each lap.
 let itemIndex=Math.floor((player.dist%raceLength)/360),itemAt=itemIndex*360+180,lapBase=Math.floor(player.dist/raceLength)*raceLength,key=lapBase+itemAt;
 let lane=[-.55,0,.55][itemIndex%3],delta=lapBase+itemAt-player.dist;
 if(delta>0&&delta<player.speed/3.6*dt+9&&Math.abs(player.lateral-lane)<.3&&!collected.has(key)){collected.add(key);player.item=Math.random()<.25?'⭐':'⚡';$('#itemIcon').textContent=player.item;notify('Mystery item!');soundFx(620,.08)}
 if(player.dist>=totalDistance){player.dist=totalDistance;finish();return}
 $('#speed').textContent=Math.round(player.speed);$('#meter').style.width=`${Math.min(100,player.speed/maxSpeed*100)}%`;$('#lap').textContent=Math.min(3,Math.floor(player.dist/raceLength)+1);$('#place').textContent=ranking();shake=Math.max(0,shake-dt);
}
function useItem(){if(state!=='race'||paused||!player.item)return;let item=player.item;player.item='';$('#itemIcon').textContent='—';if(item==='⚡'){boost=2.2;notify('TURBO BOOST!');soundFx(880,.2)}else{boost=1.2;notify('STAR POWER!');soundFx(1050,.24)}}
function soundFx(freq,duration){if(muted)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();let o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.08,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{}}
function finish(){state='finish';$('#hud').classList.remove('show');$('#result').classList.remove('hidden');let place=ranking();$('#resultTitle').textContent=place===1?'YOU WON THE CUP!':place<=3?'PODIUM FINISH!':'RACE COMPLETE!';$('#resultText').textContent=`You crossed the line ${place===1?'in first place':`in ${place}${place===2?'nd':place===3?'rd':'th'} place`}. Ready for another lap?`;soundFx(750,.3)}
function drawPickup(ahead,lane){let p=project(ahead),c=roadCenter(ahead),half=W*.045+W*.43*p.q,x=c+lane*half,y=p.y-p.q*18,s=6+p.q*17;ctx.save();ctx.translate(x,y);ctx.rotate(performance.now()/700);ctx.fillStyle='#ffdf58';ctx.strokeStyle='#fff9bb';ctx.lineWidth=2;ctx.fillRect(-s/2,-s/2,s,s);ctx.strokeRect(-s/2,-s/2,s,s);ctx.rotate(-performance.now()/700);ctx.fillStyle='#6b4811';ctx.font=`1000 ${s*.85}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',0,1);ctx.restore()}
function render(){
 let offX=shake?((Math.random()-.5)*shake*16):0;ctx.save();ctx.translate(offX,0);road();
 // Floating pickups just ahead on the racing line.
 let cycle=player.dist%360,boxDist=180-cycle;if(boxDist<5)boxDist+=360;let boxLane=[-.55,0,.55][Math.floor(player.dist%raceLength/360)%3];if(boxDist<1050)drawPickup(boxDist,boxLane);
 // Rival karts, painted from far to near.
 const visible=rivals.filter(r=>r.dist>player.dist+5&&r.dist<player.dist+1120).sort((a,b)=>b.dist-a.dist);
 for(const r of visible){let ahead=r.dist-player.dist,p=project(ahead),half=W*.045+W*.43*p.q,x=roadCenter(ahead)+r.lane*half,y=p.y-8*p.q,s=.12+p.q*.86;drawKart(x,y,s,r.flag,r.name,false)}
 let px=W*.5+player.lateral*(W*.38),py=H*.81;if(H<480)py=H*.82;
 if(boost>0){ctx.globalAlpha=.6+Math.random()*.25;ctx.fillStyle='#f9b743';ctx.beginPath();ctx.moveTo(px-9,py+5);ctx.lineTo(px,py+43+Math.random()*12);ctx.lineTo(px+9,py+5);ctx.fill();ctx.globalAlpha=1}
 drawKart(px,py,Math.min(1.3,H/660),racers[selected].flag,'',true);
 if(state==='race'&&player.speed<75){ctx.fillStyle='#fff';ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillText('↑ ACCELERATE',W/2,H*.65)}
 ctx.restore();requestAnimationFrame(render)
}
function setSelected(i){selected=(i+racers.length)%racers.length;let r=racers[selected];$('#racerName').textContent=r.name;$('#portrait').style.background=`linear-gradient(to bottom,${r.flag[0]} 0 33%,${r.flag[1]} 33% 66%,${r.flag[2]} 66%)`;}
$('#prev').addEventListener('click',()=>setSelected(selected-1));$('#next').addEventListener('click',()=>setSelected(selected+1));$('#start').addEventListener('click',startRace);
// Replay starts directly; the selected ball remains yours.
$('#again').onclick=()=>startRace();$('#resume').addEventListener('click',()=>{paused=false;$('#pause').classList.add('hidden');last=performance.now()});
$('#sound').addEventListener('click',()=>{muted=!muted;$('#sound').textContent=muted?'♪':'♫';if(!muted)soundFx(660,.08)});
function togglePause(){if(state!=='race')return;paused=!paused;$('#pause').classList.toggle('hidden',!paused);if(!paused)last=performance.now()}
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();keys.add(e.key);if(e.key===' '){if(state==='menu')startRace();else useItem()}if(e.key.toLowerCase()==='p'||e.key==='Escape')togglePause();if(state==='menu'&&(e.key==='ArrowLeft'||e.key==='ArrowRight'))setSelected(selected+(e.key==='ArrowLeft'?-1:1))});
addEventListener('keyup',e=>keys.delete(e.key));
for(const b of document.querySelectorAll('[data-control]')){const down=e=>{e.preventDefault();b.dataset.down='1';if(b.dataset.control==='item')useItem()};const up=e=>{e.preventDefault();b.dataset.down='0'};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up)}
$('#intro').addEventListener('pointerdown',e=>{if(e.target.id==='intro'&&state==='menu')startRace()});
let prevTime=performance.now();function loop(now){let dt=(now-prevTime)/1000;prevTime=now;update(dt);requestAnimationFrame(loop)}
setSelected(0);requestAnimationFrame(render);requestAnimationFrame(loop);
})();
