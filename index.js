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
const ADMIN_USERNAME = 'CLN_AAU_Admin';
const ADMIN_URL = 'https://t.me/CLN_AAU_Admin';

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
  6. 📐 Mathematics for Natural / Social Science

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
// START COMMAND
// ============================================================

bot.command('start', async (ctx) => {
  const username = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name || 'Student');

  ctx.setChatMenuButton({
    type: 'web_app',
    text: '🚀 Open Web App',
    web_app: {
      url: getWebAppUrl()
    }
  }).catch((err) => console.warn('Could not set chat menu button:', err.message));

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
