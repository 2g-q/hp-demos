// Hand-authored anonymous examples. No customer record is imported here.
// Null means a verified empty source cell; omitted/invalid values are rejected.
export const billingExample = [
  {id:'example-a',row:4,name:'業務A',code:'C1',s:120000,v:100000,w:20000,x:0,y:0},
  {id:'example-b',row:5,name:'業務B',code:'C99',s:40000,v:30000,w:0,x:10000,y:0},
  {id:'example-c',row:6,name:'業務C',code:'C2',s:55000,v:50000,w:0,x:0,y:5000}
];
export const costExample = [
  {id:'example-a',name:'業務A',formulaCell:'08.03!D41',cells:Array.from({length:93},(_,i)=>i<2?['作業記録A','作業記録B'][i]:null),external:10000},
  {id:'example-b',name:'業務B',formulaCell:'08.03!Q41',cells:Array.from({length:124},(_,i)=>i<2?['作業記録C','作業記録D'][i]:null),external:0}
];
