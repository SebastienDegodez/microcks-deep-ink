import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { BarChart, ConformanceBand, ConformanceMatrix } from '../src/lib/index.js';
import SplitPaneHarness from './fixtures/SplitPaneHarness.svelte';
it('server-renders charts with their accessible text equivalents', () => {
  const {body}=render(BarChart,{props:{label:'Runs',bars:[{id:'1',value:12,description:'Run 1'}],max:20,onselect:()=>{},table:{caption:'Runs table',columns:['Run'],rows:[['1']]}}});
  expect(body).toContain('aria-label="Run 1"');
  expect(body).toContain('<caption>Runs table</caption>');
  expect(body).toContain('height:60%');
  expect(render(ConformanceBand,{props:{outcomes:['pass','fail'],showSummary:true}}).body).toContain('1 of 2 operations pass, 1 fails');
  expect(render(ConformanceMatrix,{props:{caption:'Checks',columns:[{id:'http',label:'HTTP'}],groups:[{id:'g',label:'Group',rows:[{id:'r',label:'Row',cells:[{result:'pass'}]}]}]}}).body).toContain('Passed');
});
it('server-renders split panes in reading order', () => {
  const {body}=render(SplitPaneHarness,{props:{sideWidth:'300px'}});
  expect(body).toContain('--split-side:300px');
  expect(body.indexOf('aria-label="Operations"')).toBeLessThan(body.indexOf('aria-label="Operation detail"'));
});
