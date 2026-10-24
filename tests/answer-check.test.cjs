const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../data.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../answer-check.js'),'utf8')+';globalThis.check=AnswerCheck',c);const a=c.check;
test('articles, alternatives, infinitives, spelling conventions and common synonyms',()=>{
 for(const [input,target] of [['bus stop','the bus stop'],['the bus stop','bus stop'],['buy','to buy'],['to buy','buy'],['center','centre'],['store','shop'],['parking lot','car park'],['mit dem Fahrrad','mit (dem Fahrrad)'],['Strasse','die Straße'],['die Bekleidung','die Kleider; die Kleidung; die Bekleidung']])assert.equal(a.word(input,target).points,2,input);
 assert.equal(a.word('mit','mit (dem Fahrrad)').points,0);assert.equal(a.word('by','by (bike)').points,0);
});
test('minor spelling gets partial credit without conflating different words or directions',()=>{
 assert.equal(a.word('swiming pool','swimming pool').points,1);assert.equal(a.word('suprmarket','supermarket').points,1);
 for(const [input,target] of [['light','right'],['left','right'],['quite','quiet'],['not','now'],['cat','car']])assert.equal(a.word(input,target).points,0,input);
});
test('sentence variants and contractions count, grammar changes require review',()=>{
 assert.equal(a.sentence('The museum is opposite the park!',['The museum is opposite the park.']).points,4);
 assert.equal(a.sentence("It's next to the park.",['It is next to the park.']).points,4);
 assert.equal(a.sentence('The bus stop is next to the suprmarket.',['The bus stop is next to the supermarket.']).points,3);
 assert.equal(a.sentence('He walk to school.',['He walks to school.']).kind,'review');
 assert.equal(a.sentence('The museum is near the park.',['The museum is opposite the park.']).kind,'review');
 assert.equal(a.sentence('',['Go straight on.']).kind,'incorrect');
 assert.equal(a.grammar('an',['a']),false);assert.equal(a.grammar("isn't",['is not']),true);
});
