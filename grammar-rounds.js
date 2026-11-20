/* Extra practice examples; these do not alter the protected LWL tests. */
const grammarAdd=(key,rows)=>{GRAMMAR[key].tasks.push(...rows.map(([q,a,accept])=>({q,a,...(accept?{accept}:{} )})));};
const grammarPairs=(key,source,templates)=>grammarAdd(key,source.flatMap(([word,answer])=>templates.map(t=>[t.replaceAll('{x}',word),answer])));

grammarPairs('plural',[
 ['pencil','pencils'],['desk','desks'],['bus','buses'],['dish','dishes'],['watch','watches'],['city','cities'],['story','stories'],['day','days'],['key','keys'],['toy','toys'],['man','men'],['mouse','mice'],['person','people'],['tooth','teeth'],['sheep','sheep'],['fish','fish']
],['one {x} – two ___','I have three ___ . (plural of {x})']);

grammarAdd('articles',[
 ['I can see ___ dog in the park.','a'],['She has ___ umbrella.','an'],['He eats ___ apple after school.','an'],['This is ___ old photo.','an'],['Ben has ___ new bike.','a'],['We need ___ pencil.','a'],['Mia wears ___ orange jacket.','an'],['There is ___ egg on the table.','an'],['I have ___ idea.','an'],['I can hear ___ bird outside.','a'],['This is ___ interesting book.','an'],['The teacher says: “Open ___ window, please.”','the'],['We visited a zoo. ___ zoo was very big.','The'],['I bought a book. ___ book is funny.','The'],['Mia has a cat. ___ cat is black.','The'],['Please turn off ___ light in this room.','the'],['Look at ___ picture on this page.','the'],['We saw a film. ___ film was exciting.','The'],['I am ___ student.','a'],['She is ___ artist.','an'],['He has ___ blue bag.','a'],['There is ___ elephant in the picture.','an']
]);

grammarAdd('imperative',[
 ['___ the door, please. (schließen)','Close'],['___ your hand if you know. (heben)','Raise'],['___ the board, please. (ansehen)','Look at'],['___ your partner. (fragen)','Ask'],['___ the answer down. (aufschreiben)','Write'],['___ carefully to the story. (zuhören)','Listen'],['___ your books on the desk. (legen)','Put'],['___ a short break. (machen)','Take'],['___ your name at the top. (schreiben)','Write'],['___ the instructions first. (lesen)','Read'],['___ after the teacher. (wiederholen)','Repeat'],['___ the words in your notebook. (notieren)','Copy'],['___ your bag here. (hinstellen)','Put'],['___ late for class. (nicht sein)',"Don't be",["Don't be",'Do not be']],['___ your friend. (nicht unterbrechen)',"Don't interrupt",["Don't interrupt",'Do not interrupt']],['___ the answer yet. (nicht sagen)',"Don't say",["Don't say",'Do not say']],['___ the window, please. (öffnen)','Open'],['___ the question again. (lesen)','Read'],['___ in pairs. (arbeiten)','Work'],['___ a sentence with this word. (schreiben)','Write'],['___ your notebook. (mitbringen)','Bring'],['___ at the picture. (schauen)','Look']
]);

const pronounPeople=[['Anna','She'],['Lena','She'],['Paul','He'],['Tom','He'],['The dog','It'],['The car','It'],['My parents','They'],['The girls','They'],['Ben and Mia','They'],['My brother and I','We'],['My friends and I','We']];
grammarAdd('pronouns',pronounPeople.flatMap(([name,answer])=>[[`${name} is here. ___ is ready.`,answer],[`${name} likes music. ___ listens every day.`,answer]]));

const beSubjects=[['I','am'],['You','are'],['He','is'],['She','is'],['It','is'],['We','are'],['They','are'],['Mia','is'],['My friends','are'],['The children','are']];
grammarAdd('be',beSubjects.flatMap(([subject,form])=>['at home','happy today','in the classroom'].map(end=>[`${subject} ___ ${end}.`,form])));
grammarAdd('be_negative',beSubjects.flatMap(([subject,form])=>['at school today','ready yet','in the garden'].map(end=>[`${subject} ___ ${end}. (not)`,form==='am'?'am not':form==='is'?"isn't":"aren't",form==='is'?["isn't",'is not']:form==='are'?["aren't",'are not']:['am not',"'m not"]])));
grammarAdd('be_questions',beSubjects.flatMap(([subject,form])=>['at home','ready for school','in the classroom'].map(end=>[`___ ${subject==='I'?'I':subject==='Mia'?'Mia':subject.toLowerCase()} ${end}?`,form[0].toUpperCase()+form.slice(1)])));

const owners=[['Ben',"Ben's"],['Mia',"Mia's"],['Lucy',"Lucy's"],['Dad',"Dad's"],['Grandma',"Grandma's"],['my sister',"my sister's"],['the children',"the children's"],['the students',"the students'"]];
grammarAdd('possessive_s',owners.flatMap(([owner,answer])=>['bag','book','bike'].map(thing=>[`This is ___ ${thing}. (${owner})`,answer])));

const thereItems=[['a lamp','There is'],['a chair','There is'],['a desk','There is'],['a cat','There is'],['two posters','There are'],['three books','There are'],['many windows','There are'],['four pencils','There are']];
grammarAdd('there',thereItems.flatMap(([item,answer])=>[[`___ ${item} in the room.`,answer],[`___ ${item} near the door.`,answer],[`___ ${item} on this page.`,answer]]));

grammarAdd('question_words',[
 ['___ is your teacher? (Person)','Who'],['___ is the library? (Ort)','Where'],['___ is your favourite sport? (Sache)','What'],['___ do you go to bed? (Zeit)','When'],['___ do you like this story? (Grund)','Why'],['___ old is your brother?','How'],['___ many books do you have?','How'],['___ is your best friend? (Person)','Who'],['___ do you have English? (Zeit)','When'],['___ is your school? (Ort)','Where'],['___ do you eat for lunch? (Sache)','What'],['___ are you laughing? (Grund)','Why'],['___ tall are you?','How'],['___ often do you play football?','How'],['___ can help us? (Person)','Who'],['___ is the bus stop? (Ort)','Where'],['___ is this word in English? (Sache)','What'],['___ does the film start? (Zeit)','When'],['___ is the dog hiding? (Ort)','Where'],['___ did you choose this book? (Grund)','Why'],['___ far is the park?','How'],['___ is the next lesson? (Zeit)','When']
]);

grammarAdd('prep',[
 ['The library is ___ the school and the park.','between'],['The shop is ___ the museum. (gegenüber)','opposite'],['The bus stop is ___ the cinema. (neben)','next to'],['Walk ___ the bridge to the other side.','over'],['The train goes ___ the tunnel.','through'],['Walk ___ the river for five minutes.','along'],['Turn right ___ the corner.','at'],['The café is ___ your left.','on'],['Go straight on ___ you see the church.','until'],['Turn left ___ Park Street.','into'],['The teacher stands ___ the door. (neben)','next to'],['The cinema is ___ the market and the bank.','between'],['The school is ___ the sports centre. (gegenüber)','opposite'],['Walk ___ the road at the traffic lights. (über)','across'],['Go ___ the tunnel to the park.','through'],['We walk ___ the beach. (entlang)','along'],['Turn left ___ the traffic lights.','at'],['The shop is ___ the right.','on'],['Keep going ___ the next crossing.','until'],['Go ___ the first street on the left.','into'],['The station is ___ the bakery. (neben)','next to'],['The park is ___ the school. (gegenüber)','opposite']
]);

grammarAdd('place_time',[
 ['We play ___ the garden after lunch.','in'],['The children meet ___ the library at four.','at'],['Mia swims ___ the pool on Sunday.','at'],['We are ___ the park in the morning.','in'],['Ben waits ___ the station at six.','at'],['They eat ___ the café at noon.','at'],['My friend is ___ the classroom on Monday.','in'],['We practise ___ the sports centre after school.','at'],['Put in order: at five / We meet / at the station.','We meet at the station at five'],['Put in order: on Tuesday / Mia plays / in the park.','Mia plays in the park on Tuesday'],['Put in order: after school / They read / in the library.','They read in the library after school'],['Put in order: at seven / Ben eats / at home.','Ben eats at home at seven'],['Put in order: at noon / We eat / at the café.','We eat at the café at noon'],['Put in order: on Friday / I swim / at the pool.','I swim at the pool on Friday'],['Put in order: in the morning / We meet / in the garden.','We meet in the garden in the morning'],['Put in order: at eight / The lesson starts / at school.','The lesson starts at school at eight'],['Put in order: after lunch / They play / in the garden.','They play in the garden after lunch'],['Put in order: on Sunday / She runs / in the park.','She runs in the park on Sunday'],['Put in order: at four / We wait / at the station.','We wait at the station at four'],['Put in order: in the evening / He reads / at home.','He reads at home in the evening'],['Put in order: on Monday / I practise / at school.','I practise at school on Monday'],['Put in order: at six / They meet / at the cinema.','They meet at the cinema at six']
]);

grammarAdd('directions',[
 ['___ right at the next street.','Turn'],['___ straight on to the park.','Go'],['___ the road at the crossing.','Cross'],['Walk ___ the river to the bridge.','along'],['Go ___ the tunnel.','through'],['Walk ___ the bridge.','over'],['The station is ___ your right.','on'],['Go straight on ___ the next corner.','until'],['___ left at the church.','Turn'],['___ past the school.','Go'],['___ the first street on the left. (einbiegen)','Take'],['Walk ___ the park. (durch)','through'],['Go ___ the roundabout.','round',['round','around']],['The café is ___ the library. (neben)','next to'],['The market is ___ the church. (gegenüber)','opposite'],['___ the road at the traffic lights.','Cross'],['___ straight on for two minutes.','Go'],['Turn right ___ the station.','at'],['Walk ___ the road for five minutes.','along'],['Go ___ King Street. (hinein)','into'],['The museum is ___ your left.','on'],['Go straight on ___ you reach the bus stop.','until']
]);

const gerundVerbs=[['play','playing','football'],['read','reading','comics'],['listen','listening','to music'],['run','running','outside'],['take','taking','photos'],['dance','dancing','on stage'],['swim','swimming','in the pool'],['draw','drawing','animals'],['write','writing','stories'],['make','making','cakes'],['ride','riding','a bike'],['sit','sitting','in the garden']];
grammarAdd('gerund',gerundVerbs.flatMap(([verb,form,rest])=>[['I like ___ '+rest+'. ('+verb+')',form],['They enjoy ___ '+rest+'. ('+verb+')',form]]));

const frequency=[['immer','always'],['oft','often'],['manchmal','sometimes'],['gewöhnlich','usually'],['nie','never']];
grammarAdd('frequency',frequency.flatMap(([de,en])=>['I ___ read before bed.','We ___ meet after school.','They ___ play games on Saturdays.','Ben is ___ late.'].map(q=>[q+' ('+de+')',en])));

grammarAdd('frequency', [['We are ___ ready. (immer)','always'],['She is ___ tired. (manchmal)','sometimes'],['I am ___ late. (nie)','never'],['They ___ practise English. (gewöhnlich)','usually']]);

const clockNumbers=[['6:00','six',"o'clock"],['8:00','eight',"o'clock"],['9:00','nine',"o'clock"],['10:00','ten',"o'clock"],['6:15','six','past'],['8:15','eight','past'],['9:30','nine','past'],['10:30','ten','past'],['6:45','seven','to'],['8:45','nine','to'],['9:45','ten','to'],['10:45','eleven','to'],['6:10','six','past'],['8:20','eight','past'],['9:25','nine','past'],['10:05','ten','past'],['6:50','seven','to'],['8:40','nine','to'],['9:35','ten','to'],['10:55','eleven','to'],['11:15','eleven','past'],['12:45','one','to']];
grammarAdd('clock',clockNumbers.map(([time,hour,answer])=>[`${time} = ${time.endsWith(':00')?hour+' ___':time.endsWith(':15')?'quarter ___ '+hour:time.endsWith(':30')?'half ___ '+hour:time.endsWith(':45')?'quarter ___ '+hour:time.endsWith(':05')?'five ___ '+hour:time.endsWith(':10')?'ten ___ '+hour:time.endsWith(':20')?'twenty ___ '+hour:time.endsWith(':25')?'twenty-five ___ '+hour:time.endsWith(':35')?'twenty-five ___ '+hour:time.endsWith(':40')?'twenty ___ '+hour:time.endsWith(':50')?'ten ___ '+hour:'five ___ '+hour}.`,answer]));

// More natural subjects for the existing Simple Past banks.
for(const key of ['simple_past','simple_past_negative']){
 const original=GRAMMAR[key].tasks.slice();
 GRAMMAR[key].tasks.push(...original.map(t=>({q:t.q.replace(/\bI\b/g,'Mia').replace(/\bmy\b/g,'her'),a:t.a.replace(/^I\b/,'Mia'),...(t.accept?{accept:t.accept.map(a=>a.replace(/^I\b/,'Mia'))}:{})})));
}
GRAMMAR.simple_past_was.tasks.push(...GRAMMAR.simple_past_was.tasks.map(t=>({...t,q:t.q.replace('Yesterday','Last week').replace('happy','excited').replace('at home','at school').replace('tired','busy')})));
grammarAdd('directions',[
 ['___ right after the bridge.','Turn'],['___ straight on past the bank.','Go'],['The playground is ___ the school. (hinter)','behind'],['Walk ___ the square. (über)','across']
]);
for(const g of Object.values(GRAMMAR))g.tasks=[...new Map(g.tasks.map(t=>[t.q,t])).values()];
