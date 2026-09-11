import type { CEFRLevel, EnglishPracticeDocument } from '@/typings/english'

type DialogueUnit = [CEFRLevel, string, string, [string, string][]]

const units: DialogueUnit[] = [
  [
    'A1',
    'first-meeting',
    '第一次見面',
    [
      ['Hello! My name is Mia.', '你好！我叫 Mia。'],
      ['Hi, Mia. I am Ben.', '嗨，Mia。我是 Ben。'],
      ['Are you a student?', '你是學生嗎？'],
      ['Yes, I am. Are you a student, too?', '是的。你也是學生嗎？'],
      ['Yes. I am in class two.', '對。我在二班。'],
      ['I am in class two, too!', '我也在二班！'],
    ],
  ],
  [
    'A1',
    'in-class',
    '上課前的教室',
    [
      ['Is this your book?', '這是你的書嗎？'],
      ['Yes, it is. Thank you.', '對，是我的。謝謝。'],
      ['Do you have a pen?', '你有筆嗎？'],
      ['Yes. I have two pens.', '有。我有兩支筆。'],
      ['Can I use one?', '我可以用一支嗎？'],
      ['Yes. Here you are.', '可以。給你。'],
    ],
  ],
  [
    'A1',
    'family-photo',
    '看家人的照片',
    [
      ['Who is this?', '這是誰？'],
      ['She is my sister.', '她是我姊姊。'],
      ['What is her name?', '她叫什麼名字？'],
      ['Her name is Anna.', '她叫 Anna。'],
      ['Do you have a brother?', '你有兄弟嗎？'],
      ["No, I don't. I have one sister.", '沒有。我有一個姊姊。'],
    ],
  ],
  [
    'A1',
    'breakfast-table',
    '早餐桌上的選擇',
    [
      ['Do you want some bread?', '你想吃一點麵包嗎？'],
      ['Yes, please. I am hungry.', '好，麻煩你。我餓了。'],
      ['Do you like eggs?', '你喜歡吃蛋嗎？'],
      ['Yes. I eat eggs every day.', '喜歡。我每天都吃蛋。'],
      ['Tea or milk?', '要茶還是牛奶？'],
      ['Milk, please.', '請給我牛奶。'],
    ],
  ],
  [
    'A1',
    'school-bag',
    '找自己的書包',
    [
      ['Where is my bag?', '我的書包在哪裡？'],
      ['Is it the blue bag?', '是那個藍色的書包嗎？'],
      ['No. My bag is red.', '不是。我的書包是紅色的。'],
      ['Look! It is under the chair.', '看！它在椅子下面。'],
      ['Yes, that is my bag.', '對，那是我的書包。'],
      ['Your book is on the desk.', '你的書在書桌上。'],
    ],
  ],
  [
    'A1',
    'school-time',
    '今天幾點上課',
    [
      ['What time is it?', '現在幾點？'],
      ["It is eight o'clock.", '現在八點。'],
      ['Is our class at nine?', '我們的課是九點嗎？'],
      ['Yes, it is.', '對，是九點。'],
      ["Let's walk to school.", '我們走路去學校吧。'],
      ['OK. My bag is here.', '好。我的書包在這裡。'],
    ],
  ],
  [
    'A1',
    'pet-cat',
    '認識家裡的貓',
    [
      ['Do you have a cat?', '你有養貓嗎？'],
      ['Yes. His name is Max.', '有。牠叫 Max。'],
      ['Is he big?', '牠很大隻嗎？'],
      ['No, he is small and white.', '不，牠很小隻，是白色的。'],
      ['Where does he sleep?', '牠在哪裡睡覺？'],
      ['He sleeps on my bed.', '牠睡在我的床上。'],
    ],
  ],
  [
    'A1',
    'rainy-day',
    '下雨天出門',
    [
      ['Is it cold today?', '今天很冷嗎？'],
      ['Yes, and it is rainy.', '對，而且在下雨。'],
      ['Where is my coat?', '我的外套在哪裡？'],
      ['It is by the door.', '它在門旁邊。'],
      ['Do you want to walk?', '你想走路嗎？'],
      ["No. Let's take the bus.", '不想。我們搭公車吧。'],
    ],
  ],
  [
    'A1',
    'buying-apples',
    '買幾顆蘋果',
    [
      ['Hello. Do you have apples?', '你好。你們有蘋果嗎？'],
      ['Yes. We have red and green apples.', '有。我們有紅蘋果和青蘋果。'],
      ['How much is one red apple?', '一顆紅蘋果多少錢？'],
      ['It is one dollar.', '一顆一元。'],
      ['Three red apples, please.', '請給我三顆紅蘋果。'],
      ['Here you are. Three dollars, please.', '給你。請付三元。'],
    ],
  ],
  [
    'A1',
    'near-the-park',
    '公園旁邊在哪裡',
    [
      ['Where is the school?', '學校在哪裡？'],
      ['It is next to the park.', '它在公園旁邊。'],
      ['Is the park near here?', '公園離這裡近嗎？'],
      ['Yes. It is on this street.', '近。它就在這條街上。'],
      ['Can I walk there?', '我可以走路過去嗎？'],
      ['Yes. It is a short walk.', '可以。走一下就到了。'],
    ],
  ],
  [
    'A1',
    'my-room',
    '介紹我的房間',
    [
      ['This is my room.', '這是我的房間。'],
      ['It is nice! Is that your desk?', '真不錯！那是你的書桌嗎？'],
      ['Yes. I read here.', '對。我在這裡看書。'],
      ['Do you have a computer?', '你有電腦嗎？'],
      ['No, but I have many books.', '沒有，但我有很多書。'],
      ['I like your room.', '我喜歡你的房間。'],
    ],
  ],
  [
    'A1',
    'at-the-pool',
    '在游泳池聊天',
    [
      ['Can you swim?', '你會游泳嗎？'],
      ['Yes, I can. Can you?', '會。你呢？'],
      ["No, I can't.", '不會。'],
      ['My dad can help you.', '我爸爸可以幫你。'],
      ['Is he here today?', '他今天有來嗎？'],
      ['Yes. He is over there.', '有。他在那邊。'],
    ],
  ],
  [
    'A1',
    'morning-routine',
    '早上的生活',
    [
      ['When do you get up?', '你什麼時候起床？'],
      ['I get up at seven.', '我七點起床。'],
      ['Do you eat at home?', '你在家吃飯嗎？'],
      ['Yes. I have breakfast with my mum.', '對。我和媽媽一起吃早餐。'],
      ['How do you go to school?', '你怎麼去學校？'],
      ['I walk with my brother.', '我和哥哥一起走路去。'],
    ],
  ],
  [
    'A1',
    'lunch-choice',
    '選今天的午餐',
    [
      ['What do you want for lunch?', '你午餐想吃什麼？'],
      ['I want rice and chicken.', '我想吃飯和雞肉。'],
      ['Do you want soup, too?', '你也想喝湯嗎？'],
      ['Yes, please. Is the soup hot?', '好，麻煩你。湯是熱的嗎？'],
      ['Yes. It is very hot.', '對。很燙。'],
      ['OK. I can wait.', '好。我可以等一下。'],
    ],
  ],
  [
    'A1',
    'after-school',
    '放學後有點累',
    [
      ['Are you OK?', '你還好嗎？'],
      ['Yes, but I am tired.', '還好，但我很累。'],
      ['Do you want some water?', '你要喝一點水嗎？'],
      ['Yes, please. I am thirsty.', '好，麻煩你。我很渴。'],
      ["Let's sit here.", '我們坐這裡吧。'],
      ['Good idea. Thank you.', '好主意。謝謝你。'],
    ],
  ],
  [
    'A2',
    'airport-check-in',
    '在機場辦理報到',
    [
      ['Good morning. Where are you flying today?', '早安。您今天要飛去哪裡？'],
      ["I'm flying to London. Here is my passport.", '我要飛往倫敦。這是我的護照。'],
      ['Do you have any bags to check in?', '您有要托運的行李嗎？'],
      ['Yes, just this suitcase.', '有，只有這個行李箱。'],
      ['Your flight leaves from gate twelve.', '您的航班從十二號登機門出發。'],
      ["Thank you. I'll go there now.", '謝謝。我現在就過去。'],
    ],
  ],
  [
    'A2',
    'hotel-arrival',
    '抵達預訂的飯店',
    [
      ['Hello. I booked a double room for two nights.', '你好。我訂了一間雙人房，住兩晚。'],
      ['What name is the booking under?', '請問是用什麼名字訂房？'],
      ["It's under Lin. Is breakfast included?", '姓 Lin。有包含早餐嗎？'],
      ['Yes. Breakfast starts at seven in the restaurant.', '有。餐廳七點開始供應早餐。'],
      ['Great. What time do we need to check out?', '太好了。我們需要幾點退房？'],
      ['Please check out before eleven.', '請在十一點前退房。'],
    ],
  ],
  [
    'A2',
    'ordering-dinner',
    '在餐廳點晚餐',
    [
      ['Are you ready to order?', '您準備好點餐了嗎？'],
      ["Yes. I'd like the chicken with rice.", '好了。我想要雞肉飯。'],
      ['Would you like a drink with that?', '需要搭配飲料嗎？'],
      ['A glass of water, please. Does the meal come with soup?', '請給我一杯水。這份餐有附湯嗎？'],
      ['Yes, it comes with vegetable soup.', '有，附蔬菜湯。'],
      ['That sounds nice. Thank you.', '聽起來不錯。謝謝。'],
    ],
  ],
  [
    'A2',
    'trying-on-shoes',
    '試穿一雙新鞋',
    [
      ['Can I try these shoes in a size seven?', '我可以試穿這雙鞋的七號嗎？'],
      ['Of course. Would you like black or brown?', '當然。您想要黑色還是棕色？'],
      ['Brown, please. My old shoes are black.', '棕色，謝謝。我舊的鞋子是黑色的。'],
      ['Here you are. How do they feel?', '給您。穿起來感覺怎麼樣？'],
      ["They're a little small. Do you have a bigger size?", '有一點小。你們有大一點的尺寸嗎？'],
      ["Yes. I'll bring you a size eight.", '有。我拿八號給您。'],
    ],
  ],
  [
    'A2',
    'asking-directions',
    '問去博物館的路',
    [
      ['Excuse me. How do I get to the museum?', '不好意思。請問博物館怎麼走？'],
      ['Go straight and turn left at the bank.', '直走，在銀行那裡左轉。'],
      ['Is it far from here?', '離這裡遠嗎？'],
      ['No. It takes about ten minutes on foot.', '不遠。走路大約十分鐘。'],
      ['Is the entrance opposite the park?', '入口是在公園對面嗎？'],
      ["Yes. You'll see a large blue door.", '對。你會看到一扇藍色的大門。'],
    ],
  ],
  [
    'A2',
    'last-weekend',
    '聊上週末的海邊旅行',
    [
      ['What did you do last weekend?', '你上週末做了什麼？'],
      ['I went to the beach with my family.', '我和家人去了海邊。'],
      ['Did you swim in the sea?', '你有下海游泳嗎？'],
      ['No. The water was too cold, so we walked instead.', '沒有。水太冷了，所以我們改成散步。'],
      ['Was the weather good?', '天氣好嗎？'],
      ['Yes. It was sunny, and we had a picnic.', '很好。天氣晴朗，我們還野餐了。'],
    ],
  ],
  [
    'A2',
    'office-message',
    '幫同事留訊息',
    [
      ['Is Anna in the office today?', 'Anna 今天有在辦公室嗎？'],
      ["Yes, but she's in a meeting until ten.", '有，但她開會到十點。'],
      ['Could you give her a message?', '你可以幫我留個訊息給她嗎？'],
      ['Sure. What would you like to say?', '可以。你想說什麼？'],
      ['Please ask her to call me after the meeting.', '請她開完會後打電話給我。'],
      ["No problem. I'll put a note on her desk.", '沒問題。我會放張便條在她桌上。'],
    ],
  ],
  [
    'A2',
    'holiday-plans',
    '安排下個月的假期',
    [
      ['Are you going away next month?', '你下個月要出遠門嗎？'],
      ["Yes. I'm going to visit my aunt in Taipei.", '對。我要去臺北看阿姨。'],
      ['How long are you going to stay?', '你打算待多久？'],
      ["For five days. We're going to visit some museums.", '五天。我們打算去幾間博物館。'],
      ['Are you going by train?', '你要搭火車去嗎？'],
      ['Yes. I bought the tickets yesterday.', '對。我昨天買好票了。'],
    ],
  ],
  [
    'A2',
    'feeling-unwell',
    '身體不舒服時請假',
    [
      ['You look tired. Are you feeling all right?', '你看起來很累。身體還好嗎？'],
      ['Not really. I have a headache.', '不太好。我頭痛。'],
      ['Did you sleep well last night?', '你昨晚睡得好嗎？'],
      ['No. I woke up three times.', '不好。我醒了三次。'],
      ['You should go home and rest.', '你應該回家休息。'],
      ["I think so, too. I'll tell the manager.", '我也這麼想。我會跟經理說。'],
    ],
  ],
  [
    'A2',
    'sharing-housework',
    '分工整理家裡',
    [
      ['We need to clean the flat before our friends arrive.', '朋友來之前，我們需要打掃公寓。'],
      ["I'll do the dishes. Can you tidy the living room?", '我來洗碗。你可以整理客廳嗎？'],
      ['Sure. Did you take out the rubbish?', '可以。你倒垃圾了嗎？'],
      ["Not yet. I'll do that after the dishes.", '還沒。我洗完碗就去倒。'],
      ["OK. I'll put these books on the shelf.", '好。我會把這些書放到書架上。'],
      ["Thanks. We have an hour, so there's enough time.", '謝謝。我們還有一個小時，時間夠。'],
    ],
  ],
  [
    'A2',
    'cooking-soup',
    '一起煮蔬菜湯',
    [
      ['What do we need for the soup?', '煮這個湯需要什麼？'],
      ['Two potatoes, an onion, and some water.', '兩顆馬鈴薯、一顆洋蔥，還有一些水。'],
      ['Should I cut the vegetables first?', '我應該先切蔬菜嗎？'],
      ['Yes. Cut them into small pieces.', '對。把它們切成小塊。'],
      ['How long do we cook them?', '要煮多久？'],
      ['About twenty minutes. Then we can add some salt.', '大約二十分鐘。然後就可以加一點鹽。'],
    ],
  ],
  [
    'A2',
    'joining-a-club',
    '報名週末的畫畫課',
    [
      ["I'd like to join the art club.", '我想加入美術社。'],
      ['Great. Have you got any questions?', '太好了。你有什麼問題嗎？'],
      ['When does the club meet?', '社團什麼時候聚會？'],
      ['Every Saturday morning, from nine to eleven.', '每週六早上九點到十一點。'],
      ['Do I need to bring my own pencils?', '我需要自己帶鉛筆嗎？'],
      ['Yes, and a notebook. We have paper here.', '需要，也要帶筆記本。我們這裡有紙。'],
    ],
  ],
  [
    'A2',
    'homework-help',
    '請同學解釋作業',
    [
      ['Did you understand the homework?', '你有看懂作業嗎？'],
      ['Most of it. Which question is difficult?', '大部分懂。哪一題比較難？'],
      ["Number four. I don't know this word.", '第四題。我不認識這個字。'],
      ["Let's look it up in the dictionary.", '我們查一下字典吧。'],
      ['Oh, now I understand. Can we read the sentence again?', '喔，我現在懂了。我們可以再讀一次句子嗎？'],
      ['Of course. Then you can write your answer.', '當然。接著你就可以寫答案了。'],
    ],
  ],
  [
    'A2',
    'phone-call',
    '打電話約見面',
    [
      ['Hello, Sam. Can you hear me?', '喂，Sam。你聽得到我嗎？'],
      ['Yes, but the train is very noisy.', '聽得到，不過火車上很吵。'],
      ['Are we still meeting at six?', '我們還是六點見面嗎？'],
      ["Yes. I'll be outside the station.", '對。我會在車站外面。'],
      ['Please send me a message when you arrive.', '你到了之後，請傳訊息給我。'],
      ['OK. See you soon!', '好。待會見！'],
    ],
  ],
  [
    'A2',
    'lost-umbrella',
    '找回公車上的雨傘',
    [
      ['I left my umbrella on the bus this morning.', '我今天早上把雨傘忘在公車上。'],
      ['Which bus did you take?', '您搭的是哪一班公車？'],
      ['The number eight bus, at about half past nine.', '八號公車，大約九點半。'],
      ['Can you describe your umbrella?', '您可以描述一下雨傘嗎？'],
      ["It's dark green with a brown handle.", '是深綠色的，握柄是棕色的。'],
      ['We have one like that. Please come to the office.', '我們這裡有一把很像的。請到辦公室來。'],
    ],
  ],
  [
    'B1',
    'memorable-trip',
    '分享難忘的旅行經驗',
    [
      ['Have you ever travelled alone?', '你曾經一個人旅行嗎？'],
      ['Yes, I spent a week in Kyoto last spring.', '有，我去年春天在京都待了一個星期。'],
      ['Was it difficult without someone to help you?', '沒有人幫忙，會很困難嗎？'],
      ['I got lost once, but a local student helped me find my hotel.', '我迷路過一次，不過一位當地學生幫我找到飯店。'],
      ['Would you recommend going alone?', '你會推薦一個人去嗎？'],
      ['Yes, because you can change your plans whenever you like.', '會，因為你隨時都能依自己的意願改變計畫。'],
    ],
  ],
  [
    'B1',
    'choosing-a-job',
    '在兩份工作之間選擇',
    [
      ["I've been offered a job at a smaller company.", '有一家規模比較小的公司給了我工作機會。'],
      ['How does it compare with your current job?', '和你現在的工作比起來怎麼樣？'],
      ["The salary is lower, but I'd have more chances to learn.", '薪水比較低，但我會有更多學習機會。'],
      ['That sounds useful if you want to develop your skills.', '如果你想增進技能，那聽起來很有幫助。'],
      ["I do, although I'm worried about paying the rent.", '我確實想，但我擔心付不起房租。'],
      ['Perhaps you should check your monthly budget before deciding.', '也許你應該先確認每月預算，再做決定。'],
    ],
  ],
  [
    'B1',
    'learning-progress',
    '持續學習遇到瓶頸',
    [
      ["I've been learning English for a year, but speaking is still difficult.", '我學英文一年了，但開口說還是很難。'],
      ['What do you find hardest about it?', '你覺得最困難的部分是什麼？'],
      ['I worry about mistakes, so I often stay quiet.', '我擔心說錯，所以常常不說話。'],
      ['I felt the same until I joined a small conversation group.', '我以前也有同樣的感覺，直到參加一個小型會話團體。'],
      ['Did that help you become more confident?', '那有幫你變得更有自信嗎？'],
      ['Yes. We focus on sharing ideas instead of correcting every mistake.', '有。我們著重在分享想法，不會糾正每一個錯誤。'],
    ],
  ],
  [
    'B1',
    'friendship-distance',
    '和遠方朋友保持聯絡',
    [
      ['Do you still keep in touch with your friend in Canada?', '你還有和在加拿大的朋友保持聯絡嗎？'],
      ["Yes, although we don't talk as often as we used to.", '有，不過我們不像以前那麼常聊天了。'],
      ['Is the time difference a problem?', '時差會造成困擾嗎？'],
      ['Sometimes, so we usually send voice messages during the week.', '有時候會，所以平日通常會傳語音訊息。'],
      ["That's a good way to share what has happened.", '那是分享近況的好方法。'],
      ['It is, and we try to have a video call once a month.', '沒錯，而且我們盡量每個月視訊一次。'],
    ],
  ],
  [
    'B1',
    'healthier-routine',
    '想改變久坐的習慣',
    [
      ['I feel tired after sitting at my desk all day.', '整天坐在書桌前，讓我覺得很累。'],
      ['Have you tried taking a short walk during lunch?', '你試過午餐時間出去散步一下嗎？'],
      ['Not yet. I usually eat while checking my messages.', '還沒。我通常一邊吃飯一邊看訊息。'],
      ['I used to do that, but going outside helps me relax.', '我以前也那樣，但出門走走能幫助我放鬆。'],
      ["Maybe we could walk together tomorrow if it doesn't rain.", '如果明天沒下雨，也許我們可以一起散步。'],
      ["Good idea. Let's start with fifteen minutes.", '好主意。我們先從十五分鐘開始吧。'],
    ],
  ],
  [
    'B1',
    'less-waste',
    '減少每天的垃圾',
    [
      ['Our office bins fill up with paper cups every day.', '我們辦公室的垃圾桶每天都裝滿紙杯。'],
      ["Why don't we bring our own cups?", '我們何不自己帶杯子？'],
      ['I already do, but some people forget theirs.', '我已經這樣做了，但有些人會忘記帶。'],
      ['We could keep a few spare cups in the kitchen.', '我們可以在茶水間放幾個備用杯子。'],
      ['That would help, as long as everyone washes them afterwards.', '那會有幫助，只要大家用完都會洗。'],
      ["I'll ask the team what they think at tomorrow's meeting.", '我會在明天的會議上問問大家的想法。'],
    ],
  ],
  [
    'B1',
    'film-review',
    '討論電影的結局',
    [
      ['What did you think of the film we watched?', '你覺得我們看的那部電影怎麼樣？'],
      ['The acting was excellent, but the ending disappointed me.', '演技很棒，但結局讓我有點失望。'],
      ['Really? I liked that we had to imagine what happened next.', '真的嗎？我喜歡需要自己想像後續發展這一點。'],
      ['I understand, but I wanted to know whether the sisters met again.', '我理解，但我想知道那對姊妹後來有沒有再見面。'],
      ['Perhaps the final letter suggests that they did.', '也許最後那封信暗示了她們有見面。'],
      ["I hadn't thought of that. I might watch the last scene again.", '我沒想到這一點。我可能會再看一次最後那一幕。'],
    ],
  ],
  [
    'B1',
    'saving-for-a-trip',
    '為旅行存錢',
    [
      ["I'm trying to save up for a trip this winter.", '我正努力存錢，準備冬天去旅行。'],
      ['Have you worked out how much you need?', '你算過需要多少錢了嗎？'],
      ['About a thousand dollars, including flights and accommodation.', '大約一千元，包含機票和住宿。'],
      ['Could you spend less on eating out for a few months?', '你可以連續幾個月減少外食花費嗎？'],
      ['Yes. Cooking at home should make a big difference.', '可以。在家煮應該能省下不少。'],
      ['You could also put some money aside as soon as you get paid.', '你也可以一領到薪水，就先存下一部分。'],
    ],
  ],
  [
    'B1',
    'community-garden',
    '參加社區菜園',
    [
      ['Did you see the notice about the community garden?', '你有看到社區菜園的公告嗎？'],
      ["Yes. I'd like to help, but I don't know much about growing vegetables.", '有。我想幫忙，但我不太懂種菜。'],
      ['Neither do I. They said beginners are welcome.', '我也不懂。他們說歡迎新手參加。'],
      ['When do the volunteers usually meet?', '志工通常什麼時候聚會？'],
      ['On Sunday mornings, and someone experienced will show us what to do.', '週日早上，會有有經驗的人教我們怎麼做。'],
      ["Let's go together. It could be a nice way to meet our neighbours.", '我們一起去吧。這也許是認識鄰居的好機會。'],
    ],
  ],
  [
    'B1',
    'phone-distractions',
    '減少手機干擾',
    [
      ["I keep checking my phone when I'm supposed to be studying.", '我該讀書的時候，總是一直看手機。'],
      ['Have you thought about leaving it in another room?', '你有想過把手機放在另一個房間嗎？'],
      ['I have, but I use it as a dictionary.', '有，但我會用它查字典。'],
      ['Then perhaps you could turn off notifications while you study.', '那也許你可以在讀書時關掉通知。'],
      ['That might work. Most messages can wait until my break.', '那可能有用。大部分訊息都可以等到休息時再看。'],
      ['Try it for a few days and see whether you can concentrate better.', '試個幾天，看看能不能更專心。'],
    ],
  ],
  [
    'B1',
    'city-or-country',
    '城市和鄉村生活',
    [
      ['Would you rather live in the city or the countryside?', '你比較想住在城市還是鄉下？'],
      ["I'd choose the countryside because it's quieter and closer to nature.", '我會選鄉下，因為比較安靜，也更接近大自然。'],
      ["That's true, but getting to work could take much longer.", '沒錯，但上班可能會花更多時間。'],
      ['It would depend on whether I could work from home.', '那要看我能不能在家工作。'],
      ["I'd miss having shops and cinemas within walking distance.", '我會想念走路就能到商店和電影院的生活。'],
      ['Perhaps a small town would suit both of us.', '也許小鎮生活會適合我們兩個。'],
    ],
  ],
  [
    'B1',
    'finding-a-flat',
    '看房後的討論',
    [
      ['What did you think of the flat we saw this morning?', '你覺得我們今天早上看的公寓怎麼樣？'],
      ["It's bright and close to the station, but the kitchen is quite small.", '採光好，也靠近車站，但廚房滿小的。'],
      ['I noticed that, too. Would there be enough space for our table?', '我也注意到了。放得下我們的餐桌嗎？'],
      ["Probably not. We'd have to sell it or put it in the living room.", '可能放不下。我們得賣掉，或放在客廳。'],
      ["The rent is lower than anywhere else we've seen.", '房租比我們看過的其他地方都低。'],
      ["Then let's measure the rooms before making a final decision.", '那我們先量一下各個房間，再做最後決定。'],
    ],
  ],
  [
    'B1',
    'train-cancelled',
    '火車取消後改行程',
    [
      ['Our train has been cancelled because of the storm.', '我們的火車因為暴風雨取消了。'],
      ["That's a shame. Is there another way to get there?", '真可惜。還有別的方法過去嗎？'],
      ["There's a bus, but it takes twice as long.", '有公車，但要花兩倍的時間。'],
      ['If we take it now, will we still arrive before dinner?', '如果現在搭，還來得及在晚餐前到嗎？'],
      ['We should, unless the roads are very busy.', '應該可以，除非路上很塞。'],
      ["Let's take the bus and let our friends know we'll be late.", '我們搭公車吧，也告訴朋友會晚到。'],
    ],
  ],
  [
    'B1',
    'birthday-surprise',
    '規劃朋友的生日驚喜',
    [
      ["I'd like to organise something for Jo's birthday.", '我想為 Jo 的生日安排個活動。'],
      ["She doesn't enjoy big parties, does she?", '她不喜歡大型派對，對吧？'],
      ['No. I was thinking of a small dinner with her closest friends.', '對。我在想，找她最要好的朋友一起吃個小型晚餐。'],
      ['That sounds more like her. Could we cook at your place?', '那聽起來比較適合她。我們可以在你家煮嗎？'],
      ["Yes, if everyone brings a dish, it won't be too much work.", '可以，如果每個人都帶一道菜，就不會太累。'],
      ["I'll make a cake, but let's check whether anyone has food allergies.", '我來做蛋糕，不過我們先確認有沒有人對食物過敏。'],
    ],
  ],
  [
    'B1',
    'first-presentation',
    '第一次簡報之後',
    [
      ['How did your first presentation go?', '你的第一次簡報進行得怎麼樣？'],
      ['I was nervous at first, but it went better than I expected.', '我一開始很緊張，但結果比預期好。'],
      ['What helped you feel more comfortable?', '什麼讓你覺得比較自在？'],
      ['I practised with my sister, and she asked me some difficult questions.', '我和姊姊一起練習，她問了我一些難題。'],
      ['So you were ready when the audience asked questions?', '所以觀眾提問時，你已經準備好了？'],
      ["Mostly. I couldn't answer everything, but I didn't panic.", '大部分是。我沒辦法回答所有問題，但我沒有慌張。'],
    ],
  ],
  [
    'B2',
    'project-scope',
    '專案需求增加時的取捨',
    [
      ['The client wants two extra features without moving the deadline.', '客戶想增加兩項功能，但不想延後截止日期。'],
      ['We should clarify which existing tasks can be postponed before agreeing.', '我們應該先釐清現有工作中哪些可以延後，再答應。'],
      [
        'They consider everything essential, although we only have three developers available.',
        '他們認為每一項都不可少，但我們只有三位開發人員能投入。',
      ],
      ["Then let's show them the trade-offs using a revised schedule.", '那就用調整後的時程，讓他們看清楚需要做哪些取捨。'],
      ['Could we deliver the core features first and release the rest later?', '我們能先交付核心功能，之後再推出其餘部分嗎？'],
      ['That seems feasible, provided they accept a clearly defined second phase.', '那應該可行，前提是他們接受範疇明確的第二階段。'],
    ],
  ],
  [
    'B2',
    'constructive-feedback',
    '回饋同事的報告',
    [
      [
        'Your report explains the customer problem clearly, but the recommendation needs more support.',
        '你的報告把客戶的問題說明得很清楚，但建議方案需要更多佐證。',
      ],
      ["Are you concerned about the figures or the way I've interpreted them?", '你擔心的是數字，還是我解讀數字的方式？'],
      ['Mainly the interpretation, since the survey only covered existing customers.', '主要是解讀方式，因為問卷只涵蓋現有客戶。'],
      ["I see. I shouldn't assume that potential customers would respond in the same way.", '我懂了。我不應該假設潛在客戶也會有相同反應。'],
      [
        'Exactly. A short section acknowledging that limitation would make the argument stronger.',
        '沒錯。加入一小段說明這個限制，會讓論點更有說服力。',
      ],
      ["I'll revise that section and distinguish the evidence from my assumptions.", '我會修改那一段，並區分證據和我的假設。'],
    ],
  ],
  [
    'B2',
    'hybrid-work',
    '協調混合辦公安排',
    [
      [
        'Our team likes remote work, yet new colleagues find it hard to ask informal questions.',
        '我們團隊喜歡遠距工作，但新同事覺得很難隨時請教小問題。',
      ],
      [
        'Would shared office days help them build relationships without losing too much flexibility?',
        '安排共同進辦公室的日子，能否幫他們建立關係，同時保留足夠彈性？',
      ],
      [
        'Possibly, although some people have long commutes and caring responsibilities.',
        '可能可以，不過有些人通勤很遠，也有照顧家人的責任。',
      ],
      ['We could agree on one regular day and offer online support at other times.', '我們可以協調出固定一天，其他時間則提供線上支援。'],
      [
        "Let's also make sure important decisions aren't limited to conversations in the office.",
        '也要確保重要決策不會只在辦公室裡的交談中做成。',
      ],
      [
        "Agreed. I'll suggest recording decisions in a shared space that everyone can access.",
        '同意。我會建議把決策記錄在所有人都能存取的共用空間。',
      ],
    ],
  ],
  [
    'B2',
    'suspicious-email',
    '辨識可疑的帳號通知',
    [
      [
        'I received an email saying my account will be closed unless I confirm my password.',
        '我收到一封信，說如果不確認密碼，我的帳號就會被關閉。',
      ],
      ['That sounds suspicious, especially if it pressures you to act immediately.', '那聽起來很可疑，尤其是它催促你立刻採取行動。'],
      ["The logo looks genuine, but the sender's address is slightly different.", '標誌看起來是真的，但寄件者地址有一點不同。'],
      [
        "Rather than using the link, check your account through the service's official website.",
        '直接透過該服務的官方網站查看帳號，別使用信裡的連結。',
      ],
      ["There's no warning there, so I'll report the message to our support team.", '官網沒有任何警告，所以我會向支援團隊回報這封信。'],
      ['Good idea. They can investigate it and warn others if necessary.', '好主意。他們可以調查，必要時也能提醒其他人。'],
    ],
  ],
  [
    'B2',
    'assessment-design',
    '討論課程評量方式',
    [
      ['Do written exams give us a fair picture of what students can actually do?', '筆試能公平反映學生實際具備的能力嗎？'],
      [
        'They measure some knowledge well, but practical skills may require a different approach.',
        '筆試能有效評量某些知識，但實務技能可能需要不同方式。',
      ],
      ['I was thinking of replacing the final exam with a group project.', '我在考慮用小組專案取代期末考。'],
      [
        'That could encourage collaboration, although individual contributions might be difficult to assess.',
        '那可以鼓勵合作，不過個人貢獻可能不容易評量。',
      ],
      [
        'What if students also submitted a short reflection explaining their decisions?',
        '如果學生也要繳交簡短的反思，說明自己做的決定呢？',
      ],
      ['That would help, as long as the assessment criteria are clear from the start.', '那會有幫助，前提是一開始就清楚說明評量標準。'],
    ],
  ],
  [
    'B2',
    'bus-service',
    '改善郊區公車服務',
    [
      ['The council wants to attract more passengers by reducing bus fares.', '地方議會想透過降低公車票價吸引更多乘客。'],
      [
        'Lower fares would help, but unreliable services are a bigger problem in my area.',
        '降價會有幫助，但在我住的地方，班次不可靠是更大的問題。',
      ],
      ['Would increasing the frequency during rush hour make a difference?', '增加尖峰時段班次會有改善嗎？'],
      ['Yes, particularly for people who need to change buses on their way to work.', '會，尤其是對上班途中需要轉車的人。'],
      [
        'Perhaps the budget should be split between cheaper tickets and service improvements.',
        '也許預算應該分配在票價補助和服務改善兩方面。',
      ],
      ["I'd support that if the council published clear targets for reliability.", '如果議會公布明確的可靠度目標，我會支持。'],
    ],
  ],
  [
    'B2',
    'faulty-headphones',
    '處理有瑕疵的耳機',
    [
      ["These headphones stopped working after a week, and I'd like to discuss a refund.", '這副耳機用了一週就故障了，我想詢問退款。'],
      ["I'm sorry about that. Do you have your receipt or any other proof of purchase?", '很抱歉發生這種情況。您有收據或其他購買證明嗎？'],
      ["Yes, here's the email confirmation, which includes the order number.", '有，這是確認郵件，裡面有訂單編號。'],
      ['Thank you. Under our policy, we can offer either a replacement or a refund.', '謝謝。依照本店規定，我們可以提供換貨或退款。'],
      ["I'd prefer a refund, since I need a working pair for a trip tomorrow.", '我比較希望退款，因為我明天出門旅行就需要能用的耳機。'],
      ["Certainly. I'll process it now and send you a confirmation of the amount.", '沒問題。我現在處理，並寄給您退款金額的確認通知。'],
    ],
  ],
  [
    'B2',
    'news-headline',
    '新聞標題是否誤導',
    [
      ['This headline claims that working from home makes people less productive.', '這個標題聲稱，在家工作會讓人生產力下降。'],
      ["Does the article provide evidence, or is it mainly reporting someone's opinion?", '文章有提供證據，還是主要在轉述某人的意見？'],
      ["It refers to a survey, but I can't find any details about who took part.", '它提到一份問卷調查，但我找不到受訪者的詳細資料。'],
      ["Without that context, it's difficult to judge how representative the results are.", '缺少這些背景，就很難判斷結果有多少代表性。'],
      ["I'll look for the original report before sharing the story.", '我會先找原始報告，再分享這篇報導。'],
      [
        "That's sensible, because the headline may be stronger than the findings justify.",
        '這樣很合理，因為標題的語氣可能超過研究發現能支持的程度。',
      ],
    ],
  ],
  [
    'B2',
    'office-emissions',
    '降低辦公室的碳排放',
    [
      [
        'Our company has promised to reduce emissions, but the plan mostly mentions recycling.',
        '公司承諾減少排放，但計畫裡大多只提到回收。',
      ],
      [
        'Recycling matters, though energy use and business travel may have a larger impact.',
        '回收很重要，但能源使用和商務差旅的影響可能更大。',
      ],
      ['Could we replace some flights with online meetings?', '我們能用線上會議取代部分搭機出差嗎？'],
      ['Probably, provided teams can explain when meeting in person is necessary.', '應該可以，前提是團隊能說明什麼時候需要當面見面。'],
      ['We should measure our current emissions before setting realistic targets.', '我們應該先測量目前的排放量，再訂出務實的目標。'],
      ["Agreed. Otherwise, we won't know whether the changes are making a difference.", '同意。否則我們不會知道這些改變有沒有成效。'],
    ],
  ],
  [
    'B2',
    'delivery-negotiation',
    '協商交貨日期',
    [
      [
        'We can meet your requested price if the delivery date is extended by two weeks.',
        '如果交貨日期延後兩週，我們就能配合您要求的價格。',
      ],
      [
        'That would put our launch at risk. Could you deliver part of the order earlier?',
        '那會影響我們如期推出產品。你們能先交付部分訂單嗎？',
      ],
      ['A partial delivery is possible, although it would involve an additional shipping charge.', '分批交貨可以，但會增加運費。'],
      ['If we cover that charge, can you guarantee the first shipment by Friday?', '如果我們負擔那筆費用，你們能保證首批貨週五前送達嗎？'],
      ["I'll confirm the capacity with our production team before making that commitment.", '我會先向生產團隊確認產能，再做出承諾。'],
      ["Fair enough. Please send the revised terms once you've checked.", '合理。確認後請把修改的條件寄給我。'],
    ],
  ],
  [
    'B2',
    'survey-results',
    '解讀問卷結果的限制',
    [
      [
        'Our survey suggests that students who exercise regularly also report better sleep.',
        '我們的調查顯示，規律運動的學生也回報較好的睡眠。',
      ],
      ['Can we conclude that exercise caused the improvement?', '我們能推論是運動造成改善嗎？'],
      ["Not from these results alone, since we didn't control for other habits.", '單靠這些結果還不行，因為我們沒有控制其他習慣的影響。'],
      [
        'For example, those students might also spend less time on their phones at night.',
        '例如，那些學生晚上使用手機的時間也可能比較少。',
      ],
      [
        'Exactly. We should describe the relationship without claiming cause and effect.',
        '沒錯。我們應該描述其中的關聯，不宣稱有因果關係。',
      ],
      ["Let's make that limitation clear in the summary as well as the full report.", '我們在摘要和完整報告中，都要清楚說明這個限制。'],
    ],
  ],
  [
    'B2',
    'career-change',
    '評估轉換職涯方向',
    [
      [
        "I'm considering a move from sales into training, but I don't have a formal qualification.",
        '我在考慮從業務轉做培訓，但我沒有正式資格。',
      ],
      [
        "You've already developed transferable skills, especially explaining products and handling questions.",
        '你已經培養了可轉用的技能，尤其是解說產品和處理提問。',
      ],
      [
        "That's encouraging, though designing an entire course would be new to me.",
        '聽你這麼說很受鼓勵，不過設計完整課程對我來說是新的挑戰。',
      ],
      [
        'Could you shadow an experienced trainer before committing to a longer course?',
        '在投入長期課程之前，你能先跟著有經驗的培訓師觀摩嗎？',
      ],
      ["I could ask our training manager whether there's a project I can assist with.", '我可以問培訓經理，有沒有我能協助的專案。'],
      ['That would let you test your interest while building relevant experience.', '這樣既能確認自己的興趣，也能累積相關經驗。'],
    ],
  ],
  [
    'B2',
    'rental-maintenance',
    '和房東討論維修',
    [
      [
        "The heating has failed twice this month, and the temporary repairs haven't lasted.",
        '暖氣這個月故障兩次了，暫時性的修理都沒撐多久。',
      ],
      ['Have you asked the landlord for a written maintenance schedule?', '你有請房東提供書面的維修時程嗎？'],
      ["Not yet. I've only reported the faults by phone.", '還沒。我目前只透過電話回報故障。'],
      [
        'It may help to send a clear summary with the dates and the impact on the flat.',
        '寄一份清楚的摘要，列出日期和對居住的影響，可能會有幫助。',
      ],
      ["I'll ask when a qualified technician can inspect the whole system.", '我會詢問合格技師什麼時候能檢查整套系統。'],
      ['Keep a copy of the reply so you both have a record of what was agreed.', '留存回覆，這樣雙方都有協議內容的紀錄。'],
    ],
  ],
  [
    'B2',
    'cross-cultural-meeting',
    '跨文化會議裡的沉默',
    [
      [
        "Some colleagues stayed quiet during the meeting, so I'm not sure they supported the proposal.",
        '有幾位同事開會時沒有說話，所以我不確定他們是否支持提案。',
      ],
      [
        "Silence doesn't necessarily mean agreement or disagreement; they may need more time to respond.",
        '沉默不一定代表同意或反對；他們可能需要更多時間回應。',
      ],
      ['I might have moved on too quickly after asking for comments.', '我可能徵詢意見後，太快就進入下一項了。'],
      [
        'You could invite written feedback and explain that different views are welcome.',
        '你可以邀請大家提供書面回饋，並說明歡迎不同觀點。',
      ],
      ['That would also help anyone who finds fast discussions difficult to follow.', '那也能幫助不容易跟上快速討論的人。'],
      [
        "Exactly. Let's avoid making assumptions about individuals based on their background.",
        '沒錯。我們避免根據個人背景，對他們做想當然的推測。',
      ],
    ],
  ],
  [
    'B2',
    'outdoor-event',
    '戶外活動的雨天備案',
    [
      ['The forecast suggests heavy rain on the day of our outdoor workshop.', '天氣預報顯示，戶外工作坊當天可能會下大雨。'],
      ['Do we have an alternative venue with enough capacity for everyone?', '我們有能容納所有人的替代場地嗎？'],
      ["The community hall is available, but we'd need to rearrange the equipment.", '社區活動中心可以使用，但我們得重新安排設備。'],
      [
        "Before booking it, let's check the entrance, toilets, and seating for accessibility.",
        '預訂前，先檢查入口、廁所和座位是否符合無障礙需求。',
      ],
      ["I'll do that today and update the volunteers once the location is confirmed.", '我今天會確認，地點確定後就通知志工。'],
      [
        'Please notify participants as well, including anyone who registered without an email address.',
        '也請通知參加者，包括報名時沒有留電子郵件地址的人。',
      ],
    ],
  ],
  [
    'C1',
    'strategic-pilot',
    '試辦成果足以支持擴張嗎',
    [
      [
        "The pilot exceeded its sales target, but I'm reluctant to treat that as sufficient evidence for a nationwide launch.",
        '試辦銷售超過目標，但我不太願意把這點視為全國推出的充分依據。',
      ],
      [
        'Is your reservation about the size of the sample, or about whether the conditions can be reproduced elsewhere?',
        '你的保留在於樣本大小，還是其他地方能否重現相同條件？',
      ],
      [
        "Both, particularly since the local team received support that we couldn't realistically provide to every branch.",
        '兩者都有，尤其當地團隊獲得的支援，我們實際上無法提供給每個分店。',
      ],
      [
        'Then a second pilot under ordinary staffing conditions might tell us more than simply extending the current one.',
        '那麼，在一般人力配置下再試辦一次，可能比單純延長目前試辦更有參考價值。',
      ],
      [
        'Agreed, provided we define in advance which results would justify expansion and which would trigger a course correction.',
        '同意，前提是先界定什麼結果足以支持擴張，以及什麼結果會促使我們調整方向。',
      ],
      [
        "I'll revise the proposal so the decision depends on those criteria rather than the momentum behind the project.",
        '我會修改提案，讓決策依據那些標準，而非專案既有的推進聲勢。',
      ],
    ],
  ],
  [
    'C1',
    'automated-decisions',
    '自動決策與申訴權利',
    [
      [
        "The system may process applications more consistently, yet consistency alone doesn't establish that its decisions are fair.",
        '系統或許能更一致地處理申請，但一致性本身不足以證明決策公平。',
      ],
      [
        'Especially if the historical data reflects disadvantages that applicants have had little control over in the first place.',
        '尤其是當歷史資料反映的弱勢處境，本來就不是申請人能左右的。',
      ],
      [
        'We need a meaningful appeal process, not merely a notice stating that an automated assessment has taken place.',
        '我們需要真正有用的申訴程序，不能只有一份告知已進行自動評估的通知。',
      ],
      [
        'That would require someone with the authority and expertise to question the outcome, rather than routinely approving it.',
        '那需要具備權限和專業的人來質疑結果，而不是照例核可。',
      ],
      [
        'Could we also explain the main factors behind a decision without disclosing personal information about other applicants?',
        '我們也能在不揭露其他申請人個資的前提下，說明決策背後的主要因素嗎？',
      ],
      [
        'We should explore that, while making it clear that an explanation does not remove our responsibility to correct errors.',
        '我們應該研究這個做法，同時清楚表明：提供解釋並不免除我們更正錯誤的責任。',
      ],
    ],
  ],
  [
    'C1',
    'research-caveats',
    '研究發現該如何保留語氣',
    [
      [
        'The effect appears robust across several models, although the study still relies on participants reporting their own behaviour.',
        '這項效果在幾種模型中都顯得穩健，不過研究仍依賴參與者自行回報行為。',
      ],
      [
        'That leaves room for reporting bias, particularly if participants guessed which responses the researchers were hoping to receive.',
        '這仍可能產生回報偏差，尤其當參與者猜到了研究者希望收到什麼回答時。',
      ],
      [
        "Would describing the findings as tentative understate the consistency we've observed, or appropriately reflect the limits of the method?",
        '把發現描述為暫定，會低估我們觀察到的一致性，還是恰當反映方法上的限制？',
      ],
      [
        "I'd distinguish confidence in the observed association from confidence in the proposed explanation, since those are different claims.",
        '我會區分對觀察到的關聯有多大把握，以及對提出的解釋有多大把握，因為那是不同的主張。',
      ],
      [
        'That distinction should appear in the abstract; otherwise, readers may repeat the conclusion without carrying the caveat along.',
        '這個區別應該出現在摘要裡，否則讀者可能轉述結論，卻漏掉附帶限制。',
      ],
      [
        "Let's also specify what additional evidence would strengthen the explanation, so the uncertainty points towards further inquiry.",
        '我們也說明還需要哪些證據來強化解釋，讓不確定之處成為後續探究的方向。',
      ],
    ],
  ],
  [
    'C1',
    'team-restructuring',
    '重整團隊時保留組織知識',
    [
      [
        'The proposed restructuring removes a layer of management, but it also separates people who currently resolve problems informally.',
        '這項重整提案減少了一層管理，卻也拆散了目前會非正式協力解決問題的人。',
      ],
      [
        'Those relationships rarely appear on an organisation chart, even though they underpin a great deal of day-to-day coordination.',
        '那些關係很少出現在組織圖上，卻支撐了大量日常協調工作。',
      ],
      [
        'How do we preserve that institutional knowledge without using it as a reason to resist every structural change?',
        '我們要如何保留組織累積的知識，又不把它當成抗拒所有結構調整的理由？',
      ],
      [
        'We could map the decisions people actually make and identify where responsibility would become ambiguous under the new arrangement.',
        '我們可以梳理人們實際做的決策，找出新安排下哪些責任會變得模糊。',
      ],
      [
        'That would also give staff a concrete way to raise concerns, rather than asking whether they support change in principle.',
        '那也能讓員工具體提出疑慮，而不是只問他們原則上支不支持改變。',
      ],
      [
        'And if those concerns lead to visible revisions, the consultation is more likely to build trust instead of eroding it.',
        '如果那些疑慮帶來看得見的修訂，徵詢意見就更可能建立信任，而非侵蝕信任。',
      ],
    ],
  ],
  [
    'C1',
    'targeted-support',
    '普遍補助與精準支援的兩難',
    [
      [
        "A universal subsidy would be straightforward to administer, but a substantial share would go to households that don't need it.",
        '普遍補助容易執行，但很大一部分會流向並不需要補助的家戶。',
      ],
      [
        "Targeted support could address that, although complicated eligibility rules may exclude precisely the people we're trying to reach.",
        '針對性的支援可以改善這點，但複雜的資格規定可能排除我們最想幫助的人。',
      ],
      [
        "So administrative simplicity has an equity dimension too; it isn't merely a question of reducing the agency's workload.",
        '所以行政簡便也有公平性的面向，不只是減輕機關工作量的問題。',
      ],
      [
        'Exactly, and we should examine who bears the burden of proving eligibility, particularly when their circumstances change frequently.',
        '沒錯，我們也應該檢視證明資格的負擔由誰承受，尤其對生活狀況經常變動的人。',
      ],
      [
        'Could an initial broad payment be followed by adjustments through an existing process, rather than a separate application system?',
        '能否先廣泛發放，再透過既有程序調整，而不另外設立申請系統？',
      ],
      [
        "Possibly, but we'd need to compare the practical consequences for recipients before presenting that as the fairer option.",
        '有可能，但在把它說成更公平的選項之前，我們需要比較它對領取者的實際影響。',
      ],
    ],
  ],
  [
    'C1',
    'respectful-objection',
    '對共識提出有分寸的異議',
    [
      [
        'I can see why the proposal has attracted support, but I take issue with the assumption that participation implies endorsement.',
        '我理解這個提案為何獲得支持，但我不同意把參與視為認同的假設。',
      ],
      [
        "That's a fair distinction, though I wouldn't dismiss the attendance figures as irrelevant to the level of public interest.",
        '這個區分合理，不過我也不會認為出席人數與公眾關注程度毫無關係。',
      ],
      [
        "Nor would I; my concern is that we're using evidence of interest to substantiate a stronger claim about consent.",
        '我也不會；我擔心的是，我們正用關注程度的證據來支持更強的同意主張。',
      ],
      [
        'Would you be comfortable retaining the figures if we qualified the conclusion and acknowledged the range of views expressed?',
        '如果我們限定結論的語氣，也承認現場表達了多種觀點，你能接受保留那些數字嗎？',
      ],
      [
        'Yes, provided the disagreement is represented in the main text rather than relegated to a footnote few readers will notice.',
        '可以，前提是把分歧呈現在正文，而不是放到很少人注意的註腳裡。',
      ],
      [
        "Then let's reframe the section around what the consultation revealed, instead of treating it as confirmation of our preferred option.",
        '那我們把這一段改成呈現諮詢所揭示的內容，而非把諮詢當成替偏好的方案背書。',
      ],
    ],
  ],
  [
    'C1',
    'supplier-resilience',
    '供應鏈分散的代價',
    [
      [
        'Relying on a single supplier has kept costs down, but it leaves us exposed to disruptions beyond our control.',
        '依賴單一供應商壓低了成本，卻讓我們暴露在無法控制的中斷風險之下。',
      ],
      [
        'Diversifying would provide a buffer, although maintaining several relationships could introduce complexity and weaken our negotiating position.',
        '分散供應來源能提供緩衝，但維持多方關係可能增加複雜度，並削弱議價能力。',
      ],
      [
        'The question is whether the apparent savings still hold once we account for the cost of a prolonged interruption.',
        '問題是，計入長時間中斷的成本後，表面上的節省是否仍然成立。',
      ],
      [
        'We should test several disruption scenarios, rather than assigning a precise probability to an event we have little basis to predict.',
        '我們應該測試幾種中斷情境，而不是替缺乏預測依據的事件指定精確機率。',
      ],
      [
        'That might reveal which components genuinely require alternative sources and which can be protected with a modest stock buffer.',
        '那可能顯示哪些零組件確實需要替代來源，以及哪些只要少量安全庫存就能保障供應。',
      ],
      [
        'Agreed; resilience should be designed around the consequences of failure, not pursued as a blanket increase in spending.',
        '同意；韌性應該依故障後果來設計，而不是一律增加支出。',
      ],
    ],
  ],
  [
    'C1',
    'academic-premise',
    '論文前提與結論的距離',
    [
      [
        "Your argument is coherent, but its central premise seems broader than the evidence you've assembled can reasonably support.",
        '你的論證很連貫，但核心前提似乎超出了所蒐集證據能合理支持的範疇。',
      ],
      [
        'Are you suggesting I narrow the claim to the communities in the study, rather than generalising to all urban residents?',
        '你的意思是，我應該把主張限於研究中的社區，而不是推廣到所有城市居民嗎？',
      ],
      [
        "That would help, and I'd also distinguish a preference expressed in interviews from behaviour observed under real constraints.",
        '那會有幫助，我也會區分受訪者在訪談中表達的偏好，以及在真實限制下觀察到的行為。',
      ],
      [
        'If I make both distinctions explicit, the conclusion becomes more modest, though perhaps it also becomes more defensible.',
        '如果明確做出這兩個區分，結論會更保守，但也可能更站得住腳。',
      ],
      [
        'Precisely; a carefully bounded claim can contribute more than an ambitious one that collapses when a counterexample is introduced.',
        '正是如此；界線清楚的主張，可能比一個反例就能推翻的宏大論點更有貢獻。',
      ],
      [
        "I'll revise the opening and conclusion together, so the qualifications don't appear only after the reader has accepted the premise.",
        '我會一起修改開頭和結論，避免讀者先接受前提，後面才看到適用限制。',
      ],
    ],
  ],
  [
    'C1',
    'delegating-authority',
    '授權為何沒有真正發生',
    [
      [
        'I told the team they could make the decision, yet they keep bringing minor choices back to me for approval.',
        '我告訴團隊，他們可以自行決定，但他們還是一直把小選擇交回來讓我核准。',
      ],
      [
        'Have past decisions been overturned after the fact, even when people acted within the boundaries you originally set?',
        '以前是否曾有人在你設定的界線內行事，決定卻在事後被推翻？',
      ],
      [
        'Occasionally, and I can see how that might have taught them that taking ownership carries an unpredictable risk.',
        '偶爾有，而我能理解，這可能讓他們認為主動承擔責任會帶來難以預料的風險。',
      ],
      [
        "Delegation needs a shared understanding of discretion, including which imperfect outcomes you're prepared to accept without stepping in.",
        '授權需要對自主裁量有共同理解，包括哪些不完美的結果，你願意接受而不介入。',
      ],
      [
        'Then I should explain the limits more clearly and resist reopening decisions simply because I would have chosen differently.',
        '那我應該更清楚說明界線，也克制自己，不因為我會做不同選擇就重新檢討決定。',
      ],
      [
        'That consistency will probably do more for their confidence than repeatedly assuring them that you trust their judgement.',
        '這種一致性，可能比反覆保證你信任他們的判斷，更能建立他們的信心。',
      ],
    ],
  ],
  [
    'C1',
    'urban-regeneration',
    '街區更新與原居民',
    [
      [
        'The regeneration scheme could improve public spaces, but the prospect of rising rents is already making long-term residents anxious.',
        '這個街區更新案可能改善公共空間，但租金可能上漲，已經讓長期居民感到焦慮。',
      ],
      [
        "It's difficult to call the area more liveable if the people who sustained its community can no longer afford to remain.",
        '如果維繫社區的人最後住不起，很難說這個地方變得更宜居了。',
      ],
      [
        "The planners have proposed preserving several historic buildings, although that doesn't necessarily protect the social fabric around them.",
        '規劃者提議保留幾棟歷史建築，但那不一定能保護周圍既有的社會關係。',
      ],
      [
        'Could residents help define success through measures such as stable tenancies, accessible services, and opportunities for local businesses?',
        '能否讓居民一起用租住穩定、服務可近性、在地商家機會等指標來界定成功？',
      ],
      [
        'That would broaden the discussion beyond property values, provided their participation has some influence over the eventual decisions.',
        '那能讓討論超越房產價值，前提是居民參與對最後決策有實際影響。',
      ],
      [
        'Then the consultation process needs to establish where residents have a say, rather than merely inviting them to react to finished designs.',
        '那諮詢程序就需要確立居民在哪些部分有發言權，而不只是邀請他們對完成的設計表示意見。',
      ],
    ],
  ],
  [
    'C1',
    'explaining-uncertainty',
    '向公眾說明不確定性',
    [
      [
        'The technical summary is accurate, yet readers may struggle to distinguish what we know from what remains open to interpretation.',
        '技術摘要很準確，但讀者可能難以區分已知事實與仍有解讀空間的部分。',
      ],
      [
        'We could lead with the practical implication, then explain the assumptions that would make that interpretation more or less persuasive.',
        '我們可以先說明實際意涵，再解釋哪些假設會使這個解讀更有或更缺乏說服力。',
      ],
      [
        "I'm wary of simplifying it so far that the uncertainty disappears, particularly when the headline will travel without the supporting detail.",
        '我擔心過度簡化會讓不確定性消失，尤其標題常會脫離詳細說明而被轉傳。',
      ],
      [
        "Clarity doesn't require certainty; we can state the main finding plainly and attach a specific limitation to the same sentence.",
        '清楚不代表必須確定；我們可以直接陳述主要發現，並在同一句附上具體限制。',
      ],
      [
        "Let's also replace specialist jargon where a familiar phrase would preserve the meaning, rather than assuming technical language guarantees precision.",
        '若日常用語能保留意思，我們也把專業術語換掉，不要假設技術語言就一定精確。',
      ],
      [
        "I'll ask a reader outside the field to explain the message back to us, which should reveal any remaining ambiguity.",
        '我會請一位領域外的讀者向我們轉述訊息，這應該能找出剩下的模糊之處。',
      ],
    ],
  ],
  [
    'C1',
    'green-claims',
    '產品永續標示的證據',
    [
      [
        'The packaging calls the product environmentally friendly, but the claim seems to rest entirely on a reduction in shipping weight.',
        '包裝宣稱產品環保，但這個說法似乎完全建立在運送重量降低這一點上。',
      ],
      [
        "That could be a meaningful improvement, though it doesn't establish that the overall environmental impact is lower across the life cycle.",
        '那可能是有意義的改善，但不足以證明整個生命週期的環境衝擊都比較低。',
      ],
      [
        "We'd need comparable information about production, use, and disposal, with the boundaries of the assessment made explicit.",
        '我們需要生產、使用和廢棄處理的可比較資訊，並明確說明評估界線。',
      ],
      [
        'And any comparison should use a relevant benchmark, rather than a selectively chosen alternative that makes the product look favourable.',
        '而且比較應採用相關的基準，不能挑一個特別有利於自家產品的替代品。',
      ],
      [
        'Would a narrower statement about packaging weight be more defensible until the broader claim can be independently verified?',
        '在更廣泛的宣稱能獲得獨立驗證之前，只陳述包裝重量的減少是否比較站得住腳？',
      ],
      [
        'Yes; specifying the improvement and its limits would give customers useful information without inviting them to infer more than the evidence supports.',
        '是的；說清楚改善內容及限制，既能提供有用資訊，也不會引導顧客推論出超過證據支持的結論。',
      ],
    ],
  ],
  [
    'C1',
    'cross-border-partnership',
    '跨國合作前釐清責任',
    [
      [
        "The partners agree on the commercial objective, but they're using the same terms to describe obligations that differ between jurisdictions.",
        '合作雙方認同商業目標，卻用相同術語描述在不同司法管轄地有所差異的義務。',
      ],
      [
        'We should have the relevant specialists identify those differences before treating the draft as a shared understanding of responsibility.',
        '我們應該先請相關專業人員找出差異，再把草案視為對責任的共同理解。',
      ],
      [
        "There's also a localisation issue: a literal translation may preserve the wording while obscuring what each party expects in practice.",
        '這也牽涉在地化：直譯可能保留文字，卻掩蓋雙方在實務上的期待。',
      ],
      [
        'Could we work through a few realistic scenarios, including a delay, a disputed deliverable, and a request to change the scope?',
        '我們能否逐一討論幾個真實可能發生的情境，包括延誤、交付成果爭議，以及變更範疇的要求？',
      ],
      [
        'That should expose assumptions early, provided the resulting clarifications are reflected in the documents that will govern the partnership.',
        '那應該能提早揭露假設，前提是釐清結果會反映在規範合作關係的正式文件中。',
      ],
      [
        "I'll arrange that discussion and flag the points requiring specialist review, rather than trying to resolve legal differences through wording alone.",
        '我會安排討論，並標出需要專業審查的部分，不會只靠調整措辭來處理法律差異。',
      ],
    ],
  ],
  [
    'C1',
    'film-critique',
    '含蓄的電影是否更有力量',
    [
      [
        "I found the film's restraint compelling, especially the way the final scene leaves the central conflict unresolved without feeling incomplete.",
        '我覺得這部電影的克制很有吸引力，尤其最後一幕沒有解決核心衝突，卻不讓人覺得殘缺。',
      ],
      [
        'I admired that too, although the repeated images of empty rooms occasionally struck me as more deliberate than evocative.',
        '我也欣賞這一點，不過空房間的重複畫面，有時讓我覺得刻意多於能喚起感受。',
      ],
      [
        "Perhaps their repetition is what makes the slight change in the last shot resonate; we're primed to notice an otherwise ordinary detail.",
        '也許正因為重複，最後鏡頭的細微變化才引起共鳴；我們因此留意到原本平凡的細節。',
      ],
      [
        "That's a persuasive reading, but I still wonder whether the symbolism leaves enough room for the characters to feel spontaneous.",
        '這個解讀很有說服力，但我仍想知道，象徵安排是否留了足夠空間，讓角色顯得自然。',
      ],
      [
        'For me, the awkward pauses provide that room, since they resist the neat explanations the visual structure seems to promise.',
        '對我而言，那些尷尬的停頓提供了空間，因為它們抗拒了視覺結構似乎預告的整齊解釋。',
      ],
      [
        'I might watch it again with that in mind; our disagreement seems to concern the balance between formal control and emotional openness.',
        '我可能會帶著這個想法再看一次；我們的分歧似乎在於形式掌控與情感開放之間的平衡。',
      ],
    ],
  ],
  [
    'C1',
    'planning-under-uncertainty',
    '不確定下保留調整空間',
    [
      [
        'The forecast offers a useful starting point, but building the entire plan around its central estimate would leave us little room to adapt.',
        '預測提供了有用的起點，但如果整個計畫都依中心估計值制定，我們就沒什麼調整空間。',
      ],
      [
        'Would scenario planning help us identify decisions that remain sensible across several plausible futures, rather than trying to predict one outcome?',
        '情境規劃能否幫我們找出在幾種合理未來下都適當的決策，而不是試圖預測單一結果？',
      ],
      [
        'Yes, particularly where an early commitment would be difficult to reverse and the information available is likely to improve over time.',
        '可以，尤其在初期投入難以逆轉，而可用資訊很可能隨時間改善的情況下。',
      ],
      [
        "We shouldn't confuse keeping options open with postponing every decision, though; delay can carry costs and close off opportunities too.",
        '不過，我們不應把保留選項等同於延後所有決策；拖延也有成本，也可能讓機會消失。',
      ],
      [
        "Then let's distinguish reversible steps we can take now from commitments that should depend on specific signals or additional evidence.",
        '那我們區分現在就能採取的可逆步驟，以及應等待特定訊號或更多證據才做的承諾。',
      ],
      [
        "That would make the plan actionable while preserving flexibility, especially if we agree in advance when and why we'll revisit it.",
        '那能讓計畫具體可行，也保留彈性，尤其是先約定何時以及基於什麼原因重新檢視。',
      ],
    ],
  ],
]

export const starterEnglishDialogues: EnglishPracticeDocument[] = units.map(([level, slug, title, sentences]) => ({
  id: `keylingua-starter-en-dialogue-${level.toLowerCase()}-${slug}`,
  title,
  level,
  source: 'manual',
  createdAt: '2026-09-10T00:00:00.000Z',
  sentences: sentences.map(([text, meaning], index) => ({ text, meaning, speaker: index % 2 === 0 ? 'A' : 'B' })),
}))
