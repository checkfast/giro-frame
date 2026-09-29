import test from 'node:test';
import assert from 'node:assert/strict';
import {cropRect} from '../docs/core.js';
test('landscape and portrait photos produce a centered 2:3 crop',()=>{assert.deepEqual(cropRect(1800,1200),[500,0,800,1200]);assert.deepEqual(cropRect(1200,1800),[0,0,1200,1800]);assert.deepEqual(cropRect(1200,2400),[0,300,1200,1800]);assert.throws(()=>cropRect(0,0));});
