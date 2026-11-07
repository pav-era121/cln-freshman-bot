// ============================================================
// CLN FRESHMAN - INTELLIGENT AUTOMATED AD ROTATION ENGINE
// ============================================================
// Features:
// 1. 18 Diverse, high-converting ad copies (Bilingual: Amharic & English)
// 2. Automated rotation: No manual work needed
// 3. Frequency Cap: An ad is posted at most 2 times in any calendar month
// 4. Consecutive Guard: An ad is NEVER posted on consecutive days
// 5. One-Time Manual Override: PAM can set a custom ad with /set_ad.
//    Once posted, the system automatically reverts to rotation!

const AD_POOL = [
  {
    id: 1,
    title: '4.0 GPA Mindset & Consistency',
    content: `🎯 <b>START YOUR WEEK WITH A 4.0 GPA MINDSET! / በብልሃት አጥንተው ከፍተኛ GPA ያስመዝግቡ!</b> 🚀📚

ፈተና ሊደርስ ጥቂት ቀናት ሲቀሩ መጨናነቅ እና እንቅልፍ ማጣት ይብቃ! 4.0 GPA ማምጣት የሚጀምረው በየቀኑ በምናደርገው ጥቂት ዝግጅት ነው።

💡 በ <b>CLN Freshman Web App</b> በየቀኑ 20 ደቂቃ ብቻ በመመደብ የሁሉንም 13 ኮርሶች ኖቶች እና ማብራሪያዎች በቀላሉ ይከታተሉ:
• 📖 <b>13 ሙሉ ኮርሶች:</b> Logic, Physics, Psychology, Math, Emerging Tech, Economics...
• 🎁 <b>ምዕራፍ 1 በነፃ (100% FREE):</b> ሳንቲም ሳይከፍሉ የሁሉንም ኮርሶች ምዕራፍ 1 አሁኑኑ ያንብቡ!
• 🏆 <b>Daily Streaks:</b> በየቀኑ በማጥናት ፖይንት ያከማቹ፣ ራስዎን ይፈትሹ።

🔥 <i>Don't wait for exam week stress. Start building your top GPA today!</i>

👇 <b>ከታች ያለውን "Launch Web App" በመጫን አሁኑኑ ነፃ ኖቶችን ማንበብ ይጀምሩ:</b>`
  },
  {
    id: 2,
    title: 'Free Chapter 1 Across All 13 Courses',
    content: `🎁 <b>ምዕራፍ 1 ለሁሉም ኮርሶች 100% በነፃ! / CHAPTER 1 IS TOTALLY FREE!</b> 📖✨

የ CLN Freshman Web Appን እስካሁን አልሞከሩትም? 
ምንም ክፍያ ሳያስፈልግ የሁሉንም 13 የፍሬሽማን ኮርሶች የመጀመሪያ ምዕራፍ ኖቶች በነፃ ገብተው ማንበብ ይችላሉ!

🌟 <b>በነፃ የሚያገኟቸው ነገሮች:</b>
✅ የተጠቃለሉ እና የተብራሩ የ <b>Chapter 1 PDF ኖቶች</b>
✅ በስልክ ለማንበብ እጅግ ምቹ የሆነ የንባብ ገፅ (Smart PDF Reader)
✅ የምዕራፍ ማጠቃለያ ጥያቄዎች (Quizzes) ከነመልሶቻቸው

ሳይከፍሉ አይተው ይወስኑ! ጥራቱን ወደውት መቀጠል ከፈለጉ የሙሉ ሴሚስተር ፓስ በ <b>320 ብር ብቻ</b> ይክፈቱ!

👇 <b>ከታች Launch Web App የሚለውን ተጭነው በነፃ መማር ይጀምሩ:</b>`
  },
  {
    id: 3,
    title: 'Exam Question Bank & Detailed Solutions',
    content: `📝 <b>የ MIDTERM እና FINAL ፈተናዎችን በቀላሉ ለማለፍ ዝግጁ ኖት?</b> 🎓⚡

በዩኒቨርሲቲ ፈተናዎች ላይ ብዙ ተማሪዎች የሚቸገሩት ጥያቄዎች እንዴት እንደሚመጡ ባለማወቃቸው ነው!

CLN Freshman ለዚህ ፍቱን መፍትሄ ይዞ መጥቷል:
🎯 <b>በመቶዎች የሚቆጠሩ የሞዴል ፈተናዎች:</b> ካለፉት አመታት የ AAU ፈተናዎች የተውጣጡ ጥያቄዎች
🎯 <b>ዝርዝር ማብራሪያ (Step-by-Step Solutions):</b> ትክክለኛው መልስ ለምን እንደተመረጠ የሚያስረዱ ማብራሪያዎች
🎯 <b>የፈተና ፍርሃትን የሚያጠፋ ልምምድ:</b> ፈተና ከመድረሱ በፊት እራስዎን በጊዜ ገደብ ይፈትሹ!

ለ A+ ውጤት ኖት ብቻ ማንበብ በቂ አይደለም፤ ጥያቄዎችን በተግባር ይስሩ!

👇 <b>አሁኑኑ Web Appን በመክፈት የፈተና ጥያቄዎችን መስራት ይጀምሩ:</b>`
  },
  {
    id: 4,
    title: 'Logic & Critical Thinking (PHIL 1011)',
    content: `🧠 <b>LOGIC & CRITICAL THINKING አስቸግሮዎታል? / MASTER PHIL 1011 EASILY!</b> 💡📐

Logic የብዙ ፍሬሽማን ተማሪዎችን GPA ከሚቀንሱ ኮርሶች ዋነኛው ነው። Fallacies፣ Categorical Syllogisms እና Truth Tables ያደናግሩዎታል?

አይጨነቁ! በ CLN Freshman Web App:
💡 የተወሳሰቡ ጽንሰ-ሀሳቦች በቀላል እና ግልጽ ቋንቋ ተብራርተዋል
💡 ሁሉም Informal Fallacies ከምሳሌዎች ጋር በማጠቃለያ ኖት ተዘጋጅተዋል
💡 ተደጋግመው የሚወጡ የፈተና ጥያቄዎች ከነሙሉ ማብራሪያቸው ተካተዋል

ከባዱን ኮርስ ወደ ቀላል የ A ውጤት መቀየር ይችላሉ!

👇 <b>የተጠቃለሉትን የ Logic ኖቶች አሁኑኑ በነፃ ይመልከቱ:</b>`
  },
  {
    id: 5,
    title: 'General Physics (PHYS 1011) Mastery',
    content: `⚡ <b>GENERAL PHYSICS (PHYS 1011) — ፎርሙላዎች እና ጽንሰ-ሀሳቦች አልገቡዎትም?</b> 🔭🧲

Vectors፣ Kinematics፣ Dynamics እና Work-Energy Theorem በፈተና ላይ እንዳያስጨንቁዎት!

በ CLN Freshman Web App ውስጥ:
✅ እያንዳንዱ ፎርሙላ እንዴት እና መቼ እንደሚሰራ የሚያሳዩ ቀላል ማጠቃለያዎች
✅ የቁጥር ጥያቄዎች ደረጃ በደረጃ (Step-by-step calculations)
✅ ያለፉት አመታት የ Physics Midterm እና Final ጥያቄዎች ከነመልሶቻቸው

ፊዚክስን በግልጽ ተረድተው በከፍተኛ ውጤት ይለፉ!

👇 <b>ከታች ያለውን ሊንክ ተጭነው የ Physics ኖቶችን አሁኑኑ ይመልከቱ:</b>`
  },
  {
    id: 6,
    title: 'Applied Mathematics (MATH 1011/1012)',
    content: `📐 <b>FRESHMAN APPLIED MATHEMATICS MADE SIMPLE! / ሂሳብን በቀላሉ ይረዱ!</b> 📊✨

Limits, Continuity, Derivatives ወይስ Matrices አስፈርተዎታል?

ትክክለኛውን የአሰራር ዘዴ ካወቁ ሂሳብ ሙሉ ውጤት (A+) ለማምጣት ቀላሉ ኮርስ ነው!
🔹 <b>ቀላል ማጠቃለያዎች:</b> ረጅም ፎርሙላዎችን የሚያሳጥሩ ዘዴዎች
🔹 <b>የተሰሩ ምሳሌዎች:</b> ተደጋግመው የሚወጡ የፈተና ጥያቄዎች አሰራር
🔹 <b>ሞዴል ፈተናዎች:</b> ከነሙሉ ማብራሪያቸውና መልሶቻቸው

ፍርሃትዎን ወደ ሙሉ ውጤት ይቀይሩ!

👇 <b>አሁኑኑ Web Appን ከፍተው የ Math ኖቶችን በነፃ ይሞክሩ:</b>`
  },
  {
    id: 7,
    title: 'General Psychology (PSYC 1011) High-Yield',
    content: `🧩 <b>GENERAL PSYCHOLOGY (PSYC 1011) — HIGH-YIELD EXAM DEFINITIONS!</b> 🧠📖

የ Psychology ኮርስ ሰፊ ንባብና በርካታ ንድፈ-ሀሳቦችን (Theories) የያዘ በመሆኑ ፈተና ላይ መምታታት ሊፈጥር ይችላል።

CLN Freshman ምን አዘጋጅቶላችኋል?
⭐ Learning Theories (Classical & Operant Conditioning) በንፅፅር
⭐ Memory stages, forgetting theories & cognitive psychology
⭐ በፈተና ላይ በቀጥታ የሚመጡ የውሳኔ ጥያቄዎች (Scenario-based MCQs)

በጥቂት ሰዓታት ውስጥ ሙሉውን ምዕራፍ የሚሸፍኑ ጥራት ያላቸው ኖቶችን ያግኙ!

👇 <b>Chapter 1ን በነፃ አሁኑኑ ማንበብ ይጀምሩ:</b>`
  },
  {
    id: 8,
    title: 'Social Anthropology (ANTH 1012) & Global Affairs',
    content: `🌍 <b>ANTHROPOLOGY & GLOBAL AFFAIRS — ረጅም ፒዲኤፍ ማንበብ ደክሞዎታል?</b> 📚🏛️

መቶዎች ገጾችን የያዙ የ Anthropology (ANTH 1012) እና Global Affairs ፒዲኤፎችን እያነበቡ ጊዜዎን አያባክኑ!

የ CLN ማጠቃለያዎች:
🎯 ዋና ዋና የፈተና ነጥቦችን ብቻ ነቅሰው ያወጣሉ
🎯 የንድፈ-ሀሳቦች እና ጽንሰ-ሀሳቦች አጭርና ግልጽ ማብራሪያ
🎯 የ Midterm እና Final ጥያቄዎች ከነመልሶቻቸው

ጊዜዎን ይቆጥቡ፣ በብልሃት አጥንተው ፈተናዎን በ A+ ይለፉ!

👇 <b>የተጠቃለሉ ኖቶችን አሁኑኑ በ Web App ላይ ያንብቡ:</b>`
  },
  {
    id: 9,
    title: 'Economics (Micro/Macro) & Entrepreneurship',
    content: `📈 <b>ECONOMICS & ENTREPRENEURSHIP — ፅንሰ-ሀሳቦችን በቀላሉ ይጨብጡ!</b> 💼💡

Demand & Supply, Elasticity, Market Structures እና Business Planning በፈተና ላይ ሲመጡ እንዳይደናገጡ!

በ CLN Freshman Web App:
📊 የግራፍና የቁጥር ስሌቶች ግልጽ ማብራሪያ
📊 በፈተና ላይ ተደጋግመው የሚመጡ የ Economics ሞዴል ጥያቄዎች
📊 የ Entrepreneurship ዋና ዋና ርዕሶች ማጠቃለያ

በራስ መተማመን ፈተናዎን ይጋፈጡ!

👇 <b>ከታች Launch Web App የሚለውን ተጭነው አሁኑኑ ይመልከቱ:</b>`
  },
  {
    id: 10,
    title: 'Emerging Technology (EMTE 1012) Key Concepts',
    content: `🤖 <b>EMERGING TECHNOLOGY (EMTE 1012) — AI, IOT & BLOCKCHAIN MADE CLEAR!</b> 🌐⚡

የዘመናችንን የቴክኖሎጂ ኮርስ በቀላሉ ተረድተው በከፍተኛ ውጤት ማለፍ ይፈልጋሉ?

CLN Freshman ያዘጋጀላችሁ:
💡 AI, Machine Learning & Data Science ዋና ዋና ነጥቦች
💡 Internet of Things (IoT) እና Blockchain አሰራሮች
💡 የ Cloud Computing እና Cybersecurity ፈተና ተኮር ማጠቃለያዎች

ሳይወሳሰብ በቀላሉ ይረዱት!

👇 <b>አሁኑኑ Web Appን በመክፈት የ Emerging Tech ኖቶችን ያግኙ:</b>`
  },
  {
    id: 11,
    title: 'Freshman Leaderboard & Gamified Quizzes',
    content: `🏆 <b>የሳምንቱ ምርጥ ተማሪ ማን ይሆን? / CLIMB THE FRESHMAN LEADERBOARD!</b> 🥇🥈🥉

እውቀትዎን ከሌሎች የኢትዮጵያ ዩኒቨርሲቲ ፍሬሽማን ተማሪዎች ጋር ለመፈተሽ ዝግጁ ኖት?

CLN Freshman አዲሱን የ <b>Leaderboard & Points</b> ስርዓት ይዞላችሁ መጥቷል:
🔥 <b>Quiz ይስሩ:</b> በእያንዳንዱ ትክክለኛ መልስ ነጥብ (pts) ያግኙ
🔥 <b>Streak ይጠብቁ:</b> በየቀኑ በመግባት የጥናት ቀናትዎን (Streak) ያሳድጉ
🔥 <b>Top 3 ውስጥ ይግቡ:</b> በግሩፑ እና በቦቱ ላይ ስምዎ ከሜዳሊያ ጋር በክብር እንዲታይ ያድርጉ!

እስቲ አሁኑኑ ገብተው ራስዎን ይፈትሹና ደረጃዎን ይመልከቱ! 🏅

👇 <b>Launch Web App የሚለውን ተጭነው ጥያቄዎችን በመመለስ ነጥብ ያከማቹ:</b>`
  },
  {
    id: 12,
    title: 'Dorm Squad & Group Deals (Save up to 45%)',
    content: `👥 <b>DORM SQUAD DEAL — ከዶርም ጓደኞችዎ ጋር ተቀላቅለው እስከ 45% ቅናሽ ያግኙ!</b> 💰🔥

አብሮ ማጥናት ውጤታማ ያደርጋል፤ ወጪንም ይቀንሳል!

ከዶርም ወይም ከክፍል ጓደኞችዎ ጋር በመሆን ልዩ ቅናሾችን ተጠቃሚ ይሁኑ:
🎉 <b>Solo Pass (1 ተማሪ):</b> 320 Birr
🎉 <b>Dorm Squad Combo (4 ተማሪዎች):</b> 1,600 Birr (በአንድ ተማሪ 400 ETB ብቻ — ሁለቱንም Web App + Prep ያካትታል!)
🎉 <b>Floor / Section Deal (8 ተማሪዎች):</b> በአንድ ተማሪ 250 ETB ብቻ!

ጓደኞችዎን ይዘው አብረው ይዘጋጁ፣ አብረው ከፍተኛ GPA ያስመዝግቡ!

👇 <b>ዝርዝር ዋጋዎችንና ጥቅሎችን በ Web App ላይ ይመልከቱ:</b>`
  },
  {
    id: 13,
    title: 'Smart Mobile PDF Reader Feature',
    content: `📱 <b>በስልክዎ ለማንበብ ምቹ የሆነው SMART PDF READER!</b> 📖✨

ትላልቅ ማጣቀሻ መጽሐፍትን (Reference Books) መሸከም ወይም በስልክ ለማንበብ የሚከብዱ ፒዲኤፎችን ማጉላት ሰልችቶዎታል?

የ CLN Freshman Web App የንባብ ገፅ:
🔍 <b>Optimal 115% Zoom:</b> ለሞባይል ስክሪን ልክ ተደርጎ የተስተካከለ
⚡ <b>ፈጣን አሰራር:</b> በደካማ ኔትወርክም ያለምንም መቆራረጥ የሚሰራ
🔖 <b>የተጠቃለለ ይዘት:</b> አስፈላጊ ነጥቦች ብቻ በደማቅ የተለዩበት

በዶርም፣ በቤተ-መጽሐፍት ወይም በካፌ ሆነው በምቾት ያንብቡ!

👇 <b>ከታች ያለውን ሊንክ በመጫን አሁኑኑ መማር ይጀምሩ:</b>`
  },
  {
    id: 14,
    title: 'Weekend Quick Revision & Habit Building',
    content: `☕📖 <b>የሳምንት መጨረሻ ፈጣን ክለሳ / WEEKEND SMART REVISION</b> 🌟

ለሚቀጥለው ሳምንት ሌክቸሮች ዝግጁ ኖት? ቅዳሜ እና እሁድ ላይ በቀን 15 ደቂቃ ብቻ በመመደብ ከሌሎች ተማሪዎች አንድ እርምጃ ቀድመው ይጓዙ!

✨ <b>ለምን የ CLN Web App?</b>
📱 <b>በስልክዎ በማንኛውም ቦታ:</b> ዶርም፣ ካፌ ወይም ቤተ-መጽሐፍት ሆነው በቀላሉ ያንብቡ
🔎 <b>Smart PDF Reader:</b> ለማንበብ ምቹ የሆነ የዙም አቀማመጥ
💰 <b>ተመጣጣኝ ዋጋ:</b> የሙሉ ሴሚስተር ፓስ በ <b>320 ብር ብቻ</b>

🌟 <i>"ስኬት ማለት በየቀኑ የምናደርጋቸው ትናንሽ ጥረቶች ድምር ውጤት ነው!"</i>

👇 <b>ከታች ያለውን ሊንክ ተጭነው የሳምንቱን ክለሳ ይጀምሩ:</b>`
  },
  {
    id: 15,
    title: 'Beating Procrastination & Exam Panic',
    content: `⏰ <b>ነገ አጠናለሁ እያሉ ጊዜዎ አልቆብዎታል? / BEAT PROCRASTINATION NOW!</b> 🛑📖

"ጊዜ ገና ነው" እያሉ ፈተና ሲቃረብ መጨናነቅ የብዙ ተማሪዎች ልማድ ነው። ነገር ግን የፍሬሽማን ውጤት ለቀጣይ የትምህርት መስክ ምርጫ ወሳኝ ነው!

ዛሬውኑ ይጀምሩ:
✅ በእያንዳንዱ ኮርስ 1 ምዕራፍ በነፃ ያንብቡ
✅ ራስዎን በፈተና ጥያቄዎች ፈትሹ
✅ የቀን Streakዎን በመጠበቅ የጥናት ልምድ ያዳብሩ

ትንሽ ጥረት በየቀኑ = በፈተና ወቅት ሰላማዊ እንቅልፍ እና A+ ውጤት!

👇 <b>አሁኑኑ Web Appን በመክፈት የመጀመሪያውን ምዕራፍ ይጀምሩ:</b>`
  },
  {
    id: 16,
    title: 'VIP Combo Pass (Web App + Question Prep)',
    content: `👑 <b>VIP COMBO PASS — ሁለቱንም በአንድ ላይ (BEST VALUE!)</b> 🔥🎓

የፍሬሽማን ትምህርትዎን ሙሉ በሙሉ አስተማማኝ ለማድረግ የተዘጋጀ ምርጥ ጥቅል!

<b>VIP Combo Pass ምን ያካትታል?</b>
1️⃣ <b>CLN Courses Web App:</b> የ 13ቱም ኮርሶች ሙሉ ምዕራፎች፣ ኖቶች እና ማጠቃለያዎች
2️⃣ <b>CLN Question Prep:</b> በመቶዎች የሚቆጠሩ የፈተና ጥያቄዎች ከነዝርዝር ማብራሪያቸው
💰 <b>ዋጋ:</b> በ <b>500 ብር ብቻ</b> <s>(700 ብር)</s> — <b>200 ብር ይቆጥቡ!</b>

ሁሉንም በአንድ ቦታ አግኝተው ለ 4.0 GPA በልበ ሙሉነት ይዘጋጁ!

👇 <b>ፓኬጆችን ለማየትና ለማግበር ከታች ያለውን አዝራር ይጫኑ:</b>`
  },
  {
    id: 17,
    title: 'Tricky Multiple Choice Exam Strategies',
    content: `🎯 <b>በፈተና ላይ አሳሳች (TRICKY) ጥያቄዎችን እንዴት መለየት ይቻላል?</b> 🧐📝

የዩኒቨርሲቲ ፈተና ጥያቄዎች በቀላሉ የተመሳሳይ መልሶች ማጭበርበሪያዎችን (Distractors) ይይዛሉ።

ትክክለኛውን መልስ በቅጽበት ለማወቅ:
🔹 የተሳሳቱ ምርጫዎችን የማስወገድ ስልት (Process of Elimination)
🔹 የጥያቄዎችን ቁልፍ ቃላት (Keywords: NOT, EXCEPT, ALWAYS) ማስተዋል
🔹 በ CLN Web App ውስጥ የተብራሩ የፈተና ሞዴሎችን ደጋግሞ መስራት

ፈተናን በልምድና በብልሃት ያሸንፉ!

👇 <b>የሞዴል ፈተና ጥያቄዎችን አሁኑኑ በ Web App ላይ ይለማመዱ:</b>`
  },
  {
    id: 18,
    title: 'Freshman GPA Survival Guide & Priorities',
    content: `🛡️ <b>FRESHMAN GPA SURVIVAL GUIDE — ውጤትዎን ከአደጋ ይጠብቁ!</b> 📊🎓

የክሬዲት ሰዓት (Credit Hours) በ GPA ላይ ያለውን ተፅዕኖ ያውቃሉ? 4 እና 5 ክሬዲት ያላቸው ኮርሶች (እንደ Math እና Physics) ላይ ዝቅተኛ ውጤት ከመጣ አጠቃላይ GPAን በእጅጉ ያወርዱታል!

ስልታዊ ጥናት ያድርጉ:
💡 ክብደት ላላቸው ኮርሶች ቅድሚያ በመስጠት የተጠቃለሉ ኖቶችን ያንብቡ
💡 በፈተና ወቅት የሚያጋጥሙ ክፍተቶችን ቀድመው በሞዴል ጥያቄዎች ይለዩ
💡 የ Chapter 1 ነፃ ኖቶችን በማንበብ አሁኑኑ መሰረትዎን ያጠናክሩ

የወደፊት የትምህርት መስክዎን ምርጫ በከፍተኛ GPA ያረጋግጡ!

👇 <b>ከታች ያለውን ሊንክ በመጫን በነፃ ማንበብ ይጀምሩ:</b>`
  }
];

function getEthiopiaDateStr(date = new Date()) {
  try {
    return date.toLocaleDateString('en-CA', { timeZone: 'Africa/Addis_Ababa' });
  } catch (_) {
    return date.toISOString().split('T')[0];
  }
}

async function getAdRotationState(supabase) {
  try {
    const { data } = await supabase
      .from('announcements')
      .select('id, content')
      .eq('category', 'system_daily_ad')
      .eq('title', 'cln_ad_rotation_state')
      .maybeSingle();

    if (data?.content) {
      try {
        const parsed = JSON.parse(data.content);
        return {
          manualAd: parsed.manualAd || null,
          history: Array.isArray(parsed.history) ? parsed.history : [],
          lastPostedAdId: parsed.lastPostedAdId || null,
          lastPostedDate: parsed.lastPostedDate || null
        };
      } catch (_) {}
    }
  } catch (err) {
    console.warn('⚠️ Could not load ad rotation state from Supabase:', err.message);
  }

  return {
    manualAd: null,
    history: [],
    lastPostedAdId: null,
    lastPostedDate: null
  };
}

async function saveAdRotationState(supabase, state) {
  try {
    const payload = JSON.stringify({
      manualAd: state.manualAd || null,
      history: state.history || [],
      lastPostedAdId: state.lastPostedAdId || null,
      lastPostedDate: state.lastPostedDate || null,
      updated_at: new Date().toISOString()
    });

    const { data: existing } = await supabase
      .from('announcements')
      .select('id')
      .eq('category', 'system_daily_ad')
      .eq('title', 'cln_ad_rotation_state')
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('announcements')
        .update({ content: payload, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('announcements')
        .insert({
          title: 'cln_ad_rotation_state',
          category: 'system_daily_ad',
          content: payload,
          is_published: false
        });
    }
  } catch (err) {
    console.error('❌ Failed to save ad rotation state:', err.message);
  }
}

// Selects the next daily ad obeying all constraints:
// 1. One-time manual ad takes priority if set.
// 2. An ad is shown AT MOST 2 times in the current calendar month.
// 3. An ad is NEVER shown on consecutive days.
function selectNextDailyAd(state, dateStr = getEthiopiaDateStr()) {
  // 1. Priority: One-time manual override
  if (state.manualAd && state.manualAd.trim()) {
    return {
      isManual: true,
      content: state.manualAd.trim(),
      title: 'Manual Custom Override (One-Time)',
      adId: null
    };
  }

  // 2. Automatic Rotation Logic
  const currentMonth = dateStr.slice(0, 7); // 'YYYY-MM'
  const monthHistory = (state.history || []).filter(
    (h) => h.date && h.date.startsWith(currentMonth) && !h.isManual
  );

  // Count usage per ad this month
  const usageCount = {};
  for (const ad of AD_POOL) {
    usageCount[ad.id] = 0;
  }
  for (const h of monthHistory) {
    if (h.adId) {
      usageCount[h.adId] = (usageCount[h.adId] || 0) + 1;
    }
  }

  const lastAdId = state.lastPostedAdId;

  // Filter candidates: count < 2 AND id !== lastAdId
  const eligible = AD_POOL.filter((ad) => {
    if ((usageCount[ad.id] || 0) >= 2) return false;
    if (ad.id === lastAdId) return false;
    return true;
  });

  let chosenAd;
  if (eligible.length > 0) {
    // Sort: 1) Lowest usage count this month, 2) Least recently used overall
    eligible.sort((a, b) => {
      const countDiff = (usageCount[a.id] || 0) - (usageCount[b.id] || 0);
      if (countDiff !== 0) return countDiff;

      const lastA = [...(state.history || [])].reverse().find((h) => h.adId === a.id)?.date || '1970-01-01';
      const lastB = [...(state.history || [])].reverse().find((h) => h.adId === b.id)?.date || '1970-01-01';
      return lastA.localeCompare(lastB);
    });
    chosenAd = eligible[0];
  } else {
    // Extreme fallback (if all ads exhausted max count): pick any ad not equal to yesterday with lowest count
    const fallback = AD_POOL.filter((ad) => ad.id !== lastAdId).sort(
      (a, b) => (usageCount[a.id] || 0) - (usageCount[b.id] || 0)
    );
    chosenAd = fallback[0] || AD_POOL[0];
  }

  return {
    isManual: false,
    content: chosenAd.content,
    title: chosenAd.title,
    adId: chosenAd.id,
    monthCount: (usageCount[chosenAd.id] || 0) + 1
  };
}

// Records that an ad has been posted:
// If it was manual, clears state.manualAd so it immediately reverts to automatic!
async function recordAdPosted(supabase, state, selectedAd, dateStr = getEthiopiaDateStr()) {
  const isManual = Boolean(selectedAd.isManual);

  if (isManual) {
    state.manualAd = null; // Revert back to automatic rotation!
    state.history.push({
      date: dateStr,
      isManual: true,
      title: 'Manual Custom Post',
      postedAt: new Date().toISOString()
    });
  } else {
    state.history.push({
      date: dateStr,
      adId: selectedAd.adId,
      isManual: false,
      title: selectedAd.title,
      postedAt: new Date().toISOString()
    });
    state.lastPostedAdId = selectedAd.adId;
    state.lastPostedDate = dateStr;
  }

  // Keep history manageable (last 60 records)
  if (state.history.length > 60) {
    state.history = state.history.slice(-60);
  }

  // Save updated state
  await saveAdRotationState(supabase, state);

  // Sync with legacy cln_custom_group_ad for backwards compatibility
  try {
    const { data: legacyRow } = await supabase
      .from('announcements')
      .select('id')
      .eq('category', 'system_daily_ad')
      .eq('title', 'cln_custom_group_ad')
      .maybeSingle();

    if (legacyRow?.id) {
      await supabase
        .from('announcements')
        .update({ content: selectedAd.content, updated_at: new Date().toISOString() })
        .eq('id', legacyRow.id);
    }
  } catch (_) {}
}

async function setOneTimeManualAd(supabase, text) {
  const state = await getAdRotationState(supabase);
  state.manualAd = text.trim();
  await saveAdRotationState(supabase, state);
  return state;
}

async function clearManualAd(supabase) {
  const state = await getAdRotationState(supabase);
  state.manualAd = null;
  await saveAdRotationState(supabase, state);
  return state;
}

function getAdStatusSummary(state, dateStr = getEthiopiaDateStr()) {
  const currentMonth = dateStr.slice(0, 7);
  const monthHistory = (state.history || []).filter(
    (h) => h.date && h.date.startsWith(currentMonth)
  );

  const usageCount = {};
  for (const ad of AD_POOL) usageCount[ad.id] = 0;
  for (const h of monthHistory) {
    if (!h.isManual && h.adId) {
      usageCount[h.adId] = (usageCount[h.adId] || 0) + 1;
    }
  }

  const manualCount = monthHistory.filter((h) => h.isManual).length;
  const nextAd = selectNextDailyAd(state, dateStr);

  return {
    dateStr,
    currentMonth,
    hasManualOverride: Boolean(state.manualAd),
    manualAdText: state.manualAd || null,
    nextAd,
    totalPoolSize: AD_POOL.length,
    monthPostsCount: monthHistory.length,
    manualPostsThisMonth: manualCount,
    usageCount
  };
}

module.exports = {
  AD_POOL,
  getEthiopiaDateStr,
  getAdRotationState,
  saveAdRotationState,
  selectNextDailyAd,
  recordAdPosted,
  setOneTimeManualAd,
  clearManualAd,
  getAdStatusSummary
};
