/* Conservative image-pattern matching, not a physical-motion measurement. */
function estimateFeature(first,last,size,central=false){
 const radius=5,range=14;
 const patch=(data,x,y)=>{const out=[];let sum=0;for(let j=-radius;j<=radius;j++)for(let i=-radius;i<=radius;i++){const v=data[(y+j)*size+x+i];out.push(v);sum+=v;}const mean=sum/out.length;let energy=0;for(let i=0;i<out.length;i++){out[i]-=mean;energy+=out[i]*out[i];}return {values:out,energy};};
 const candidates=central?[[size/2,size/2]]:[.3,.5,.7].flatMap(y=>[.3,.5,.7].map(x=>[Math.round(size*x),Math.round(size*y)]));
 let result=null;
 for(const [x,y] of candidates){
  const a=patch(first,x,y);if(a.energy/a.values.length<100)continue;
  const scores=[];
  for(let dy=-range;dy<=range;dy++)for(let dx=-range;dx<=range;dx++){
   if(x+dx-radius<0||y+dy-radius<0||x+dx+radius>=size||y+dy+radius>=size)continue;
   const b=patch(last,x+dx,y+dy);if(b.energy<1)continue;
   let dot=0;for(let i=0;i<a.values.length;i++)dot+=a.values[i]*b.values[i];
   scores.push({x:x+dx,y:y+dy,score:dot/Math.sqrt(a.energy*b.energy)});
  }
  scores.sort((a,b)=>b.score-a.score);const best=scores[0];if(!best)continue;
  const second=scores.find(p=>Math.hypot(p.x-best.x,p.y-best.y)>3);
  const margin=best.score-(second?.score||0);
  if(best.score<.88||margin<.06||Math.abs(best.x-x)===range||Math.abs(best.y-y)===range)continue;
  const strength=best.score+margin;
  if(!result||strength>result.strength)result={a:{x:x/size*1000,y:y/size*1000},b:{x:best.x/size*1000,y:best.y/size*1000},score:best.score,strength};
 }
 return result;
}
if(typeof module!=='undefined')module.exports={estimateFeature};
