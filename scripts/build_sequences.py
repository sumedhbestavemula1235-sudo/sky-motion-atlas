"""Build dated, source-linked observation sequences. No synthetic time frames.

Usage: python scripts/build_sequences.py [earth|mars|space|all]
Downloads are cached in /tmp/atlas-sequence-cache. Each sheet stores 24 distinct
observations; its grid is a transport optimization, not an interpolated animation.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen, Request
from xml.etree import ElementTree as ET
import hashlib
import json
import re
import sys
import time
import warnings
import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CACHE = Path('/tmp/atlas-sequence-cache')
OUT = ROOT / 'public' / 'sequences'
CACHE.mkdir(exist_ok=True)
OUT.mkdir(exist_ok=True)
warnings.filterwarnings('ignore', category=Warning, module='astropy')

def fetch(url):
    path = CACHE / hashlib.sha256(url.encode()).hexdigest()
    if path.exists():
        return path.read_bytes()
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent':'SkyMotionAtlas/2.0'}), timeout=35) as r:
                data = r.read()
            path.write_bytes(data)
            return data
        except Exception:
            if attempt == 2:
                raise
            time.sleep(.5)

def rows(data):
    table = ET.fromstring(data).find('.//{*}TABLE')
    fields = [f.get('name') for f in table.findall('{*}FIELD')]
    return [dict(zip(fields, [c.text or '' for c in r])) for r in table.findall('.//{*}TR')]

def sheet(images, name, size):
    out = Image.new('RGB', (6*size, 4*size))
    for i, image in enumerate(images):
        # Letterbox rather than crop or distort the observation.
        image = image.convert('RGB')
        image.thumbnail((size,size))
        out.paste(image, ((i%6)*size+(size-image.width)//2,(i//6)*size+(size-image.height)//2))
    out.save(OUT / (name+'.jpg'), quality=91)
    return '/sequences/'+name+'.jpg'

def write(name, value):
    (OUT / (name+'.json')).write_text(json.dumps(value, indent=2)+'\n')
    print(name, [(c['id'],len(c['frames'])) for c in value['channels']], flush=True)

def earth():
    channels=[]
    listings={c:fetch('https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/'+c+'/').decode() for c in ['02','09','13']}
    stamps=sorted(set.intersection(*[set(re.findall(r'(\d{11})_GOES19-ABI-FD-'+c+r'-678x678.jpg',s)) for c,s in listings.items()]))
    # Pick a common daytime sequence rather than labeling night-time visible frames as empty data.
    stamps=[s for s in stamps if 14 <= int(s[7:9]) < 18][-24:]
    if len(stamps)!=24: raise ValueError('24 matching Earth observations unavailable')
    for c,label in [('02','C02 · Red visible · 0.64 μm'),('09','C09 · Water vapor · 6.9 μm'),('13','C13 · Clean infrared · 10.3 μm')]:
        urls=['https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/'+c+'/'+s+'_GOES19-ABI-FD-'+c+'-678x678.jpg' for s in stamps]
        with ThreadPoolExecutor(6) as pool: images=list(pool.map(lambda u:Image.open(BytesIO(fetch(u))).copy(),urls))
        frames=[{'date':datetime.strptime(s,'%Y%j%H%M').isoformat()+'Z','source':u,'id':s+'-C'+c} for s,u in zip(stamps,urls)]
        channels.append({'id':c,'label':label,'sheet':sheet(images,'earth-'+c,384),'tileSize':384,'frames':frames})
    write('earth',{'name':'Earth','subtitle':'Watch clouds change across 24 real full-disk observations.','credit':'NOAA/NESDIS/STAR · GOES-19 ABI','notes':'A bundled historical sequence, not a live feed. Images retain NOAA’s channel-specific display scales and labels. Infrared colors encode emitted radiance/brightness temperature, not visible surface color.','alignment':'Fixed satellite view; channel images share approximate full-disk framing.','channels':channels})

def mars():
    url='https://mars.nasa.gov/api/v1/raw_image_items/?order=date_taken%20desc&per_page=100&page=0&condition_1=msl:mission&condition_2=MAST_LEFT:instrument'
    candidates=json.loads(fetch(url))['items']
    items=[];seen=set()
    for r in candidates:
        if r['is_thumbnail'] or r['date_taken'] in seen: continue
        seen.add(r['date_taken']);items.append(r)
        if len(items)==24:break
    items.sort(key=lambda x:x['date_taken'])
    if len(items)!=24:raise ValueError('24 unique full Mars images unavailable')
    with ThreadPoolExecutor(6) as pool: images=list(pool.map(lambda r:Image.open(BytesIO(fetch(r['https_url']))).copy(),items))
    frames=[{'date':r['date_taken'],'source':r['https_url'],'id':r['imageid'],'sol':r['sol']} for r in items]
    write('mars',{'name':'Mars','subtitle':'Explore 24 actual Curiosity surface observations in capture order.','credit':'NASA / JPL-Caltech / MSSS · Curiosity Mastcam left','notes':'The rover points at different terrain between shots. This is an observation sequence, not a registered before/after movie of one location. Camera motion, illumination and exposure can explain changes. These public previews do not supply verified separate wavelength channels.','alignment':'Different camera pointings; dragging compares the photographs, not aligned surface change.','channels':[{'id':'visible','label':'Mastcam left · Visible camera imagery','sheet':sheet(images,'mars-visible',384),'tileSize':384,'frames':frames}]})

def space_frame(target, row):
    band=row.get('energy_bandpassname',row.get('spherex_detector','')).split('-')[-1]
    center={'barnard':(269.448,4.768),'r-draconis':(248.166667,66.754722)}.get(target)
    if center is None:center=(float(row['comet_ra']),float(row['comet_dec']))
    # QR2 was superseded by DR1. Resolve the same observation/detector in DR1.
    source=row['access_url'].replace('spherex_qr2','spherex_dr1')
    if 'datalink' in source:
        record=next(r for r in rows(fetch(source)) if r.get('semantics','').endswith('#cutout') and r.get('path'))
        path=record['path']
    else:path=source.split('/ibe/data/')[1]
    cutout='https://irsa.ipac.caltech.edu/ibe/cutout?'+urlencode({'ra':center[0],'dec':center[1],'size':.12,'path':path})
    with fits.open(BytesIO(fetch(cutout)),memmap=False) as h:
        im=h['IMAGE'];wcs=WCS(im.header,fobj=h).celestial
        out=WCS(naxis=2);out.wcs.crpix=[96.5,96.5];out.wcs.crval=center;out.wcs.cdelt=[-1.6/3600,1.6/3600];out.wcs.ctype=['RA---TAN','DEC--TAN']
        y,x=np.indices((192,192));ra,dec=out.pixel_to_world_values(x,191-y);sx,sy=wcs.world_to_pixel_values(ra,dec)
        ix,iy=np.rint(sx).astype(int),np.rint(sy).astype(int)
        good=(ix>=0)&(iy>=0)&(ix<im.data.shape[1])&(iy<im.data.shape[0])
        frame=np.full(x.shape,np.nan);frame[good]=im.data[iy[good],ix[good]]
        if np.isfinite(frame).mean()<.95:raise ValueError('Edge or invalid coverage')
        date=im.header.get('DATE-OBS') or (datetime(1858,11,17)+timedelta(days=float(row['t_min']))).isoformat()
    return frame,{'date':date+'Z' if not date.endswith('Z') else date,'source':source,'cutout':cutout,'id':row['obs_id']+'/'+band,'center':list(center)}

def space(only=None):
    for target,pos in [('barnard','269.448 4.768'),('r-draconis','248.166667 66.754722'),('comet',None)]:
        if only and target!=only:continue
        url='https://irsa.ipac.caltech.edu/SIA?'+urlencode({'COLLECTION':'spherex_dr1','POS':'CIRCLE '+pos+' 0.01'}) if pos else 'https://irsa.ipac.caltech.edu/data/SPHEREx/docs/comet3iatlas/obscore_3I_Atlas.vot'
        records=rows(fetch(url));channels=[]
        for band,wl in [('D1','0.75–1.09'),('D2','1.10–1.62'),('D3','1.63–2.43'),('D4','2.42–3.82'),('D5','3.83–4.41'),('D6','4.41–5.01')]:
            candidates=sorted([r for r in records if r.get('energy_bandpassname',r.get('spherex_detector','')).endswith(band)],key=lambda r:float(r['t_min']))
            # Spread selection across the available dates; remaining observations replace invalid cutouts.
            picks=list(dict.fromkeys(np.linspace(0,len(candidates)-1,min(24,len(candidates)),dtype=int)))
            order=picks+[i for i in range(len(candidates)) if i not in picks]
            successes=[]
            start=0
            while start<len(order):
                needed=24-len(successes)
                selected=order[start:start+needed]
                start+=len(selected)
                if not selected:break
                with ThreadPoolExecutor(8) as pool:
                    tasks={pool.submit(space_frame,target,candidates[i]):i for i in selected}
                    for task in as_completed(tasks):
                        try:successes.append(task.result())
                        except Exception as exc:print('skip',target,band,tasks[task],str(exc)[:100],flush=True)
                if len(successes)>=24:break
            successes.sort(key=lambda pair:pair[1]['date'])
            if len(successes)<24:raise ValueError(f'{target} {band}: only {len(successes)} usable frames')
            low,high=np.nanpercentile(np.stack([f for f,r in successes]),[3,99.7])
            images=[Image.fromarray(np.uint8(255*np.arcsinh(8*np.clip(np.nan_to_num((f-low)/max(high-low,1e-9)),0,1))/np.arcsinh(8))) for f,r in successes]
            channels.append({'id':band,'label':band+' · '+wl+' μm','sheet':sheet(images,target+'-'+band,192),'tileSize':192,'frames':[r for f,r in successes]})
            print(target,band,'24 actual observations ready',flush=True)
            # Save incremental progress for resumable builds and inspection.
            write(target,{'name':{'barnard':'Barnard’s Star','r-draconis':'R Draconis','comet':'3I/ATLAS'}[target],'subtitle':'24 real SPHEREx exposures in each detector band.','credit':'NASA / JPL-Caltech / IRSA · SPHEREx','notes':'Six detector bands, not 102 independently selectable monochromatic channels. Effective wavelength varies across each detector and between visits. A shared asinh stretch is used within each band; saturation, noise and wavelength differences prevent simple brightness claims. Dates differ by band. Quality flags are not masked.','alignment':'North up, east left · 5.12 arcmin · 1.6 arcsec/output pixel. '+('Centered on the predicted comet position at each exposure; background stars move in this tracked view. This is not proof of a comet detection.' if target=='comet' else 'Fixed sky coordinates, not target tracking. Alignment has not been fitted to neighboring stars.'),'channels':channels})

if __name__=='__main__':
    mode=sys.argv[1] if len(sys.argv)>1 else 'all'
    if mode=='comet':space('comet')
    for name,fn in [('earth',earth),('mars',mars),('space',space)]:
        if mode in [name,'all']:fn()
