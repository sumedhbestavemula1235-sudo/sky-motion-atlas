const assert=require('node:assert/strict');
const {estimateFeature}=require('../public/auto-track.js');
const size=96,a=new Array(size*size),b=new Array(size*size).fill(0);let seed=7;
for(let i=0;i<a.length;i++){seed=(seed*16807)%2147483647;a[i]=seed%256;}
for(let y=3;y<size;y++)for(let x=0;x<size-4;x++)b[(y-3)*size+x+4]=a[y*size+x];
const result=estimateFeature(a,b,size,true);assert.ok(result);assert.ok(Math.abs((result.b.x-result.a.x)/1000*size-4)<.01);assert.ok(Math.abs((result.b.y-result.a.y)/1000*size+3)<.01);
assert.equal(estimateFeature(new Array(size*size).fill(12),b,size),null);
console.log('Feature matching: known translation recovered; flat images rejected.');
