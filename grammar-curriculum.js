/* Short, familiar contexts built from the vocabulary in the current or earlier units.
   These replace older generic examples; protected LWL test questions are separate. */
const curriculumTasks=(rows)=>rows.map(([q,a,accept])=>({q,a,...(accept?{accept}:{})}));

const schoolNouns=[['book','books'],['class','classes'],['boy','boys'],['girl','girls'],['teacher','teachers'],['friend','friends'],['pen','pens'],['pencil','pencils'],['bag','bags'],['folder','folders'],['lesson','lessons'],['subject','subjects'],['bike','bikes'],['cat','cats'],['game','games'],['school','schools']];
GRAMMAR.plural.tasks=curriculumTasks(schoolNouns.flatMap(([one,many])=>[[`one ${one} – two ___`,many],[`We have three ___ . (plural of ${one})`,many]]));

GRAMMAR.articles.tasks=curriculumTasks([
 ['I have ___ book.','a'],['Mia has ___ pen.','a'],['There is ___ cat in the classroom.','a'],['Ben has ___ bag.','a'],['I have ___ pencil.','a'],['This is ___ new teacher.','a'],['We play ___ game.','a'],['He has ___ bike.','a'],['There is ___ folder on the desk.','a'],['She has ___ friend in our class.','a'],
 ['I have ___ English book.','an'],['This is ___ interesting lesson.','an'],['We have ___ art lesson.','an'],['Mia has ___ exercise book.','an'],['They do ___ experiment in science.','an'],['This is ___ easy game.','an'],['Ben has ___ IT lesson.','an'],['There is ___ office at school.','an'],['She has ___ English teacher.','an'],['I have ___ art book.','an'],
 ['I have a book. ___ book is new.','The'],['Mia has a bag. ___ bag is big.','The'],['Please close ___ classroom door.','the'],['Ben has a bike. ___ bike is new.','The'],['We are in the classroom. Open ___ door, please.','the'],['I have a pencil. ___ pencil is in my bag.','The'],['We play a game. ___ game is fun.','The'],['Mia has a cat. ___ cat is small.','The'],['Look at ___ board in our classroom.','the'],['I like English. ___ lesson is fun.','The']
]);

GRAMMAR.imperative.tasks=curriculumTasks([
 ['___ your book, please. (öffnen)','Open'],['___ the door, please. (schließen)','Close'],['___ to your teacher. (zuhören)','Listen'],['___ at the board. (anschauen)','Look'],['___ your name here. (schreiben)','Write'],['___ down, please. (hinsetzen)','Sit'],['___ quiet, please. (sein)','Be'],['___ out your book. (herausnehmen)','Take'],['___ your teacher. (fragen)','Ask'],['___ your friend. (helfen)','Help'],['___ here, please. (anhalten)','Stop'],['___ to the classroom. (gehen)','Go'],['___ your pencil case. (öffnen)','Open'],['___ your exercise book. (schließen)','Close'],['___ to the music. (zuhören)','Listen'],['___ at the picture. (anschauen)','Look'],['___ the answer in your book. (schreiben)','Write'],['___ down in the classroom. (hinsetzen)','Sit'],['___ your teacher a question. (fragen)','Ask'],['___ the book in your bag. (finden)','Find'],['___ a film of your school. (machen)','Make'],['___ the game again. (spielen)','Play'],['___ at your teacher. (anschauen)','Look'],['___ your friend. (fragen)','Ask'],['___ the classroom door. (öffnen)','Open'],['___ your folder, please. (schließen)','Close'],['___ out your pencil. (herausnehmen)','Take'],['___ your bag. (nehmen)','Take'],['___ your name on the board. (schreiben)','Write'],['___ quiet in the library. (sein)','Be']
]);

const pupilPronouns=[['Mia','She','is'],['Ben','He','is'],['the boy','He','is'],['the girl','She','is'],['the cat','It','is'],['the book','It','is'],['the boys','They','are'],['the girls','They','are'],['Mia and Ben','They','are'],['Ben and I','We','are']];
GRAMMAR.pronouns.tasks=curriculumTasks(pupilPronouns.flatMap(([name,answer,be])=>[[`${name} ${be} here. ___ ${be} in the classroom.`,answer],[`${name} ${be} at school. ___ ${be} in the classroom.`,answer],[`${name} ${be} new. ___ ${be} at school.`,answer]]));

const familyOwners=[['Ben',"Ben's"],['Mia',"Mia's"],['Dad',"Dad's"],['Grandma',"Grandma's"],['my sister',"my sister's"],['my brother',"my brother's"],['the children',"the children's"],['the boys',"the boys'"],['the girls',"the girls'"],['my parents',"my parents'"]];
GRAMMAR.possessive_s.tasks=curriculumTasks(familyOwners.flatMap(([owner,answer])=>['bag','bike','book'].map(thing=>[`This is ___ ${thing}. (${owner})`,answer])));

GRAMMAR.question_words.tasks=curriculumTasks([
 ['___ is your teacher?','Who'],['___ is Mia?','Who'],['___ is in the kitchen?','Who'],['___ has a bike?','Who'],['___ is in your class?','Who'],
 ['___ do you live?','Where'],['___ is your bag?','Where'],['___ is the library?','Where'],['___ is the cat?','Where'],['___ are my books?','Where'],
 ['___ is your name?','What'],['___ is in your bag?','What'],['___ do you like?','What'],['___ is on the table?','What'],['___ subject do you like?','What'],
 ['___ is your birthday?','When'],['___ do you have English?','When'],['___ do you go home?','When'],['___ is your art lesson?','When'],['___ do you have lunch?','When'],
 ['___ are you happy?','Why'],['___ do you like music?','Why'],['___ is Ben at home?','Why'],['___ is the cat in the garden?','Why'],['___ do you like art?','Why'],
 ['___ old are you?','How'],['___ many books do you have?','How'],['___ is your mum?','How'],['___ many cats are there?','How'],['___ do you go to school?','How']
]);

GRAMMAR.there.tasks=curriculumTasks([
 ['___ a bed in my room.','There is'],['___ a book on the table.','There is'],['___ a cat in the garden.','There is'],['___ a bag in the hall.','There is'],['___ a sofa in the living room.','There is'],['___ a pencil in my bag.','There is'],['___ a picture on the shelf.','There is'],['___ a table in the kitchen.','There is'],['___ a box under the bed.','There is'],['___ a dog at home.','There is'],['___ a bathroom in the house.','There is'],['___ a book on my desk.','There is'],['___ a snack in the kitchen.','There is'],['___ a cat under the table.','There is'],['___ a photo in my room.','There is'],
 ['___ two books on the shelf.','There are'],['___ three pencils in my bag.','There are'],['___ two cats in the garden.','There are'],['___ four bags in the hall.','There are'],['___ two pictures in my room.','There are'],['___ three books on the table.','There are'],['___ two beds in the bedroom.','There are'],['___ four pencils on the desk.','There are'],['___ two boxes under the bed.','There are'],['___ three photos on the shelf.','There are'],['___ two dogs in the garden.','There are'],['___ four books in my bag.','There are'],['___ three snacks in the kitchen.','There are'],['___ two tables in the dining room.','There are'],['___ two girls in the hall.','There are']
]);

const easyGerunds=[['play','playing','football'],['read','reading','a book'],['watch','watching','TV'],['take','taking','photos'],['draw','drawing','pictures'],['dance','dancing','at the club'],['cook','cooking','dinner'],['go','going','swimming'],['go','going','cycling'],['chat','chatting','with friends'],['text','texting','a friend'],['tidy','tidying','the room'],['run','running','in the garden'],['make','making','a film'],['visit','visiting','grandma']];
GRAMMAR.gerund.tasks=curriculumTasks(easyGerunds.flatMap(([verb,form,rest])=>[[`I like ___ ${rest}. (${verb})`,form],[`Mia likes ___ ${rest}. (${verb})`,form]]));

// Preserve the grammar target while removing unfamiliar context words from other pools.
const familiarWords=[
 ['be',[/my partner/g,'my friend'],[/Mr Green/g,'Mr Brown']],
 ['be_negative',[/ready yet/g,'happy today']],
 ['be_questions',[/ready for school/g,'at school'],[/from Germany/g,'at home'],[/downstairs/g,'big'],[/right room/g,'room'],[/your parents at school/g,'your parents at home'],[/at work/g,'at school']],
 ['frequency',[/tennis/g,'football'],[/in winter/g,'on Sunday'],[/meet after school/g,'play after school'],[/ready/g,'happy']],
 ['prep',[/bank/g,'shop'],[/the beach/g,'the river'],[/King Street/g,'Park Street']],
 ['directions',[/bank/g,'shop'],[/the square/g,'the park'],[/King Street/g,'Park Street']],
 ['simple_past',[/rainbow/g,'bird'],[/postcard/g,'my name'],[/story/g,'book']],
 ['simple_past_negative',[/rainbow/g,'bird'],[/postcard/g,'my name'],[/story/g,'book']]
];
for(const [key,...replacements] of familiarWords)GRAMMAR[key].tasks=GRAMMAR[key].tasks.map(t=>{
 const change=s=>replacements.reduce((text,[from,to])=>text.replace(from,to),s);
 return {...t,q:change(t.q),...(key.startsWith('simple_past')?{a:change(t.a),...(t.accept?{accept:t.accept.map(change)}:{})}:{})};
});
for(const g of Object.values(GRAMMAR))g.tasks=[...new Map(g.tasks.map(t=>[t.q,t])).values()];
