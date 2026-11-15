'use strict';
const sequenceCache=new Map();
async function sequenceView(target,params=new URLSearchParams()){
 const name={earth:'Earth',mars:'Mars',barnard:'Barnard’s Star','r-draconis':'R Draconis',comet:'3I/ATLAS'}[target];
 const related={earth:['#earth-overview','Apollo photograph & planet facts'],mars:['#mars-overview','Viking globe & planet facts'],barnard:['#1?mission=1','Original two-visit guided mission'],'r-draconis':['#r-draconis-history','Historical 1955 / 1993 plates'],comet:['#comet-path','Predicted sky path & CSV']}[target];
 app.innerHTML=`<div class="lab-header"><div><span class="eyebrow">OBSERVATION SEQUENCE / REAL IMAGE FRAMES</span><h1>${name}</h1><p id="seq-subtitle">Loading the observation archive…</p></div><a class="button" href="${related[0]}">${related[1]} →</a></div><section class="sequence-workspace"><div class="viewer"><div class="toolbar" role="group" aria-label="Image comparison mode"><button data-seq-mode="blink">Blink comparison</button><button data-seq-mode="single">Time sequence</button><button data-seq-mode="wipe">Drag to compare</button><button data-seq-mode="pair">Side by side</button><span id="seq-count" class="badge"></span></div><div class="seq-stage" id="seq-stage" tabindex="0" aria-label="Observation comparison. Drag in comparison mode to move the divider. Arrow keys step through real frames; Space plays; Escape pauses."><canvas id="seq-a" width="768" height="768" class="seq-a" aria-label="Reference observation A"></canvas><canvas id="seq-b" width="768" height="768" class="seq-b" aria-label="Selected observation B"></canvas><div class="seq-divider" aria-hidden="true"><span>↔</span></div><span class="seq-label seq-label-a">A · Reference</span><span class="seq-label seq-label-b">B · Selected</span></div><div class="viewer-controls"><label id="seq-wipe-label">Drag the divider <output id="seq-wipe-value">50%</output><input id="seq-wipe" type="range" min="0" max="100" value="50" aria-label="Comparison divider"></label><fieldset id="seq-controls" disabled><div class="control-row"><div class="actions"><button id="seq-back" aria-label="Previous observation">←</button><button id="seq-play" class="primary">▶ Play 24 frames</button><button id="seq-next" aria-label="Next observation">→</button><button id="seq-reset">First & last</button></div><label>Playback interval<select id="seq-speed"><option value="700">0.7 seconds</option><option value="1200" selected>1.2 seconds</option><option value="2000">2 seconds</option></select></label></div><label class="seq-time-label">Selected observation B <output id="seq-time-label"></output><input id="seq-time" type="range" min="0" max="23" value="23" aria-label="Selected observation B"></label><label id="seq-reference-label">Reference observation A <output id="seq-reference-date"></output><input id="seq-reference" type="range" min="0" max="23" value="0" aria-label="Reference observation A"></label></fieldset><p id="seq-status" class="inline-status" role="status">Loading actual observations…</p><div class="seq-filmstrip" id="seq-filmstrip" aria-label="Choose an observation frame"></div></div></div><aside class="aside-stack"><section class="panel"><span class="eyebrow">CHANGE THE LIGHT</span><label for="seq-channel">Wavelength band / camera</label><select id="seq-channel" disabled></select><p id="seq-channel-help" class="note"></p><h3>How to explore</h3><ol class="seq-help"><li>Slide B through the observation times.</li><li>Choose “Drag to compare” and move the divider over the image.</li><li>Move A to choose a different reference.</li><li>Switch bands to load their actual images.</li></ol></section><section class="panel"><span class="eyebrow">OBSERVATION PASSPORT</span><dl class="facts"><div><dt>Selected B (UTC)</dt><dd id="seq-passport-date">—</dd></div><div><dt>Frame</dt><dd id="seq-passport-frame">—</dd></div><div><dt>Band / camera</dt><dd id="seq-passport-band">—</dd></div><div><dt>Observation ID</dt><dd id="seq-passport-id">—</dd></div></dl><p><a id="seq-source-a" class="link" target="_blank" rel="noopener">Reference A source →</a><br><a id="seq-source-b" class="link" target="_blank" rel="noopener">Selected B source →</a></p><div class="actions"><button id="seq-share" disabled>Copy this view</button><button id="seq-export" disabled>↓ Selected frame</button></div><p id="seq-action-status" role="status" class="note"></p><a class="link" href="/sequences/${target}.json" download>Dates, channels & sources →</a></section></aside></section><section class="callout warning"><h3>What you’re comparing</h3><p id="seq-alignment"></p><p id="seq-notes"></p><p id="seq-credit" class="note"></p></section>`;
 // Every investigation starts with its frames; noticing is an explicit next step.
 const entry=app.querySelector('.lab-header > a');
 entry.replaceWith(Object.assign(document.createElement('button'),{id:'seq-start-noticing',className:'primary',textContent:'Start noticing →'}));
 const noticing=document.createElement('section');noticing.className='panel notebook';noticing.id='seq-noticing';noticing.hidden=true;
 const prompt={earth:'Follow a cloud pattern or a coastline. What changes between the first and last images?',mars:'Find a recognizable rock or terrain edge. Does the camera view change, or does the feature itself change?',barnard:'Compare a recognizable star with its neighbors. Does its position, shape or brightness appear different?','r-draconis':'Compare the star’s glow and nearby stars. Does the apparent brightness or shape change?',comet:'Compare the central region and background stars. Remember that these views follow the predicted comet position.'}[target];
 noticing.innerHTML=`<span class="eyebrow">STEP 2 / START NOTICING</span><h2>What did you notice?</h2><p>${prompt}</p><label for="seq-observation">My observation<textarea id="seq-observation" rows="3" maxlength="2500" placeholder="I noticed… It is also okay to see no clear change."></textarea></label><label for="seq-explanation">What else could explain it?<textarea id="seq-explanation" rows="3" maxlength="2500" placeholder="Could the camera, wavelength, lighting or image quality explain it?"></textarea></label><p class="note">An apparent change is a clue, not proof of physical motion or changing brightness.</p><div class="actions"><button id="seq-save-note" class="primary">Save my observations</button><button id="seq-return-frames">← Back to frames</button></div><p id="seq-note-status" role="status"></p><p><a class="link" href="${related[0]}">${related[1]} →</a></p>`;
 app.querySelector('.sequence-workspace').after(noticing);
 const continueButton=Object.assign(document.createElement('button'),{className:'primary',id:'seq-continue',textContent:'Start noticing →'});
 app.querySelector('.viewer-controls').append(continueButton);
 const noteKey='atlas-sequence-notes:'+target;
 try{const saved=JSON.parse(localStorage.getItem(noteKey)||'{}');$('seq-observation').value=saved.observation||'';$('seq-explanation').value=saved.explanation||'';}catch{}
 $('seq-save-note').onclick=()=>{try{localStorage.setItem(noteKey,JSON.stringify({observation:$('seq-observation').value,explanation:$('seq-explanation').value}));$('seq-note-status').textContent='Observations saved in this browser for '+name+'.';}catch{$('seq-note-status').textContent='This browser could not save your notes. Copy them before leaving.';}};
 const startNoticing=()=>{stop();document.body.classList.remove('presenting');$('present').textContent='Present →';noticing.hidden=false;noticing.scrollIntoView({block:'start',behavior:'auto'});$('seq-observation').focus({preventScroll:true});};
 $('seq-start-noticing').onclick=startNoticing;continueButton.onclick=startNoticing;
 $('seq-return-frames').onclick=()=>{$('seq-stage').scrollIntoView({block:'center',behavior:'auto'});$('seq-stage').focus({preventScroll:true});};
 // Keep wavelength selection above the image, including on small screens.
 const bandbar=document.createElement('section');bandbar.className='panel sequence-bandbar';
 const help=$('seq-channel').closest('.panel');help.querySelector('.eyebrow').textContent='QUICK START';
 bandbar.append(help.querySelector('label'),$('seq-channel'),$('seq-channel-help'));
 app.querySelector('.sequence-workspace').before(bandbar);
 let disposed=false,loadVersion=0,timer=null,loaded=false,manifest,channel,sheet,current=0,reference=0;
 let marking=null,marks={},markKey='',autoRun=false,autoResult=null,blinkA=false;
 const guide=document.createElement('section');guide.className='panel change-guide';
 guide.innerHTML='<span class="eyebrow">NEW HERE? FOLLOW ONE FEATURE</span><h3>Make the change visible.</h3><p>Pick a small feature you can recognize in both images. Mark its center in A, then its center in B. We’ll draw outlines and a connecting line.</p><div class="actions"><button id="mark-a">1 · Mark in A</button><button id="mark-b">2 · Mark in B</button><button id="mark-clear">Clear marks</button></div><p id="mark-result" role="status">Start with “Mark in A”. For clouds or terrain, choose a recognizable edge or landmark.</p><p class="note">Marks are chosen by you, not an automatic detection. A larger glow may be a brightness or display change, even when its center stays in the same place.</p>';
 const advanced=document.createElement('details');advanced.className='manual-change-tools';advanced.innerHTML='<summary>Advanced: mark a feature yourself</summary>';advanced.append(guide);app.querySelector('.sequence-workspace').after(advanced);
 const autoSummary=document.createElement('p');autoSummary.id='auto-summary';autoSummary.className='auto-summary';autoSummary.setAttribute('role','status');autoSummary.textContent='Press Play. We’ll compare the first and last images and highlight a matching feature when the image evidence is clear.';$('seq-stage').after(autoSummary);
 help.querySelector('.seq-help').innerHTML='<li>Press Blink to alternate two real observations.</li><li>Look for a change yourself, then click “Reveal change” to see the matched points, connecting lines and measurement.</li><li>Click “Start noticing” to record what you found.</li>';
 const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.setAttribute('viewBox','0 0 1000 1000');overlay.setAttribute('class','change-overlay');overlay.setAttribute('aria-hidden','true');$('seq-stage').append(overlay);
 const reveal=document.createElement('button');reveal.id='seq-reveal';reveal.className='primary';reveal.textContent='Reveal change';autoSummary.before(reveal);
 function showResults(show){overlay.style.visibility=show?'visible':'hidden';autoSummary.hidden=!show;reveal.textContent=show?'Hide change':'Reveal change';reveal.setAttribute('aria-pressed',String(show));$('seq-stage').classList.toggle('results-revealed',show);}
 reveal.onclick=()=>{if(loaded)showResults(reveal.getAttribute('aria-pressed')!=='true');};showResults(false);
 function clearMarks(){showResults(false);autoRun=false;autoResult=null;$('seq-stage').classList.remove('auto-finished');$('auto-summary').textContent='Press Blink to compare A and B with automatic feature matching.';marks={};marking=null;overlay.replaceChildren();$('mark-result').textContent='Marks cleared. Choose “Mark in A” to start again.';}
 function drawMarks(){
  overlay.style.display=mode==='pair'?'none':'';
  let connection='';
  if(marks.a&&marks.b){
   const a=marks.a,b=marks.b,dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
   const pixels=length/1000*channel.tileSize;
   // Two connectors meet the actual endpoints; never enlarge the measured displacement.
   const bend=Math.min(16,length/3),nx=length?-dy/length*bend:0,ny=length?dx/length*bend:0;
   const label=pixels<.05?'A and B overlap · no resolved shift':target==='barnard'?`${pixels.toFixed(1)} px ≈ ${(pixels*1.6).toFixed(1)}″ apparent shift`:`${pixels.toFixed(1)} px image-feature shift`;
   connection=(length?`<path class="motion-connection" d="M${a.x} ${a.y} Q${mx+nx} ${my+ny} ${b.x} ${b.y} M${a.x} ${a.y} Q${mx-nx} ${my-ny} ${b.x} ${b.y}" fill="none" stroke="#ffad63" stroke-width="5" stroke-linecap="round"/>`:'')+`<text class="motion-measurement" x="${Math.max(260,Math.min(740,mx))}" y="${Math.max(45,my-65)}" text-anchor="middle" fill="#ffce9e" stroke="#071018" stroke-width="9" stroke-linejoin="round" paint-order="stroke" font-size="26" font-weight="700">${label}</text>`;
  }
  overlay.innerHTML=connection+Object.entries(marks).map(([key,p])=>`<circle cx="${p.x}" cy="${p.y}" r="${key==='a'?26:34}" fill="none" stroke="${key==='a'?'#c4ed9a':'#ffad63'}" stroke-width="5"/><text x="${Math.max(40,Math.min(920,p.x+44))}" y="${Math.max(32,Math.min(965,p.y+(key==='a'?-36:48)))}" fill="${key==='a'?'#c4ed9a':'#ffad63'}" stroke="#071018" stroke-width="6" paint-order="stroke" font-size="32" font-weight="700">${key.toUpperCase()}</text>`).join('');
 }
 function recordMark(x,y){
  marks[marking]={x,y};const completed=marking;marking=null;drawMarks();showResults(true);
  if(!marks.a||!marks.b){$('mark-result').textContent=`${completed.toUpperCase()} outlined. Now choose “Mark in ${completed==='a'?'B':'A'}” and click the SAME feature.`;return;}
  const separation=Math.hypot(marks.b.x-marks.a.x,marks.b.y-marks.a.y)/1000*channel.tileSize;
  const elapsed=Math.abs(Date.parse(channel.frames[current].date)-Date.parse(channel.frames[reference].date))/3600000;
  const period=elapsed>=48?(elapsed/24).toFixed(1)+' days':elapsed.toFixed(2)+' hours';
  const angular=['barnard','r-draconis','comet'].includes(target)?` About ${(separation*1.6).toFixed(1)} arcseconds on this image grid (not a physical distance).`:'';
  const caveat=target==='mars'?'The rover’s pointing changes: this is NOT a measurement of terrain moving.':target==='comet'?'These frames track the predicted comet position, so background stars shift. This is NOT the comet’s sky motion.':target==='earth'?'Clouds change shape and the curved Earth introduces projection effects. This is not a distance in kilometers.':'Alignment, saturation and wavelength differences can shift the apparent center. This is not confirmed proper motion.';
  setMode('wipe');divide(50);drawMarks();
  $('mark-result').textContent=`Your two marks are ${separation.toFixed(1)} preview pixels apart over ${period}.${angular} ${separation<2?'Little apparent displacement: look for a change in shape or brightness instead. ':''}${caveat}`;
 }
 for(const key of ['a','b'])$('mark-'+key).onclick=()=>{if(!loaded)return;stop();marking=key;setMode('wipe');divide(key==='a'?100:0);$('mark-result').textContent=`Showing only ${key.toUpperCase()}. Click the feature’s center in the image. Keyboard: focus the image and press Enter to mark its center.`;$('seq-stage').scrollIntoView({block:'center',behavior:'auto'});$('seq-stage').focus({preventScroll:true});};
 $('mark-clear').onclick=clearMarks;
 let mode=['blink','single','wipe','pair'].includes(params.get('mode'))?params.get('mode'):'blink';
 const abort=new AbortController();
 const stop=()=>{autoRun=false;clearInterval(timer);timer=null;if(!disposed){$('seq-play').textContent=mode==='blink'?'▶ Blink A ↔ B':'▶ Play 24 frames';if(loaded&&mode==='blink')showBlink(false);}};
 const visibility=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',visibility);
 cleanup=()=>{stop();disposed=true;loadVersion++;abort.abort();document.removeEventListener('visibilitychange',visibility);};
 const stamp=d=>d.replace('T',' ').replace(/\.\d+Z$/,'Z').replace('Z',' UTC');
 function paint(canvas,idx){const s=channel.tileSize,ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=target==='earth'||target==='mars';ctx.clearRect(0,0,768,768);ctx.drawImage(sheet,(idx%6)*s,Math.floor(idx/6)*s,s,s,0,0,768,768);}
 function draw(){
  if(channel){const key=channel.id+':'+reference+':'+current;if(markKey&&key!==markKey&&!autoRun){clearMarks();$('mark-result').textContent='The dates or band changed. Mark the feature again for this comparison.';}markKey=key;}
  if(!loaded||disposed)return;paint($('seq-a'),reference);paint($('seq-b'),current);
  const a=channel.frames[reference],b=channel.frames[current];
  $('seq-time').value=current;$('seq-reference').value=reference;
  $('seq-time-label').textContent=stamp(b.date);$('seq-reference-date').textContent=stamp(a.date);
  $('seq-passport-date').textContent=stamp(b.date);$('seq-passport-frame').textContent=`${current+1} / ${channel.frames.length}`;
  $('seq-passport-band').textContent=channel.label;$('seq-passport-id').textContent=b.id;
  $('seq-source-a').href=a.source;$('seq-source-b').href=b.source;
  $('seq-a').setAttribute('aria-label','Reference A: '+stamp(a.date));$('seq-b').setAttribute('aria-label','Selected B: '+stamp(b.date));
  document.querySelectorAll('[data-seq-frame]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.seqFrame)===current)));
  if(mode==='blink'){showBlink(false);detectBlink();}
 }
 function matchFrames(a,b){
  const small=document.createElement('canvas');small.width=small.height=96;const ctx=small.getContext('2d',{willReadFrequently:true});
  const read=idx=>{const s=channel.tileSize;ctx.drawImage(sheet,idx%6*s,Math.floor(idx/6)*s,s,s,0,0,96,96);const rgba=ctx.getImageData(0,0,96,96).data;return Array.from({length:96*96},(_,i)=>.2126*rgba[i*4]+.7152*rgba[i*4+1]+.0722*rgba[i*4+2]);};
  return a===b?null:estimateFeature(read(a),read(b),96,['barnard','r-draconis'].includes(target));
 }
 function showBlink(a){blinkA=a;paint($('seq-b'),a?reference:current);app.querySelector('.seq-label-b').textContent=(a?'A · ':'B · ')+stamp(channel.frames[a?reference:current].date);$('seq-stage').dataset.blinkFrame=a?'a':'b';}
 function detectBlink(){clearMarks();autoResult=matchFrames(reference,current);finishAutomatic();$('seq-stage').classList.remove('auto-finished');}
 function beginAutomatic(){
  clearMarks();current=0;reference=0;setMode('single');autoRun=true;
  autoResult=matchFrames(0,23);
  if(autoResult){marks.a=autoResult.a;drawMarks();$('auto-summary').textContent='First position outlined in green. Watch the sequence; the last position will appear in orange at the end.';}
  else $('auto-summary').textContent='Playing the real images. No reliable first-to-last feature match was found, so no motion path will be guessed.';
  draw();
 }
 function finishAutomatic(){
  autoRun=false;
  if(autoResult){marks={a:autoResult.a,b:autoResult.b};drawMarks();const pixels=Math.hypot(marks.b.x-marks.a.x,marks.b.y-marks.a.y)/1000*channel.tileSize;
   const explanation=target==='mars'?'Camera pointing can account for this shift; it is not moving terrain.':target==='comet'?'The camera view follows the predicted comet position, so this may be a background feature.':target==='earth'?'Cloud shape, map projection and illumination can affect this estimate.':'Alignment, saturation and wavelength differences can affect this estimate.';
   $('auto-summary').textContent=(pixels<channel.tileSize/96?'The matched feature stays in nearly the same place. Look for shape or brightness differences. ':`The matched image feature shifts approximately ${pixels.toFixed(1)} preview pixels between the selected frames. `)+'Green = A; orange = B. '+explanation+' This is an image-pattern estimate, not confirmed physical motion.';
  }else $('auto-summary').textContent='These images did not provide a reliable matching feature. Camera changes, noise or changing shapes can prevent tracking; no motion line is shown.';
  $('seq-stage').classList.add('auto-finished');
 }
 function setMode(next){stop();mode=next;$('seq-play').textContent=mode==='blink'?'▶ Blink A ↔ B':'▶ Play 24 frames';if(loaded){paint($('seq-b'),current);app.querySelector('.seq-label-b').textContent='B · Selected';}overlay.style.display=mode==='pair'?'none':'';if(loaded&&mode==='blink'){showBlink(false);detectBlink();}$('seq-stage').dataset.mode=mode;$('seq-wipe-label').hidden=mode!=='wipe';$('seq-reference-label').hidden=mode==='single';document.querySelectorAll('[data-seq-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.seqMode===mode)));}
 function divide(value){$('seq-wipe').value=value;$('seq-wipe-value').textContent=Math.round(value)+'%';$('seq-stage').style.setProperty('--split',value+'%');}
 const nearest=(frames,date)=>frames.reduce((best,f,i)=>Math.abs(Date.parse(f.date)-date)<Math.abs(Date.parse(frames[best].date)-date)?i:best,0);
 async function selectChannel(id,initial=false){
  const version=++loadVersion;stop();clearMarks();loaded=false;
  const oldB=channel&&Date.parse(channel.frames[current].date),oldA=channel&&Date.parse(channel.frames[reference].date);
  channel=manifest.channels.find(c=>c.id===id)||manifest.channels[0];
  $('seq-controls').disabled=true;$('seq-share').disabled=true;$('seq-export').disabled=true;$('seq-status').textContent='Loading '+channel.label+' observations…';
  // Clear previous pixels so a changed selector never labels an old band as new.
  for(const id of ['seq-a','seq-b'])$(id).getContext('2d').clearRect(0,0,768,768);
  try{
   const next=new Image();next.src=channel.sheet;await next.decode();
   if(disposed||version!==loadVersion)return;
   sheet=next;loaded=true;
   if(initial){current=Math.round(safeNumber(params.get('b'),mode==='blink'?23:0,0,23));reference=Math.round(safeNumber(params.get('a'),0,0,23));}
   else{current=nearest(channel.frames,oldB);reference=nearest(channel.frames,oldA);}
   $('seq-channel').value=channel.id;$('seq-controls').disabled=false;$('seq-share').disabled=false;$('seq-export').disabled=false;
   $('seq-count').textContent=channel.frames.length+' real frames';
   $('seq-filmstrip').replaceChildren();
   channel.frames.forEach((f,i)=>{const b=document.createElement('button');b.dataset.seqFrame=i;b.className='seq-thumb';b.setAttribute('aria-label',`Frame ${i+1}: ${stamp(f.date)}`);b.title=stamp(f.date);b.style.backgroundImage=`url('${channel.sheet}')`;b.style.backgroundPosition=`${i%6*20}% ${Math.floor(i/6)*100/3}%`;b.textContent=String(i+1);b.onclick=()=>{stop();current=i;draw();};$('seq-filmstrip').append(b);});
   $('seq-status').textContent=`${channel.frames.length} distinct observations ready · Frames switch directly; no generated in-between images.`;
   draw();
  }catch{if(!disposed&&version===loadVersion)$('seq-status').textContent='This image sequence could not load. Select another band or reload the page.';}
 }
 document.querySelectorAll('[data-seq-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.seqMode));setMode(mode);divide(50);
 $('seq-wipe').oninput=e=>divide(Number(e.target.value));
 const stage=$('seq-stage');let dragging=false;
 const drag=e=>{if(!dragging||mode!=='wipe')return;const r=stage.getBoundingClientRect();divide(Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)));};
 stage.onpointerdown=e=>{if(mode!=='wipe'||!loaded)return;if(marking){const r=stage.getBoundingClientRect();recordMark(Math.max(0,Math.min(1000,(e.clientX-r.left)/r.width*1000)),Math.max(0,Math.min(1000,(e.clientY-r.top)/r.height*1000)));return;}dragging=true;try{stage.setPointerCapture(e.pointerId);}catch{}drag(e);};stage.onpointermove=drag;stage.onpointerup=stage.onpointercancel=stage.onlostpointercapture=()=>{dragging=false;};
 $('seq-time').oninput=e=>{stop();current=Number(e.target.value);draw();};$('seq-reference').oninput=e=>{stop();reference=Number(e.target.value);draw();};
 const step=n=>{if(!loaded)return;stop();current=Math.max(0,Math.min(23,current+n));draw();};
 $('seq-back').onclick=()=>step(-1);$('seq-next').onclick=()=>step(1);$('seq-reset').onclick=()=>{stop();reference=0;current=23;draw();};
 $('seq-play').onclick=()=>{if(!loaded)return;if(timer){stop();return;}if(mode==='blink'){detectBlink();showBlink(true);timer=setInterval(()=>showBlink(!blinkA),Math.max(400,Number($('seq-speed').value)));$('seq-play').textContent='Ⅱ Pause blink';return;}beginAutomatic();timer=setInterval(()=>{current++;draw();if(current>=23){finishAutomatic();stop();}},Number($('seq-speed').value));$('seq-play').textContent='Ⅱ Pause';};
 $('seq-speed').onchange=stop;stage.onkeydown=e=>{if(marking){if(e.key==='Enter'){e.preventDefault();recordMark(500,500);return;}if(e.key==='Escape'){marking=null;$('mark-result').textContent='Marking cancelled.';return;}if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key===' '){e.preventDefault();return;}}if(['ArrowLeft','ArrowRight',' ','Escape'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1);if(e.key===' ')$('seq-play').click();if(e.key==='Escape')stop();};
 $('seq-channel').onchange=e=>selectChannel(e.target.value);
 $('seq-share').onclick=async()=>{const route={barnard:'1'}[target]||target;const url=location.origin+'/#'+route+'?'+new URLSearchParams({band:channel.id,a:reference,b:current,mode});const status=$('seq-action-status');try{await navigator.clipboard.writeText(url);status.textContent='View link copied with band, dates and comparison mode.';}catch{status.textContent=url;}};
 $('seq-export').onclick=()=>{if(!loaded)return;stop();const filename=target+'-'+channel.id+'-'+channel.frames[current].date.replace(/[:.]/g,'-')+'.png';$('seq-b').toBlob(blob=>{const ok=blob&&download(filename,blob);if(!disposed)$('seq-action-status').textContent=ok?'Selected observation exported. Source and processing details are in the metadata download.':'Export failed. Try again.';});};
 try{
  if(sequenceCache.has(target))manifest=sequenceCache.get(target);
  else{const response=await fetch('/sequences/'+target+'.json',{signal:abort.signal});if(!response.ok)throw Error();manifest=await response.json();if(!manifest.channels?.length||!manifest.channels.every(c=>c.frames.length===24&&c.frames.every(f=>Number.isFinite(Date.parse(f.date)))))throw Error();sequenceCache.set(target,manifest);}
  if(disposed)return;
  $('seq-subtitle').textContent=manifest.subtitle;$('seq-alignment').textContent=manifest.alignment;$('seq-notes').textContent=manifest.notes;$('seq-credit').textContent=manifest.credit;
  for(const c of manifest.channels){const o=document.createElement('option');o.value=c.id;o.textContent=c.label;$('seq-channel').append(o);}
  $('seq-channel').disabled=manifest.channels.length<2;
  $('seq-channel-help').textContent=target==='mars'?'Visible imagery only. Verified separated wavelength channels are not supplied for these shots.':target==='earth'?'Switch between actual visible, water-vapor and thermal-infrared observations at matching times.':'These are six real SPHEREx detector bands. Exact wavelength varies across the detector; changing bands chooses the nearest available observation times.';
  await selectChannel(params.get('band')||(target==='earth'?'13':target==='mars'?'visible':target==='barnard'?'D6':'D3'),true);
 }catch{if(!disposed){$('seq-status').textContent='The observation manifest could not load. Reload this page to retry.';$('seq-subtitle').textContent='Archive temporarily unavailable.';}}
}
