const fs = require('node:fs');
const { createRequire } = require('node:module');
const requireUI = createRequire(require('node:path').resolve(__dirname, '../../../ui/desktop/package.json'));
const { JSDOM, VirtualConsole } = requireUI('jsdom');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, 'cards.fragment.html'),'utf8');
const errors=[];
const vc = new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(source,{runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.openai={widgetState:{},setWidgetState:()=>Promise.resolve()};}});
const w=dom.window,d=w.document,root=d.querySelector('#township-card-lab');
function click(el){assert.ok(el,'Expected interactive element');el.click();}
function route(name){click(root.querySelector('.g-nav [data-route="'+name+'"]'));}
function open(id,tab){route(['notice'].includes(id)?'recipes':id==='archive-mcp'?'extensions':id==='checklist-app'?'apps':id==='profile'?'settings':id==='civic-theme'?'themes':'home');const button=root.querySelector('[data-open="'+id+'"]');assert.ok(button,id);click(button);if(tab)click(root.querySelector('[data-detail-tab="'+tab+'"]'));}
const expected={recipes:6,skills:6,apps:6,extensions:7,schedules:3,history:3,themes:1,settings:4};
let total=0;
for(const [section,count] of Object.entries(expected)){
 route(section);let ids=[...root.querySelectorAll('[data-card-id]')].map(e=>e.dataset.cardId);assert.equal(ids.length,count,section);
 for(const id of ids){
  click(root.querySelector('[data-card-id="'+id+'"] .g-card-open'));
  assert.ok(root.querySelector('.g-detail-hero h1').textContent.trim());
  for(const tab of [...root.querySelectorAll('[data-detail-tab]')].map(e=>e.dataset.detailTab)){
   click(root.querySelector('[data-detail-tab="'+tab+'"]'));
   assert.ok(root.querySelector('.g-detail-columns>section').textContent.trim().length>10,id+' '+tab);
  }
  click(root.querySelector('#g-detail-back'));
  assert.equal(root.querySelectorAll('[data-card-id]').length,count,section+' back');total++;
 }
}
route('recipes');const query=root.querySelector('#g-search');query.value='档案';query.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(root.querySelectorAll('[data-card-id]').length,1);
route('recipes');click(root.querySelector('[data-favorite="notice"]'));click(root.querySelector('[data-filter="我的收藏"]'));assert.equal(root.querySelectorAll('[data-card-id]').length,1);
open('notice','use');let form=root.querySelector('[data-form="recipe"]');form.elements.subject.value='核对示例 <img src=x>';form.elements.context.value='请整理本次会议议定事项。';click(form.querySelector('[data-local-submit]'));assert.ok(form.querySelector('[data-result]').textContent.includes('核对示例 <img src=x>'));assert.equal(form.querySelectorAll('img').length,0);
open('archive-mcp','tools');assert.equal(root.querySelectorAll('[data-tool]').length,5);click(root.querySelector('[data-tool="0"]'));assert.ok(root.querySelector('.g-tool p').textContent.includes('query: string'));
click(root.querySelector('[data-detail-tab="configure"]'));form=root.querySelector('[data-form="extension"]');click(form.querySelector('[data-local-submit]'));assert.ok(root.querySelector('[data-feedback]').textContent.includes('未写入正式 Goose'));click(root.querySelector('[data-action="check-connection"]'));assert.ok(root.querySelector('[data-feedback]').textContent.includes('未发起网络请求'));
open('checklist-app','preview');let check=root.querySelector('[data-check="material-0"]');click(check);assert.ok(root.querySelector('#g-check-status').textContent.includes('1 / 7'));click(root.querySelector('#g-detail-back'));open('checklist-app','preview');assert.equal(root.querySelector('[data-check="material-0"]').checked,true);
open('profile');form=root.querySelector('[data-form="profile"]');form.elements.name.value='李主任';click(form.querySelector('[data-local-submit]'));assert.equal(root.querySelector('#g-account-name').textContent,'李主任');
click(root.querySelector('#g-account-trigger'));assert.equal(root.querySelector('#g-account-menu').hidden,false);root.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(root.querySelector('#g-account-menu').hidden,true);
open('civic-theme');click(root.querySelector('[data-appearance="dark"]'));assert.equal(root.dataset.appearance,'dark');click(root.querySelector('[data-appearance="light"]'));assert.equal(root.dataset.appearance,'light');
assert.deepEqual(errors,[]);
console.log(JSON.stringify({cardsOpened:total,sections:Object.keys(expected).length,checks:['all card details and tabs','back navigation','search','favorites','recipe form and escaping','five real MCP tool descriptions','configuration without network','checklist state','profile editing','account popup and Escape','Light / Dark'],scriptErrors:errors},null,2));
