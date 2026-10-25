const express = require('express');
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const bot = new Telegraf(process.env.BOT_TOKEN);

// Global Telegraf error handling
bot.catch((err, ctx) => {
  console.error(`⚠️ Telegraf error on ${ctx?.updateType}:`, err.message);
});

// Process-level resilience against network resets
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Network / Unhandled Rejection:', (reason && reason.message) || reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', (err && err.message) || err);
});

const WEBAPP_URL =
  process.env.WEBAPP_URL || 'https://cln-freshman-frontend.vercel.app/';

const PREP_URL = 'https://cln-freshman-prep.vercel.app/';
const GROUP_URL = 'https://t.me/CLNfreshman444';
const GROUP_CHAT_ID = '-1003782574747'; // Verified Supergroup ID for @CLNfreshman444
const ADMIN_USERNAME = 'CLN_AAU_Admin';
const ADMIN_URL = 'https://t.me/CLN_AAU_Admin';
const PAM_TELEGRAM_ID = 5572599116; // Verified Owner PAM (@PAKMNJB) - EXCLUSIVE BROADCAST & AD PERMISSION

const DEFAULT_DAILY_AD = `🔥 <b>STUDY SMARTER, NOT HARDER FOR YOUR FRESHMAN EXAMS! / በብልሃት አጥንተው ከፍተኛ GPA ያስመዝግቡ!</b> 🎓📖

ፈተና ሊደርስ ጥቂት ቀናት ሲቀሩ መጨነቅ ይብቃ! የዩኒቨርሲቲን ፈተና በከፍተኛ ውጤት ለማለፍ የሚያስፈልጉዎትን ኖቶች እና የፈተና ጥያቄዎች በ <b>CLN Freshman Web App</b> ያግኙ።

🌟 <b>ለምን በ CLN Freshman Web App ይጠቀማሉ?</b>
✅ <b>13 ሙሉ ኮርሶች:</b> Psychology, Physics, Logic, Emerging Technology, Economics, Global Affairs, Entrepreneurship, Math, Anthropology, Physical Fitness & others.
✅ <b>ምዕራፍ 1 በነፃ (100% FREE):</b> ሳይከፍሉ የሁሉንም ኮርሶች የመጀመሪያ ምዕራፍ ኖቶች ማንበብ ይችላሉ!
✅ <b>ሞዴል ፈተናዎች ከነማብራሪያቸው:</b> ያለፉት ዓመታት የ Midterm እና Final ፈተናዎች ከተሟላ መልስ ጋር::
✅ <b>ቀላል እና ፈጣን:</b> ያለምንም መቆራረጥ በስልክዎ ላይ በቀጥታ የሚሰራ::

💡 <i>Join hundreds of freshmen already preparing for their top grades!</i>

👇 <b>ከታች ያለውን ሊንክ በመጫን አሁኑኑ ነፃ ኖቶችን ማንበብ ይጀምሩ:</b>`;

async function getActiveDailyAd() {
  try {
    const { data } = await supabase
      .from('announcements')
      .select('content')
      .eq('category', 'system_daily_ad')
      .eq('title', 'cln_custom_group_ad')
      .maybeSingle();
    if (data && data.content && data.content.trim()) {
      return data.content;
    }
  } catch (e) {
    console.warn('Could not fetch custom daily ad:', e.message);
  }
  return DEFAULT_DAILY_AD;
}

async function setActiveDailyAd(adText) {
  const { data: existing } = await supabase
    .from('announcements')
    .select('id')
    .eq('category', 'system_daily_ad')
    .eq('title', 'cln_custom_group_ad')
    .maybeSingle();
  if (existing?.id) {
    await supabase
      .from('announcements')
      .update({ content: adText, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('announcements')
      .insert({
        title: 'cln_custom_group_ad',
        content: adText,
        category: 'system_daily_ad',
        is_published: false
      });
  }
}

async function sendDailyAdToGroup() {
  const adContent = await getActiveDailyAd();
  const botUsername = bot.botInfo?.username || 'CLNFreshmanCoursesBot';
  return await bot.telegram.sendMessage(
    GROUP_CHAT_ID,
    adContent,
    {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🚀 Launch CLN Freshman Web App (Free)', url: `https://t.me/${botUsername}?start=open_app` }
          ],
          [
            { text: '💳 View Packages & Discounts', url: `https://t.me/${botUsername}?start=pricing` }
          ]
        ]
      }
    }
  );
}

const getWebAppUrl = () => {
  const base = WEBAPP_URL.endsWith('/') ? WEBAPP_URL : `${WEBAPP_URL}/`;
  return `${base}?_v=${Date.now()}`;
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is missing');
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL or SUPABASE_KEY is missing');
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Escape HTML for Telegram
function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function recordUserActivity(from) {
  if (!from || !from.id) return;
  const telegramId = from.id;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  try {
    // 1. Update/upsert users table with last_accessed_at
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, access_count, last_accessed_at')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (existingUser) {
      await supabase
        .from('users')
        .update({
          last_accessed_at: now.toISOString(),
          first_name: from.first_name || '',
          last_name: from.last_name || '',
          username: from.username || '',
          access_count: (existingUser.access_count || 0) + 1
        })
        .eq('id', existingUser.id);
    } else {
      await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          first_name: from.first_name || '',
          last_name: from.last_name || '',
          username: from.username || '',
          language_code: from.language_code || 'en',
          is_premium: Boolean(from.is_premium),
          first_accessed_at: now.toISOString(),
          last_accessed_at: now.toISOString(),
          access_count: 1
        });
    }

    // 2. Sync cloud stats streak in announcements
    const docTitle = `user_stats_${telegramId}`;
    const { data: cloudRow } = await supabase
      .from('announcements')
      .select('id, content')
      .eq('category', 'system_user_stats')
      .eq('title', docTitle)
      .maybeSingle();

    let stats = {
      telegram_id: telegramId,
      streak: 1,
      lastDate: today,
      history: [today],
      xp: 50,
      level: 1,
      completedCourses: 0,
      completedCourseIds: [],
      completedLessons: []
    };

    if (cloudRow?.content) {
      try {
        const parsed = JSON.parse(cloudRow.content);
        stats = { ...stats, ...parsed };
      } catch (_) {}
    }

    if (stats.lastDate === today) {
      // already recorded today
    } else if (stats.lastDate === yesterday) {
      stats.streak = (stats.streak || 1) + 1;
      stats.lastDate = today;
      stats.history = Array.from(new Set([...(stats.history || []), today]));
      stats.xp = Math.max(stats.xp, stats.streak * 50);
      stats.level = Math.floor(stats.xp / 100) + 1;
    } else {
      stats.streak = 1;
      stats.lastDate = today;
      stats.history = Array.from(new Set([...(stats.history || []), today]));
    }

    const json = JSON.stringify(stats);
    if (cloudRow?.id) {
      await supabase
        .from('announcements')
        .update({ content: json, updated_at: now.toISOString() })
        .eq('id', cloudRow.id);
    } else {
      await supabase
        .from('announcements')
        .insert({
          title: docTitle,
          content: json,
          category: 'system_user_stats',
          is_published: false
        });
    }
  } catch (err) {
    console.warn('Could not record user activity in Bot:', err.message);
  }
}

bot.use(async (ctx, next) => {
  if (ctx.from) {
    recordUserActivity(ctx.from).catch(() => {});
  }
  return next();
});

function makeHashtag(value) {
  if (!value) return '';
  return '#' + String(value).trim().replace(/[^a-zA-Z0-9_]+/g, '');
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function formatAnnouncement(announcement) {
  const category = makeHashtag(announcement.category);
  const priority = makeHashtag(announcement.priority);
  const hashtags = [category, priority].filter(Boolean).join(' ');
  const pinned = announcement.is_pinned ? '📌 PINNED\n\n' : '';
  const createdDate = formatDate(announcement.created_at);

  return `${pinned}📢 <b>${escapeHtml(announcement.title || 'Announcement')}</b>\n\n${escapeHtml(announcement.content || '')}\n\n${hashtags}\n🕒 ${createdDate}`;
}

async function getAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      id,
      title,
      content,
      category,
      priority,
      is_pinned,
      is_published,
      created_at,
      published_at,
      expires_at,
      views,
      likes,
      comments,
      shares,
      target_audience,
      image_url
    `)
    .eq('is_published', true)
    .neq('category', 'system_course');

  if (error) {
    console.error('❌ Supabase error:', error);
    throw error;
  }

  const announcements = data || [];
  announcements.sort((a, b) => {
    const dateA = new Date(a.published_at || a.created_at);
    const dateB = new Date(b.published_at || b.created_at);
    return dateA.getTime() - dateB.getTime();
  });

  return announcements;
}

// Split long text
function splitMessage(text, maxLength) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.substring(i, i + maxLength));
  }
  return chunks;
}

// ============================================================
// CONTENT TEMPLATES (BILINGUAL: ENGLISH + AMHARIC)
// ============================================================

const getStartMessage = (username) => `👋 Welcome to <b>CLN Freshman Tutor</b>, ${escapeHtml(username)}! 🎓
እንኳን ወደ CLN Freshman Bot በደህና መጡ!

Your #1 all-in-one academic companion for Ethiopian University Freshmen.
የኢትዮጵያ ዩኒቨርሲቲ የፍሬሽማን ተማሪዎች የትምህርትና ፈተና ዝግጅት ማዕከል።

✨ <b>What we offer / የምንሰጣቸው አገልግሎቶች:</b>
• 📚 <b>Courses Web App</b>: Video lectures, summary PDF notes & chapter quizzes
• 📝 <b>Question Practice (Prep)</b>: Hundreds of midterm & final model exam questions
• 🏆 <b>Daily Streaks & Leaderboard</b>: Study consistently & track your ranking
• 👥 <b>Freshman Community</b>: Connect with students nationwide in @CLNfreshman444

👇 <b>Tap an option below to start / ከታች ካሉት ይምረጡ:</b>`;

const getStartKeyboard = () => ({
  inline_keyboard: [
    [
      {
        text: '🚀 Open Courses Web App',
        web_app: { url: getWebAppUrl() }
      }
    ],
    [
      {
        text: '📝 Open Question Practice (CLN Prep)',
        web_app: { url: PREP_URL }
      }
    ],
    [
      { text: '💰 Packages & Prices', callback_data: 'pricing' },
      { text: '💳 How to Register', callback_data: 'register' }
    ],
    [
      { text: '📖 How to Use (Guides)', callback_data: 'guides' },
      { text: '❓ FAQ', callback_data: 'faq' }
    ],
    [
      {
        text: '👥 Join Discussion Group (@CLNfreshman444)',
        url: GROUP_URL
      }
    ],
    [
      { text: '💡 What is CLN?', callback_data: 'about' },
      { text: '📢 Announcements', callback_data: 'announcements' }
    ]
  ]
});

const getPricingMessage = () => `🎓 <b>CLN FRESHMAN — PACKAGES & PRICING</b>
💰 <b>የክፍያ ጥቅሎች እና የዋጋ ዝርዝር</b>
━━━━━━━━━━━━━━━━━━━━

1️⃣ 🚀 <b>CLN Courses Web App (ቪዲዮ እና ኖቶች)</b>
<i>Structured video lectures, PDF chapter notes, and progress tracking:</i>
• <b>Full Semester Pass (All Courses)</b>: <b>320 Birr</b> <s>(500 Birr)</s>
  - Unlocks Chapter 2, 3, 4+ across <b>EVERY freshman course</b>!
  - <i>Note: Chapter 1 of all courses is 100% Free to sample!</i>

2️⃣ 👑 <b>VIP COMBO PASS (ሁለቱንም አንድ ላይ — BEST VALUE!)</b>
🔥 <b>Courses Web App + Question Prep Bundle:</b>
• <b>Solo VIP Combo (1 ተማሪ)</b>: <b>500 Birr</b> <s>(700 Birr)</s> — <b>Save 200 ETB!</b>
  - Full Semester access to <b>BOTH</b> the Web App & Question Prep website!
• <b>Dorm Squad Combo (4 ተማሪዎች)</b>: <b>1,600 Birr</b> (400 ETB / student)

3️⃣ 📝 <b>CLN Freshman Prep (ጥያቄ ልምምድ ብቻ)</b>
<i>Practice 100s of freshman exam questions with detailed answers:</i>
• <b>Solo Semester Pass (1 ተማሪ)</b>: <b>380 Birr</b> <s>(600 Birr)</s>
• <b>Dorm Squad Deal (4 ተማሪዎች)</b>: <b>1,200 Birr</b> (300 ETB / student)
• <b>Floor / Section Deal (8 ተማሪዎች)</b>: <b>2,000 Birr</b> (250 ETB / student)

━━━━━━━━━━━━━━━━━━━━
🏦 <b>የክፍያ አማራጮች (Payment Methods):</b>
• <b>ንግድ ባንክ (CBE)</b>: <code>1000253063452</code>
• <b>ቴሌብር (Telebirr)</b>: <code>0950113361</code>
<i>(Account Name: CLN Academy / CLN Educational Platform)</i>

📩 <b>How to Activate / ማግበሪያ መንገድ:</b>
ክፍያ ከፈጸሙ በኋላ የከፈሉበትን ደረሰኝ (Screenshot) በቀጥታ ለቴሌግራም አድሚን ብቻ ይላኩ:
👉 <b>@${ADMIN_USERNAME}</b>

<i>(የከፈሉበትን ደረሰኝ ሲልኩ የተመዘገቡበትን ስም እና ስልክ ቁጥር አብረው ይላኩ፤ አድሚኑ ወዲያውኑ አካውንትዎን ፕሪሚየም ያደርግልዎታል)</i>`;

const getRegisterMessage = () => `💳 <b>HOW TO REGISTER & ACTIVATE ACCESS</b>
📝 <b>እንዴት መመዝገብ እና አካውንት ማግበር ይቻላል?</b>
━━━━━━━━━━━━━━━━━━━━

<b>Step 1 / ደረጃ 1: Select Your Package (ጥቅልዎን ይምረጡ)</b>
• <b>Web App Full Semester Pass (320 ETB)</b> — All Courses & Notes
• <b>VIP Combo Pass (500 ETB)</b> — Both Web App + Question Prep (Best Value!)
• <b>Solo Question Prep (380 ETB)</b> — Question practice only
• <b>Group Deals (1,200 ETB or 1,600 ETB)</b> — For dorm roommates

<b>Step 2 / ደረጃ 2: Make Payment (ክፍያ ይፈጽሙ)</b>
Use either Telebirr or CBE:
• <b>CBE (ንግድ ባንክ)</b>: <code>1000253063452</code>
• <b>Telebirr (ቴሌብር)</b>: <code>0950113361</code>

<b>Step 3 / ደረጃ 3: Send Screenshot to Admin (ደረሰኝ ይላኩ)</b>
After payment, send your transaction screenshot directly to our admin:
👉 <b>@${ADMIN_USERNAME}</b>

Include:
1. Receipt Screenshot (የክፍያ ደረሰኝ ምስል)
2. Chosen Package Name (የመረጡት ጥቅል)
3. Your Registered Full Name & Phone Number

<b>Step 4 / ደረጃ 4: Instant Activation! (ፈጣን ማረጋገጫ)</b>
The admin will immediately unlock your access to all courses! 🎓`;

const getAboutMessage = () => `💡 <b>WHAT IS CLN FRESHMAN TUTOR?</b>
ስለ CLN ፍሬሽማን ትምህርታዊ ፕላትፎርም
━━━━━━━━━━━━━━━━━━━━

<b>CLN Freshman</b> is Ethiopia’s premier digital learning platform dedicated to helping university freshman students pass their midterms and finals with top grades (4.0 GPA goal!).

🌟 <b>Why University Students Rely on CLN:</b>
• <b>100% Curriculum-Aligned</b>: Tailored strictly to the latest Ethiopian Ministry of Education university freshman syllabus.
• <b>Top-Scoring Tutors</b>: Simplified explanations of challenging concepts.
• <b>Bilingual Support</b>: Concepts broken down in clear English with Amharic explanations.
• <b>Core Freshman Subjects Covered</b>:
  1. 🧠 General Psychology
  2. 📖 Communicative English Language Skills
  3. ⚛️ General Physics (PHYS 1011)
  4. 🗺️ Geography of Ethiopia and the Horn
  5. 💡 Logic & Critical Thinking
  6. 📐 Mathematics for Natural Sciences
  7. 📊 Mathematics for Social Sciences
  8. 🏛️ Social Anthropology (ANTH 1012)
  9. 🚀 Entrepreneurship
  10. 🌍 Global Affairs
  11. 🤖 Introduction to Emerging Technologies
  12. 📈 Introduction to Economics
  13. 🏃 Physical Fitness & Conditioning

🚀 <b>Two Integrated Platforms:</b>
1. <b>Courses Web App</b>: Video lectures, summary handouts, and daily streak tracking.
2. <b>CLN Freshman Prep</b>: Hundreds of exam questions with instant step-by-step explanations and Sunday Arena.`;

const getGuidesMessage = () => `📖 <b>CLN USER GUIDES & HOW-TO</b>
የአጠቃቀም መመሪያዎች
━━━━━━━━━━━━━━━━━━━━

Choose which platform you want to learn how to use:
የየትኛውን አጠቃቀም ማወቅ ይፈልጋሉ?`;

const getWebAppGuideMessage = () => `📱 <b>HOW TO USE THE COURSES WEB APP</b>
የቪዲዮ እና ኖት ዌብ አፕ አጠቃቀም መመሪያ
━━━━━━━━━━━━━━━━━━━━

1. <b>Launching the App:</b>
   Tap the <b>"🚀 Open Courses Web App"</b> button in this bot. It runs smoothly inside Telegram!

2. <b>Browsing Courses:</b>
   Go to the <b>Courses</b> tab. You will see Psychology, English, Physics, Geography, Logic, and more. Filter by <i>"In Progress"</i>, <i>"Not Started"</i>, or <i>"Completed"</i>.

3. <b>Studying Chapters:</b>
   Tap any course to view its curriculum. Each chapter contains structured video lessons, in-app protected PDF handouts & study notes, and chapter review quizzes.

4. <b>Maintaining Your Day Streak:</b>
   Open the app and study daily to keep your streak alive! The more consecutive days you learn, the higher your multiplier.

5. <b>Freshman Leaderboard:</b>
   Earn XP for completing lessons and quizzes. Compete against students from all Ethiopian universities on the <b>Leaderboard</b>!`;

const getPrepGuideMessage = () => `🎯 <b>HOW TO USE CLN FRESHMAN PREP (QUESTIONS)</b>
የጥያቄ ልምምድ ድረገጽ አጠቃቀም መመሪያ
━━━━━━━━━━━━━━━━━━━━

👉 <b>Website:</b> https://cln-freshman-prep.vercel.app/

1. <b>Accessing Questions:</b>
   Open the link in Telegram or your browser. No heavy downloads required.

2. <b>Filtering by Subject & Chapter:</b>
   Select any subject (e.g. Physics, Logic, Psychology) and choose the specific chapter you want to practice.

3. <b>Instant Explanations:</b>
   Answer each question and immediately view the full explanation showing why the answer is correct and where the trick was.

4. <b>Sunday Arena:</b>
   Participate in weekly timed model exams to test your speed and readiness before official university exams!`;

const getCommunityMessage = () => `👥 <b>CLN FRESHMAN COMMUNITY & SUPPORT</b>
የተማሪዎች ማህበረሰብ እና ድጋፍ
━━━━━━━━━━━━━━━━━━━━

Join thousands of Ethiopian university freshmen across AAU, ASTU, AASTU, Jimma, Hawassa, Bahir Dar, Haramaya, and all universities:

📢 <b>Official Telegram Group:</b>
👉 <b>@CLNfreshman444</b>
• Share academic resources & past exam papers
• Discuss difficult lecture topics with peers
• Stay updated on exam schedules & campus news

💬 <b>Official Admin & Payment Support:</b>
👉 <b>@${ADMIN_USERNAME}</b>
• Send payment screenshots for instant activation
• Inquire about group package discounts
• Technical help and feedback`;

const getFaqMessage = () => `❓ <b>FREQUENTLY ASKED QUESTIONS (FAQ)</b>
ተደጋጋሚ ጥያቄዎች እና መልሶች
━━━━━━━━━━━━━━━━━━━━

<b>Q1: Is CLN updated for the current academic year?</b>
✅ Yes! All video lectures, notes, and question banks match the latest Ethiopian university curriculum.

<b>Q2: Are there free trial contents?</b>
✅ Absolutely! Both the Web App and Question Prep offer free sample previews and chapters so you can try before subscribing.

<b>Q3: How long does payment activation take?</b>
✅ Once you send your receipt screenshot to <b>@${ADMIN_USERNAME}</b>, your account is typically activated within 5 to 15 minutes!

<b>Q4: Can I use CLN on both my phone and laptop?</b>
✅ Yes! The Web App works inside Telegram on Android & iOS, and the Question Practice site works on any phone, tablet, or laptop browser.

<b>Q5: How do group discounts work?</b>
✅ If you team up with dorm roommates (4 students) or section mates (8 students), you can get up to <b>37% to 45% discount</b>! Send your group's details to <b>@${ADMIN_USERNAME}</b>.`;

// ============================================================
// GROUP PRIVACY & CHAT SILENCE MIDDLEWARE
// ============================================================
// Requirement: NO ONE can interact with the bot inside the group (@CLNfreshman444).
// The bot MUST NOT reply to user chatter, commands, or queries inside the group.
// It only runs automated actions (Welcome new members, post daily ads).
bot.use(async (ctx, next) => {
  // 1. Allow new member join events to trigger the Welcome message
  if (ctx.message?.new_chat_members) {
    return next();
  }

  // 2. Check if update is in a group or supergroup
  const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';
  if (isGroup) {
    const senderId = Number(ctx.from?.id);
    // If a user types a command in the group
    if (ctx.message?.text?.startsWith('/')) {
      // If it is NOT PAM (5572599116), delete the user command message to keep group clean
      if (senderId !== PAM_TELEGRAM_ID) {
        ctx.deleteMessage().catch(() => {});
        return; // Silently abort, do NOT respond
      }
      // If PAM typed a command, let it through
      return next();
    }
    // Silently ignore all regular text/replies from students inside the group
    return;
  }

  // In private chats, continue normally
  return next();
});

// ============================================================
// START COMMAND
// ============================================================

bot.command('start', async (ctx) => {
  const username = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name || 'Student');
  const fullText = ctx.message?.text || '';
  const payload = fullText.replace(/^\/start\s*/i, '').trim().toLowerCase();

  ctx.setChatMenuButton({
    type: 'web_app',
    text: '🚀 Open Web App',
    web_app: {
      url: getWebAppUrl()
    }
  }).catch((err) => console.warn('Could not set chat menu button:', err.message));

  // If user tapped "View Packages & Discounts" from group
  if (payload === 'pricing' || payload === 'prices') {
    return ctx.reply(getPricingMessage(), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💳 How to Register / ምዝገባ', callback_data: 'register' },
            { text: '💬 Send Receipt to Admin', url: ADMIN_URL }
          ],
          [
            { text: '🚀 Open Web App', web_app: { url: getWebAppUrl() } },
            { text: '📝 Open Prep', web_app: { url: PREP_URL } }
          ],
          [
            { text: '🔙 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    });
  }

  // If user tapped "Launch Web App" from group advertisement or welcome message
  if (payload === 'open_app' || payload === 'group_ad' || payload === 'group_welcome' || payload === 'open') {
    return ctx.reply(
      `🎉 <b>Welcome to CLN Freshman Web App, ${escapeHtml(username)}! / እንኳን ደህና መጡ!</b> 🎓\n\n` +
      `Access all 13 Freshman courses, Chapter 1 free lecture notes, and past model exams right now!\n\n` +
      `👇 <b>Tap the button below to launch the Web App:</b>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🚀 Launch Freshman Web App', web_app: { url: getWebAppUrl() } }
            ],
            [
              { text: '📝 Open Question Practice (Prep)', web_app: { url: PREP_URL } }
            ],
            [
              { text: '💰 View Packages & Discounts', callback_data: 'pricing' },
              { text: '👥 Freshman Group', url: GROUP_URL }
            ]
          ]
        }
      }
    );
  }

  try {
    await ctx.reply(getStartMessage(username), {
      parse_mode: 'HTML',
      reply_markup: getStartKeyboard()
    });
  } catch (err) {
    console.error('Error sending start message:', err.message);
  }
});

// ============================================================
// CORE BOT COMMANDS
// ============================================================

// Pricing & Packages
bot.command(['pricing', 'packages', 'price', 'payment'], async (ctx) => {
  await ctx.reply(getPricingMessage(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💳 How to Register / ምዝገባ', callback_data: 'register' },
          { text: '💬 Send Receipt to Admin', url: ADMIN_URL }
        ],
        [
          { text: '🚀 Open Web App', web_app: { url: getWebAppUrl() } },
          { text: '📝 Open Prep', web_app: { url: PREP_URL } }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  });
});

// Registration
bot.command(['register', 'registration', 'enroll'], async (ctx) => {
  await ctx.reply(getRegisterMessage(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💬 Send Receipt to @' + ADMIN_USERNAME, url: ADMIN_URL }
        ],
        [
          { text: '💰 View Packages & Prices', callback_data: 'pricing' },
          { text: '👥 Join Group @CLNfreshman444', url: GROUP_URL }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  });
});

// About CLN
bot.command(['about', 'whatiscln'], async (ctx) => {
  await ctx.reply(getAboutMessage(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚀 Open Web App', web_app: { url: getWebAppUrl() } },
          { text: '📝 Open Prep', web_app: { url: PREP_URL } }
        ],
        [
          { text: '💰 Packages & Prices', callback_data: 'pricing' },
          { text: '👥 Join @CLNfreshman444', url: GROUP_URL }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  });
});

// Community / Group
bot.command(['community', 'group', 'channel'], async (ctx) => {
  await ctx.reply(getCommunityMessage(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👥 Join @CLNfreshman444 Group', url: GROUP_URL }
        ],
        [
          { text: '💬 Message Admin @' + ADMIN_USERNAME, url: ADMIN_URL }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  });
});

// FAQ
bot.command('faq', async (ctx) => {
  await ctx.reply(getFaqMessage(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💰 View Packages', callback_data: 'pricing' },
          { text: '💳 How to Register', callback_data: 'register' }
        ],
        [
          { text: '💬 Ask Question to Admin', url: ADMIN_URL },
          { text: '👥 Join Group', url: GROUP_URL }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  });
});

// Guides
bot.command(['guide', 'guides', 'howto'], async (ctx) => {
  await ctx.reply(getGuidesMessage(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📱 How to Use Courses Web App', callback_data: 'guide_webapp' }
        ],
        [
          { text: '🎯 How to Use Question Prep', callback_data: 'guide_prep' }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  });
});

// Open Web App
const sendOpenWebAppMessage = (ctx) => {
  ctx.setChatMenuButton({
    type: 'web_app',
    text: '🚀 Open Web App',
    web_app: {
      url: getWebAppUrl()
    }
  }).catch(() => {});

  return ctx.reply(
    `🎓 <b>CLN Freshman Courses & Notes Web App</b>\n\nTap below to explore freshman courses, summary lecture notes, and quizzes:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Open Web App',
              web_app: { url: getWebAppUrl() }
            }
          ],
          [
            { text: '📖 How to Use', callback_data: 'guide_webapp' },
            { text: '💰 Packages', callback_data: 'pricing' }
          ]
        ]
      }
    }
  );
};

bot.command(['open', 'app', 'courses'], sendOpenWebAppMessage);

// Question Practice
bot.command(['prep', 'practice', 'questions'], async (ctx) => {
  await ctx.reply(
    `🎯 <b>CLN Freshman Question Practice & Exam Prep</b>\n\nSharpen your knowledge with hundreds of curated freshman exam questions, chapter quizzes, and model tests.\n\n👉 <b>Website:</b> ${PREP_URL}\n\nTap below to start practicing:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📝 Open Question Practice',
              web_app: { url: PREP_URL }
            }
          ],
                    [
            { text: '💰 View Prep Packages', callback_data: 'pricing' },
            { text: '📖 How to Use', callback_data: 'guide_prep' }
          ]
        ]
      }
    }
  );
});

// Help command
bot.command('help', async (ctx) => {
  const helpText = `ℹ️ <b>CLN Freshman Bot Commands / የቦቱ ማውጫ</b>:
━━━━━━━━━━━━━━━━━━━━

/start - 🏠 Main Interactive Portal & Menu
/open - 🚀 Open Courses Web App (Videos & Notes)
/prep - 📝 Open Question Practice (CLN Prep)
/pricing - 💰 Packages, Pricing & Bank Details
/register - 💳 Step-by-Step Registration Guide
/guide - 📖 Guides on how to use both platforms
/faq - ❓ Frequently Asked Questions
/community - 👥 Official Student Group (@CLNfreshman444)
/about - 💡 What is CLN Freshman?
/announcements - 📢 Published Campus Announcements
/ping - 🏓 Check bot connection`;

  await ctx.reply(helpText, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚀 Open Web App', web_app: { url: getWebAppUrl() } },
          { text: '📝 Question Practice', web_app: { url: PREP_URL } }
        ],
        [
          { text: '💰 Packages', callback_data: 'pricing' },
          { text: '💳 Register', callback_data: 'register' }
        ],
        [
          { text: '👥 Join @CLNfreshman444', url: GROUP_URL }
        ]
      ]
    }
  });
});

bot.command('ping', (ctx) => {
  ctx.reply('Pong! 🏓 Bot is active and running.');
});

// ============================================================
// ANNOUNCEMENTS
// ============================================================

bot.command('announcements', async (ctx) => {
  try {
    await ctx.reply('📢 Fetching announcements...');
    const announcements = await getAnnouncements();

    if (announcements.length === 0) {
      await ctx.reply('📭 There are no published announcements right now.');
      return;
    }

    for (const announcement of announcements) {
      const message = formatAnnouncement(announcement);
      if (message.length <= 4096) {
        if (announcement.image_url) {
          await ctx.replyWithPhoto(
            { url: announcement.image_url },
            { caption: message, parse_mode: 'HTML' }
          );
        } else {
          await ctx.reply(message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
          });
        }
      } else {
        const chunks = splitMessage(message, 4096);
        for (const chunk of chunks) {
          await ctx.reply(chunk, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    await ctx.reply('❌ Sorry, I could not fetch announcements right now.');
  }
});

// ============================================================
// CALLBACK QUERY HANDLERS (SEAMLESS INLINE INTERACTION)
// ============================================================

bot.action('main_menu', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const username = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name || 'Student');
  try {
    await ctx.editMessageText(getStartMessage(username), {
      parse_mode: 'HTML',
      reply_markup: getStartKeyboard()
    });
  } catch (_) {
    await ctx.reply(getStartMessage(username), {
      parse_mode: 'HTML',
      reply_markup: getStartKeyboard()
    });
  }
});

bot.action('pricing', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const markup = {
    inline_keyboard: [
      [
        { text: '💳 How to Register / ምዝገባ', callback_data: 'register' },
        { text: '💬 Send Receipt to Admin', url: ADMIN_URL }
      ],
      [
        { text: '🚀 Open Web App', web_app: { url: getWebAppUrl() } },
        { text: '📝 Open Prep', web_app: { url: PREP_URL } }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'main_menu' }
      ]
    ]
  };

  try {
    await ctx.editMessageText(getPricingMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  } catch (_) {
    await ctx.reply(getPricingMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  }
});

bot.action('register', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const markup = {
    inline_keyboard: [
      [
        { text: '💬 Send Receipt to @' + ADMIN_USERNAME, url: ADMIN_URL }
      ],
      [
        { text: '💰 View Packages & Prices', callback_data: 'pricing' },
        { text: '👥 Join Group @CLNfreshman444', url: GROUP_URL }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'main_menu' }
      ]
    ]
  };

  try {
    await ctx.editMessageText(getRegisterMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  } catch (_) {
    await ctx.reply(getRegisterMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  }
});

bot.action('about', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const markup = {
    inline_keyboard: [
      [
        { text: '🚀 Open Web App', web_app: { url: getWebAppUrl() } },
        { text: '📝 Open Prep', web_app: { url: PREP_URL } }
      ],
      [
        { text: '💰 Packages & Prices', callback_data: 'pricing' },
        { text: '👥 Join @CLNfreshman444', url: GROUP_URL }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'main_menu' }
      ]
    ]
  };

  try {
    await ctx.editMessageText(getAboutMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  } catch (_) {
    await ctx.reply(getAboutMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  }
});

bot.action('community', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const markup = {
    inline_keyboard: [
      [
        { text: '👥 Join @CLNfreshman444 Group', url: GROUP_URL }
      ],
      [
        { text: '💬 Message Admin @' + ADMIN_USERNAME, url: ADMIN_URL }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'main_menu' }
      ]
    ]
  };

  try {
    await ctx.editMessageText(getCommunityMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  } catch (_) {
    await ctx.reply(getCommunityMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  }
});

bot.action('faq', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const markup = {
    inline_keyboard: [
      [
        { text: '💰 View Packages', callback_data: 'pricing' },
        { text: '💳 How to Register', callback_data: 'register' }
      ],
      [
        { text: '💬 Ask Question to Admin', url: ADMIN_URL },
        { text: '👥 Join Group', url: GROUP_URL }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'main_menu' }
      ]
    ]
  };

  try {
    await ctx.editMessageText(getFaqMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  } catch (_) {
    await ctx.reply(getFaqMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  }
});

bot.action('guides', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const markup = {
    inline_keyboard: [
      [
        { text: '📱 How to Use Courses Web App', callback_data: 'guide_webapp' }
      ],
      [
        { text: '🎯 How to Use Question Prep', callback_data: 'guide_prep' }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'main_menu' }
      ]
    ]
  };

  try {
    await ctx.editMessageText(getGuidesMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  } catch (_) {
    await ctx.reply(getGuidesMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  }
});

bot.action('guide_webapp', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const markup = {
    inline_keyboard: [
      [
        { text: '🚀 Launch Web App Now', web_app: { url: getWebAppUrl() } }
      ],
      [
        { text: '🎯 How to Use Question Prep', callback_data: 'guide_prep' },
        { text: '💰 View Packages', callback_data: 'pricing' }
      ],
      [
        { text: '🔙 Guides Menu', callback_data: 'guides' },
        { text: '🏠 Main Menu', callback_data: 'main_menu' }
      ]
    ]
  };

  try {
    await ctx.editMessageText(getWebAppGuideMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  } catch (_) {
    await ctx.reply(getWebAppGuideMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  }
});

bot.action('guide_prep', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const markup = {
    inline_keyboard: [
      [
        { text: '📝 Launch Question Practice', web_app: { url: PREP_URL } }
      ],
      [
        { text: '📱 How to Use Web App', callback_data: 'guide_webapp' },
        { text: '💰 View Packages', callback_data: 'pricing' }
      ],
      [
        { text: '🔙 Guides Menu', callback_data: 'guides' },
        { text: '🏠 Main Menu', callback_data: 'main_menu' }
      ]
    ]
  };

  try {
    await ctx.editMessageText(getPrepGuideMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  } catch (_) {
    await ctx.reply(getPrepGuideMessage(), {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  }
});

bot.action('announcements', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  try {
    const announcements = await getAnnouncements();
    if (announcements.length === 0) {
      await ctx.reply('📭 There are no published announcements right now.');
      return;
    }
    for (const announcement of announcements) {
      const message = formatAnnouncement(announcement);
      if (message.length <= 4096) {
        await ctx.reply(message, { parse_mode: 'HTML', disable_web_page_preview: true });
      }
    }
  } catch (error) {
    console.error(error);
    await ctx.reply('❌ Could not load announcements.');
  }
});

// Text listener for friendly keyword replies
bot.hears(['help', 'Help', 'faq', 'FAQ', 'question', 'questions'], (ctx) => {
  ctx.reply(getFaqMessage(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💰 Packages', callback_data: 'pricing' },
          { text: '💳 Register', callback_data: 'register' }
        ],
        [
          { text: '👥 Group @CLNfreshman444', url: GROUP_URL },
          { text: '💬 Admin Support', url: ADMIN_URL }
        ]
      ]
    }
  });
});

bot.hears(['price', 'pricing', 'package', 'packages', 'pay', 'payment', 'ዋጋ', 'ክፍያ'], (ctx) => {
  ctx.reply(getPricingMessage(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💳 How to Register / ምዝገባ', callback_data: 'register' },
          { text: '💬 Send Receipt to Admin', url: ADMIN_URL }
        ]
      ]
    }
  });
});

bot.hears(['group', 'community', 'channel', 'ግሩፕ'], (ctx) => {
  ctx.reply(getCommunityMessage(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '👥 Join @CLNfreshman444 Group', url: GROUP_URL }]
      ]
    }
  });
});

// ============================================================
// PAM EXCLUSIVE BROADCAST & ADVERTISEMENT COMMANDS
// ============================================================

// Command for PAM to broadcast direct Telegram messages to all registered students
bot.command(['broadcast', 'announce'], async (ctx) => {
  const senderId = Number(ctx.from?.id);
  // STRICT VERIFICATION: ONLY PAM (5572599116 / @PAKMNJB)
  if (senderId !== PAM_TELEGRAM_ID) {
    return ctx.reply('⛔ <b>Access Denied:</b> This command is strictly reserved for PAM (@PAKMNJB).', {
      parse_mode: 'HTML',
    });
  }

  if (ctx.chat?.type !== 'private') {
    return ctx.reply('⚠️ Please send /broadcast in private chat with the bot.', { parse_mode: 'HTML' });
  }

  const fullText = ctx.message.text || '';
  const messageContent = fullText.replace(/^\/(broadcast|announce)\s*/i, '').trim();

  if (!messageContent) {
    return ctx.reply(
      `📢 <b>CLN Broadcast System / ማስታወቂያ መላኪያ (PAM Only)</b>\n\n` +
      `Send a direct Telegram DM to every registered student who has used the bot.\n\n` +
      `<b>Usage:</b>\n<code>/broadcast [Your announcement or ad message here]</code>\n\n` +
      `<b>Example:</b>\n<code>/broadcast 🎉 Big Update! New model exams and chapter notes are now live on the Web App!</code>\n\n` +
      `<i>Tip: HTML formatting like &lt;b&gt;bold&lt;/b&gt; and &lt;i&gt;italic&lt;/i&gt; is supported.</i>`,
      { parse_mode: 'HTML' }
    );
  }

  await ctx.reply('📡 <b>Initiating broadcast...</b> Fetching registered students from database...', { parse_mode: 'HTML' });

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('telegram_id')
      .not('telegram_id', 'is', null);

    if (error || !users || users.length === 0) {
      return ctx.reply(`❌ Could not fetch students: ${error?.message || 'No registered users found.'}`);
    }

    const uniqueIds = Array.from(new Set(users.map((u) => Number(u.telegram_id)).filter((id) => id > 0)));

    await ctx.reply(
      `🚀 Broadcasting to <b>${uniqueIds.length}</b> registered students...\nPlease hold on while messages are being delivered.`,
      { parse_mode: 'HTML' }
    );

    let sent = 0;
    let failed = 0;

    for (const tgId of uniqueIds) {
      try {
        await bot.telegram.sendMessage(
          tgId,
          `📢 <b>CLN Campus Announcement / ማስታወቂያ</b>\n\n${messageContent}`,
          {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🚀 Open CLN Courses', web_app: { url: getWebAppUrl() } },
                  { text: '👥 Freshman Group', url: GROUP_URL }
                ]
              ]
            }
          }
        );
        sent++;
        await new Promise((r) => setTimeout(r, 45));
      } catch (err) {
        failed++;
      }
    }

    await ctx.reply(
      `✅ <b>Broadcast Completed! / ማስታወቂያው ተልኳል!</b>\n\n` +
      `📬 Successfully delivered: <b>${sent}</b>\n` +
      `⚠️ Blocked / Inactive: <b>${failed}</b>\n` +
      `👥 Total targeted: <b>${uniqueIds.length}</b>`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    console.error('Broadcast error:', err);
    await ctx.reply(`❌ Broadcast failed with error: ${err.message}`);
  }
});

// Command for PAM to customize the daily advertisement message
bot.command('set_ad', async (ctx) => {
  const senderId = Number(ctx.from?.id);
  if (senderId !== PAM_TELEGRAM_ID) {
    return ctx.reply('⛔ Access Denied: Only PAM (@PAKMNJB) can customize the group advertisement.', { parse_mode: 'HTML' });
  }

  const newText = (ctx.message.text || '').replace(/^\/set_ad\s*/i, '').trim();
  if (!newText) {
    return ctx.reply(
      `✍️ <b>Customize Daily Group Advertisement</b>\n\n` +
      `Set the custom advertisement text that the bot posts daily into the @CLNfreshman444 group.\n\n` +
      `<b>Usage:</b>\n<code>/set_ad [Your advertisement text here]</code>\n\n` +
      `<b>Example:</b>\n<code>/set_ad 🔥 Midterm exams are approaching! Access all AAU Freshman Chapter 1 notes for FREE on the CLN Web App!</code>\n\n` +
      `<i>Tip: HTML tags like &lt;b&gt;bold&lt;/b&gt; and &lt;i&gt;italic&lt;/i&gt; are supported.</i>`,
      { parse_mode: 'HTML' }
    );
  }

  try {
    await setActiveDailyAd(newText);
    await ctx.reply(
      `✅ <b>Daily Group Advertisement Updated!</b>\n\n` +
      `Preview your new ad with: /view_ad\n` +
      `Post it immediately to the group with: /post_ad`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    await ctx.reply(`❌ Failed to update ad: ${err.message}`);
  }
});

// Command for PAM to preview active advertisement
bot.command('view_ad', async (ctx) => {
  const senderId = Number(ctx.from?.id);
  if (senderId !== PAM_TELEGRAM_ID) {
    return ctx.reply('⛔ Access Denied.', { parse_mode: 'HTML' });
  }
  const ad = await getActiveDailyAd();
  await ctx.reply(
    `📋 <b>Current Active Group Advertisement:</b>\n\n${ad}\n\n` +
    `<i>• To change it, type: /set_ad [New Text]\n` +
    `• To post it now to @CLNfreshman444, type: /post_ad\n` +
    `• To reset to default, type: /reset_ad</i>`,
    { parse_mode: 'HTML' }
  );
});

// Command for PAM to immediately post the advertisement into the group
bot.command('post_ad', async (ctx) => {
  const senderId = Number(ctx.from?.id);
  if (senderId !== PAM_TELEGRAM_ID) {
    return ctx.reply('⛔ Access Denied.', { parse_mode: 'HTML' });
  }

  try {
    await ctx.reply('📡 Posting advertisement to @CLNfreshman444...');
    await sendDailyAdToGroup();
    await ctx.reply('✅ <b>Advertisement successfully posted to @CLNfreshman444!</b>', { parse_mode: 'HTML' });
  } catch (err) {
    await ctx.reply(`❌ Failed to post ad to group: ${err.message}`);
  }
});

// Command for PAM to reset advertisement to default
bot.command('reset_ad', async (ctx) => {
  const senderId = Number(ctx.from?.id);
  if (senderId !== PAM_TELEGRAM_ID) {
    return ctx.reply('⛔ Access Denied.', { parse_mode: 'HTML' });
  }

  try {
    await setActiveDailyAd(DEFAULT_DAILY_AD);
    await ctx.reply('✅ Group advertisement has been reset to the default CLN motivating message!', { parse_mode: 'HTML' });
  } catch (err) {
    await ctx.reply(`❌ Failed to reset ad: ${err.message}`);
  }
});

// ============================================================
// GROUP WELCOME EVENT LISTENER (@CLNfreshman444)
// ============================================================
// Welcomes new members warmly and motivates them to launch the Web App
bot.on('new_chat_members', async (ctx) => {
  try {
    const newMembers = ctx.message.new_chat_members || [];
    const botUsername = ctx.botInfo?.username || 'CLNFreshmanCoursesBot';

    for (const member of newMembers) {
      if (member.is_bot) continue;

      const name = member.first_name || 'Freshman';
      await ctx.reply(
        `👋 <b>Welcome to CLN Freshman Community, ${escapeHtml(name)}! / እንኳን ደህና መጡ!</b> 🎓✨\n\n` +
        `Are you ready to ace your Freshman year and score a top GPA? 🚀\n\n` +
        `All your Addis Ababa University (AAU) freshman study materials are organized in one place inside our <b>Telegram Web App</b>:\n\n` +
        `📚 <b>All 13 Freshman Courses:</b>\n` +
        `Psychology, Physics, Logic, Emerging Tech, Economics, Global Affairs, Entrepreneurship, Mathematics, Anthropology, and Physical Fitness.\n\n` +
        `🎁 <b>Chapter 1 is 100% FREE</b> for every single course!\n` +
        `📝 <b>Midterm & Final Model Exams</b> with complete step-by-step solutions.\n` +
        `⚡ <b>Study anywhere, anytime</b> directly inside Telegram.\n\n` +
        `👇 <b>Tap below to open the Web App and claim your free Chapter 1s:</b>`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🚀 Launch Freshman Web App (Free)', url: `https://t.me/${botUsername}?start=open_app` }
              ],
              [
                { text: '💳 View Packages & Discounts', url: `https://t.me/${botUsername}?start=pricing` }
              ]
            ]
          }
        }
      ).catch((err) => console.warn('Could not send welcome message:', err.message));
    }
  } catch (err) {
    console.warn('Error in new_chat_members:', err.message);
  }
});

// Fallback message
bot.on('text', (ctx) => {
  if (ctx.message.text.startsWith('/')) {
    return;
  }
  return sendOpenWebAppMessage(ctx);
});

// ============================================================
// WEBHOOK & ADMIN API
// ============================================================

app.use(express.json());

app.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook received:', req.body.message?.text || 'No text');
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.sendStatus(500);
  }
});

// Direct API notification trigger for Admin Approval
app.post('/api/notify-approval', async (req, res) => {
  const { telegramId, courseTitle } = req.body;
  if (!telegramId) {
    return res.status(400).json({ error: 'Missing telegramId' });
  }

  try {
    await bot.telegram.sendMessage(
      telegramId,
      `🎉 <b>Course Access Approved! / አካውንትዎ ነፃ ሆኗል!</b>\n\nYour access to <b>${escapeHtml(courseTitle || 'your course')}</b> has been activated by the CLN Admin.\n\nYou now have full access to all lectures, lecture handouts, and quizzes. Happy learning! 🎓`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Open Course in Web App',
                web_app: { url: getWebAppUrl() },
              },
            ],
            [
              {
                text: '📝 Practice Questions',
                web_app: { url: PREP_URL },
              }
            ]
          ],
        },
      }
    );
    console.log(`✅ Sent approval notification to student Telegram ID: ${telegramId}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('⚠️ Could not send Telegram DM to user:', err.message);
    return res.json({ success: false, reason: err.message });
  }
});

// API Endpoint for broadcasting from Web App Admin Dashboard or external calls
app.post('/api/broadcast', async (req, res) => {
  const { title, content, secret } = req.body;
  const validSecrets = [
    'Eyob@CLN2026#Admin',
    process.env.ADMIN_SECRET || 'Eyob@CLN2026#Admin',
  ];
  if (!validSecrets.includes(secret)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin secret' });
  }
  if (!content) {
    return res.status(400).json({ error: 'Missing content' });
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('telegram_id')
      .not('telegram_id', 'is', null);

    if (error || !users) {
      return res.status(500).json({ error: error?.message || 'Failed to fetch users' });
    }

    const uniqueIds = Array.from(new Set(users.map((u) => Number(u.telegram_id)).filter((id) => id > 0)));
    let sent = 0;
    let failed = 0;

    const formattedMessage = `📢 <b>${escapeHtml(title || 'CLN Campus Announcement')}</b>\n\n${content}`;

    for (const tgId of uniqueIds) {
      try {
        await bot.telegram.sendMessage(tgId, formattedMessage, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🚀 Open CLN Courses', web_app: { url: getWebAppUrl() } },
                { text: '👥 Freshman Group', url: GROUP_URL }
              ]
            ]
          }
        });
        sent++;
        await new Promise((r) => setTimeout(r, 45));
      } catch (e) {
        failed++;
      }
    }

    return res.json({ success: true, sent, failed, total: uniqueIds.length });
  } catch (err) {
    console.error('API Broadcast error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Cron Endpoint for daily automated group advertisement
app.all('/api/cron-daily-ad', async (req, res) => {
  try {
    console.log('⏰ Executing scheduled daily group advertisement to @CLNfreshman444...');
    await sendDailyAdToGroup();
    return res.json({ success: true, message: 'Daily advertisement posted to @CLNfreshman444' });
  } catch (err) {
    console.error('Error posting scheduled daily ad:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Register persistent Telegram bot commands menu
bot.telegram.setMyCommands([
  { command: 'start', description: '🏠 Main Portal & Menu / ዋና ማውጫ' },
  { command: 'open', description: '🚀 Open Courses Web App' },
  { command: 'prep', description: '📝 Question Practice Portal (Prep)' },
  { command: 'pricing', description: '💰 Packages & Prices / የዋጋ ዝርዝር' },
  { command: 'register', description: '💳 How to Register / ምዝገባ' },
  { command: 'guide', description: '📖 User Guides / የአጠቃቀም መመሪያ' },
  { command: 'faq', description: '❓ FAQ / ተደጋጋሚ ጥያቄዎች' },
  { command: 'community', description: '👥 Group (@CLNfreshman444)' },
  { command: 'about', description: '💡 What is CLN? / ስለ CLN' },
  { command: 'announcements', description: '📢 Campus Announcements' },
  { command: 'help', description: 'ℹ️ Bot Commands & Help' },
]).catch(err => console.warn('Could not setMyCommands:', err.message));

// Health check endpoint
app.get('/', (req, res) => {
  res.send('CLN Freshman Bot is running smoothly!');
});

// Export app for Vercel
module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Bot running on port ${port}`);

    if (process.env.BOT_TOKEN && process.env.BOT_TOKEN !== 'your_telegram_bot_token_here') {
      const startPolling = () => {
        bot.launch({ dropPendingUpdates: true })
          .then(() => {
            console.log('🤖 Telegram Bot polling ended');
          })
          .catch((err) => {
            console.error('❌ Polling error, auto-retrying in 3s:', err.message);
            setTimeout(startPolling, 3000);
          });
      };
      startPolling();
      console.log('🤖 Telegram Bot started with polling!');
    } else {
      console.log('⚠️ BOT_TOKEN is not configured yet. Get a token from @BotFather on Telegram and place it in Bot/.env to enable polling.');
    }
  });
}
