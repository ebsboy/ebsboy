(function(root){
'use strict';
const VERSION='소담 경영 자가진단 v1.1';
const clamp=x=>Math.min(1,Math.max(0,x));
const demo={name:'온기 베이커리',sector:'음식·카페',region:'서울 마포구',months:48,employees:3,sales:3600,previous:3200,cost:2700,cash:5000,debt:250,repeat:48,overdue:'no',books:2,review:1,digital:1};
function validate(d){
 const errors={};
 if(!String(d.name||'').trim())errors.name='상호명을 입력해주세요.';
 for(const k of ['months','employees','sales','previous','cost','cash','debt','repeat']){
 if(!['string','number'].includes(typeof d[k])||String(d[k]).trim()===''||!Number.isFinite(Number(d[k]))||Number(d[k])<0)errors[k]='0 이상의 숫자를 입력해주세요.';
 }
 for(const k of ['sales','previous','cost','cash','debt'])if(Number(d[k])>1e9||(Number(d[k])>0&&Number(d[k])<.01))errors[k]='0 또는 0.01~1,000,000,000만원 범위로 입력해주세요.';
 for(const k of ['months','employees'])if(!Number.isInteger(Number(d[k])))errors[k]='0 이상의 정수로 입력해주세요.';
 if(Number(d.employees)>1000000)errors.employees='직원 수를 1,000,000명 이하로 입력해주세요.';
 if(Number(d.repeat)>100)errors.repeat='0~100% 범위로 입력해주세요.';
 if(Number(d.months)>1200)errors.months='영업 기간을 1,200개월 이하로 입력해주세요.';
 for(const k of ['books','review','digital'])if(!['0','1','2',0,1,2].includes(d[k]))errors[k]='실행 수준을 선택해주세요.';
 if(!['yes','no'].includes(d.overdue))errors.overdue='연체 여부를 선택해주세요.';
 return errors;
}
// 점수에는 영향을 주지 않는 입력 확인용 안내입니다. 단위 착오(원/만원)나 비정상적인 조합을 알려줍니다.
function warnings(d){
 const n=k=>Number(d[k]),w={};
 for(const k of ['sales','previous','cost','cash','debt'])if(n(k)>=100000)w[k]='10억원 이상입니다. 원 단위가 아닌 만원 단위로 입력했는지 확인해주세요.';
 if(!w.cost&&n('sales')>0&&n('cost')>n('sales')*2)w.cost='영업비용이 매출의 2배를 넘습니다. 월평균 금액이 맞는지 확인해주세요.';
 if(!w.cost&&n('sales')===0&&n('cost')>0)w.sales='매출이 0이면 영업 수익성은 0점으로 계산됩니다.';
 if(!w.previous&&n('previous')>0&&n('sales')>0&&(n('sales')/n('previous')>5||n('previous')/n('sales')>5))w.previous='현재 매출과 5배 이상 차이가 납니다. 같은 기간의 월평균인지 확인해주세요.';
 if(n('months')>0&&n('months')<12&&n('previous')>0)w.previous='영업 기간이 12개월 미만이면 전년 동기 매출이 없을 수 있습니다. 없다면 0을 입력하세요.';
 return w;
}
function evaluate(d){
 const errors=validate(d);if(Object.keys(errors).length)return {errors};
 const n=k=>Number(d[k]);const profit=n('sales')-n('cost');
 const margin=n('sales')?profit/n('sales'):0;
 const out=n('cost')+n('debt');const runway=out?n('cash')/out:null;
 const cover=n('debt')?Math.max(0,profit)/n('debt'):null;
 const growth=n('previous')?(n('sales')-n('previous'))/n('previous'):null;
 const items=[
 {key:'margin',group:0,label:'영업 수익성',max:15,score:15*clamp(margin/.2),tip:'주요 상품의 원가와 판매가를 점검하고, 마진이 높은 상품의 판매 비중을 늘려보세요.',action:'상품별 원가 점검',context:'영업이익률 20%를 자체 기준으로 사용합니다.'},
 {key:'cash',group:0,label:'현금 여력',max:10,score:runway===null?10:10*clamp(runway/3),tip:'월 영업비용과 원리금의 3개월분을 목표로, 매주 일정 금액을 운영 예비비로 확보해보세요.',action:'운영 예비비 확보',context:'영업비용과 원리금 3개월분을 목표로 계산합니다.'},
 {key:'debt',group:0,label:'원리금 상환 여력',max:10,score:cover===null?10:10*clamp(cover/1.5),tip:'원리금 상환일과 월별 현금 유입을 정리하고, 상환 부담을 미리 점검해보세요.',action:'상환 일정 점검',context:'영업이익 ÷ 월 원리금 1.5배를 자체 기준으로 사용합니다.'},
 {key:'growth',group:1,label:'매출 증감',max:25,score:growth===null?null:25*clamp((growth+.2)/.4),tip:'최근 방문 고객의 재구매를 유도하고, 판매 채널별 매출 변화를 매주 확인해보세요.',action:'재방문 매출 늘리기',context:'증감률 −20%에서 0점, +20%에서 25점입니다.'},
 {key:'months',group:2,label:'사업 지속 기간',max:10,score:10*clamp(n('months')/60),tip:'월별 매출과 고객 반응을 꾸준히 기록해 우리 가게의 운영 패턴을 쌓아가세요.',action:'운영 기록 쌓기',context:'60개월 이상 운영 시 10점입니다.'},
 {key:'repeat',group:2,label:'단골 매출 비중',max:10,score:10*clamp(n('repeat')/60),tip:'단골 고객을 위한 재방문 혜택을 만들고, 월별 단골 매출 비중을 확인해보세요.',action:'단골 고객 관리',context:'단골 매출 비중 60% 이상에서 10점입니다.'},
 {key:'overdue',group:2,label:'최근 12개월 연체',max:5,score:d.overdue==='no'?5:0,tip:'미납 내역과 납부 일정을 한곳에 정리하고, 반복되는 연체 원인을 먼저 해결해보세요.',action:'연체 내역 정리',context:'대출·세금·임차료 연체 없음 5점, 있음 0점입니다.'},
 ...[['books','장부 관리','주 1회 매출·비용 기록을 정리해 실제 현금 흐름을 확인해보세요.','주간 장부 정리'],['review','정기 비용 점검','월 1회 고정비와 구독료를 살펴보고, 줄일 수 있는 지출을 정리해보세요.','월간 비용 점검'],['digital','온라인 고객관리','지도·SNS·온라인 리뷰 중 한 채널을 정해 고객 문의와 후기를 정기적으로 관리해보세요.','온라인 고객관리 루틴']].map(([key,label,tip,action])=>({key,group:3,label,max:5,score:n(key)*2.5,tip,action,context:'정기 실행 5점, 비정기 실행 2.5점, 미실행 0점입니다.'}))
 ];
 const groups=['재무건전성','매출성장성','사업안정성','운영역량'].map((name,i)=>({name,max:[35,25,25,15][i],score:items.filter(x=>x.group===i).some(x=>x.score===null)?null:items.filter(x=>x.group===i).reduce((s,x)=>s+x.score,0)}));
 // 전년 매출이 없으면(신규 창업 등) 매출성장성을 제외한 75점을 100점으로 환산하고 '잠정'으로 표시합니다.
 const provisional=growth===null;
 const scored=groups.filter(x=>x.score!==null);
 const raw=scored.reduce((s,x)=>s+x.score,0)/scored.reduce((s,x)=>s+x.max,0)*100;const score=Math.round(raw);
 const grade=raw>=85?{letter:'A',label:'안정',color:'#3b9574'}:raw>=70?{letter:'B',label:'양호',color:'#7661d9'}:raw>=55?{letter:'C',label:'보완',color:'#b48627'}:raw>=40?{letter:'D',label:'주의',color:'#cf7b37'}:{letter:'E',label:'우선점검',color:'#c25a59'};
 if(provisional)grade.label+=' (잠정)';
 const priorities=items.filter(x=>x.score!==null&&x.score<x.max).sort((a,b)=>a.score/a.max-b.score/b.max).slice(0,3);
 return {version:VERSION,score,raw,provisional,grade,groups,items,priorities,margin,runway,cover,growth,profit,warnings:warnings(d),errors:{}};
}
const api={VERSION,demo,validate,warnings,evaluate};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SodamModel=api;
})(typeof window!=='undefined'?window:globalThis);
