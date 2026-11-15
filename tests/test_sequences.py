import hashlib
import json
from datetime import datetime
from pathlib import Path
import unittest
from PIL import Image

PUBLIC=Path(__file__).resolve().parent.parent/'public'

class SequenceTests(unittest.TestCase):
    def test_real_sequence_metadata_and_tiles(self):
        for target,count in [('earth',3),('mars',1),('barnard',6),('r-draconis',6),('comet',6)]:
            data=json.loads((PUBLIC/'sequences'/f'{target}.json').read_text())
            self.assertEqual(len(data['channels']),count)
            for channel in data['channels']:
                frames=channel['frames']
                self.assertEqual(len(frames),24)
                self.assertEqual(len({f['id'] for f in frames}),24)
                self.assertEqual(len({f['source'] for f in frames}),24)
                dates=[datetime.fromisoformat(f['date'].replace('Z','+00:00')) for f in frames]
                self.assertEqual(dates,sorted(dates))
                self.assertTrue(all(f['source'].startswith('https://') for f in frames))
                with Image.open(PUBLIC/channel['sheet'].lstrip('/')) as image:
                    size=channel['tileSize'];self.assertEqual(image.size,(size*6,size*4))
                    tiles=[image.crop((i%6*size,i//6*size,(i%6+1)*size,(i//6+1)*size)).tobytes() for i in range(24)]
                    self.assertEqual(len({hashlib.sha256(t).digest() for t in tiles}),24)

    def test_earth_channels_have_matching_times(self):
        channels=json.loads((PUBLIC/'sequences/earth.json').read_text())['channels']
        dates=[[f['date'] for f in c['frames']] for c in channels]
        self.assertEqual(dates[0],dates[1]);self.assertEqual(dates[1],dates[2])
