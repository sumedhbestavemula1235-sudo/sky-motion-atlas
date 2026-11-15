const archiveBase='https://irsa.ipac.caltech.edu';
const cometSource=archiveBase+'/data/SPHEREx/docs/comet3iatlas/index.html';
const epochs=[
 ['15 Aug 2025','60902.864715','2025W33_2C_0321_1','spherex_dr1'],
 ['20 Aug 2026','61272.906175','2026W34_2A_0081_1','spherex_qr3']
];
const bands=['0.75–1.09','1.10–1.62','1.63–2.41','2.42–3.82','3.83–4.41','4.42–5.00'];
const colors=['#8aa7ff','#9cc9f5','#a5e4bb','#e2db84','#ffc294','#fc9cb3'];
function observations(){
 return epochs.map(([date,mjd,id,release])=>'<p><strong>'+date+'</strong> · D3 · MJD '+mjd+'<br><a href="'+archiveBase+'/datalink/links/spherex?ID=ivo://irsa.ipac/'+release+'?'+id+'/D3">'+id+' ↗</a></p>').join('');
}
const starRecords='<h3>Barnard’s Star · two archive visits</h3>'+observations()+'<p>These exposures are 370.04 days apart. Load both calibrated fields to compare their telescope pixels on a shared sky grid.</p>';
const cometRecords='<h3>3I/ATLAS · two observing campaigns</h3><p>SPHEREx observed the comet on August 7–15, 2025. By December, the team reported a brighter, more active cloud of gas and dust around its nucleus.</p><a href="'+cometSource+'">IRSA observation table ↗</a>';
const illustration='<figure><img loading="lazy" width="500" alt="Four SPHEREx maps showing emission from the coma of comet 3I/ATLAS" src="https://d2pn8kiwq2w21t.cloudfront.net/original_images/PIA26720_SPHEREx_3I_4panel_colorized.png"><figcaption>December 2025 · SPHEREx coma maps · NASA/JPL-Caltech · <a href="https://www.jpl.nasa.gov/images/pia26720-nasas-spherex-examines-comet-3iatlass-coma/">Image notes</a></figcaption></figure>';
function mount(){
 document.querySelector('#guide')?.remove();
 const p=location.hash.slice(1)||'home';
 if(!['home','0','1','2'].includes(p))return;
 const guide=document.createElement('section');guide.id='guide';app.append(guide);
 if(p==='home'){
 const tiles=[['↗','A moving point','Align the surrounding stars first. A nearby object can then shift against that distant pattern as the observation date changes.'],['◉','A changing glow','A variable star can stay in place as its intensity changes. Compare its brightness to neighboring stars using a consistent display scale.'],['≈','A spectral signature','Infrared detectors measure light in narrow wavelength channels. A comet can show different structures in maps of dust and gas.']];
 guide.innerHTML='<small>FIELD GUIDE</small><h2>Read the changing sky.</h2><div class="cards">'+tiles.map(v=>'<article class="tile"><b aria-hidden="true">'+v[0]+'</b><h3>'+v[1]+'</h3><p>'+v[2]+'</p></article>').join('')+'</div><div class="chapter"><small>INFRARED SPECTROSCOPY</small><h2>Beyond visible light.</h2><p>SPHEREx maps the sky in 102 wavelength channels. Explore the nominal ranges of its six detector bands below.</p></div><div class="spectrum"><div class="bands"></div><h3 id="bandText" aria-live="polite"></h3><p id="bandInfo"></p><a href="https://irsa.ipac.caltech.edu/onlinehelp/spherex/help.pdf">Instrument guide ↗</a></div><div class="chapter"><small>OBSERVING LOG</small><h2>Inside the archive.</h2></div><article class="archivebox">'+starRecords+'<a href="#1">Compare the visits →</a></article><article class="archivebox">'+cometRecords+illustration+'<a href="#0">Inspect the comet visits →</a></article><div class="chapter"><small>IMAGE ANALYSIS</small><h2>Before calling it motion.</h2></div><div class="cards">'+[['Alignment','If all stars jump together, check the image rotation, scale and pointing.'],['Wavelength','Even one SPHEREx detector covers a range. Match the wavelength at the target when comparing brightness.'],['Image quality','Bright stars can saturate and faint dots can be noise. Inspect quality flags before claiming a detection.']].map(a=>'<article class="tile"><h3>'+a[0]+'</h3><p>'+a[1]+'</p></article>').join('')+'</div>';
 const holder=guide.querySelector('.bands');
 bands.forEach((range,i)=>{const b=document.createElement('button');b.textContent='D'+(i+1);b.style.setProperty('--tone',colors[i]);holder.append(b);b.onclick=()=>{for(const n of holder.children)n.setAttribute('aria-pressed',String(n===b));document.querySelector('#bandText').textContent='D'+(i+1)+' · '+range+' μm';document.querySelector('#bandInfo').textContent=['The shortest wavelengths in the survey approach the red edge of visible light.','This window sits between the shortest band and the D3 observations in our star comparison.','Both Barnard’s Star records in this atlas come from this detector.','This band includes the region near 3 micrometers, where water ice can absorb light.','The strong carbon dioxide emission feature near 4.26 micrometers falls here.','The longest wavelengths in the survey include carbon monoxide emission near 4.67 micrometers.'][i]}});
 holder.children[2].click();return;
 }
 if(p==='2'){guide.innerHTML='<article class="archivebox"><h3>R Draconis · a pulsating star</h3><p>A study of visual observations from 1934–2010 estimated a period of 246.11 days. The animated preview illustrates a brightness change. Its intensity scale is illustrative.</p><a href="https://var.saaf.se/results1.html">Period analysis ↗</a></article>';return}
 const comet=p==='0';guide.innerHTML='<article class="archivebox">'+(comet?cometRecords+illustration:starRecords)+'<p><button id="loadReal">'+(comet?'Load archive positions':'Load telescope images')+'</button></p><div id="realOutput" aria-live="polite"></div></article>';
 const button=guide.querySelector('#loadReal'),out=guide.querySelector('#realOutput');
 button.onclick=async()=>{button.disabled=true;out.textContent='Contacting the IRSA archive…';try{
 const response=await fetch('/api/archive?target='+(comet?'comet':'star'));if(!response.ok)throw Error();const data=await response.json();
 const count=comet?data.rows.length:data.images.length;if(!count)throw Error();
 out.innerHTML=(comet?'':'<img alt="Aligned SPHEREx D3 sky cutout">')+'<label>Archive visit <input type="range" min="0" max="'+(count-1)+'" value="0"></label><output></output>';
 const slider=out.querySelector('input');slider.oninput=()=>{const n=Number(slider.value);if(comet){let [mjd,ra,dec]=data.rows[n];out.querySelector('output').textContent=new Date((mjd-40587)*86400000).toISOString().slice(0,16)+' UTC · predicted RA '+ra.toFixed(5)+'°, Dec '+dec.toFixed(5)+'°'}else{out.querySelector('img').src=data.images[n];out.querySelector('output').textContent=epochs[n][0]+' · D3 · North up · common brightness scale'}};slider.oninput();button.hidden=true;
 }catch{out.textContent='Archive data could not be loaded. Open the source record above or retry on the deployed Vercel site.';button.disabled=false}};
}
const sky=document.createElement('div');sky.id='space';sky.setAttribute('aria-hidden','true');document.body.prepend(sky);
for(let n=0;n<100;n++){const s=document.createElement('i');s.style.cssText='top:'+Math.random()*100+'%;left:'+Math.random()*100+'%;width:'+(n%3+1)+'px;height:'+(n%3+1)+'px;animation-delay:-'+n+'s';sky.append(s)}
for(let n=0;n<3;n++){const s=document.createElement('b');s.style.top=(10+n*20)+'%';s.style.animationDelay=-n*6+'s';sky.append(s)}
addEventListener('hashchange',mount);mount();
