/**
 * 庄老大家庭重要日子提醒 — GitHub Actions 定时运行
 *
 * 每天 UTC 1:00 (北京时间 9:00) 自动触发
 * 匹配成功 → Server酱推送微信消息
 *
 * 维护须知：
 *   - 农历正月22 的公历日期每年不同，需在每年元旦前更新次年数据
 *   - 修改 REMINDERS 数组增删公历提醒
 *   - 新增提醒就改这个文件，推到 GitHub 即可生效
 */

// ============================================================
// 公历提醒配置
// ============================================================
const REMINDERS = [
  {
    name: '结婚纪念日',
    emoji: '💍',
    monthDay: '07-26',
    advance5: '07-21',
    advance2: '07-24',
  },
  {
    name: '岁安生日',
    emoji: '🎂',
    monthDay: '03-31',
    advance5: '03-26',
    advance2: '03-29',
  },
  {
    name: '雪涵生日',
    emoji: '🎂',
    monthDay: '05-03',
    advance5: '04-28',
    advance2: '05-01',
  },
];

// ============================================================
// 农历正月22 → 公历对照表（每年元旦前更新！）
// ============================================================
const LUNAR_BIRTHDAY_MAP = {
  '2026': { monthDay: '03-10', advance5: '03-05', advance2: '03-08' },
  '2027': { monthDay: '02-27', advance5: '02-22', advance2: '02-25' },
  '2028': { monthDay: '02-16', advance5: '02-11', advance2: '02-14' },
  '2029': { monthDay: '03-06', advance5: '03-01', advance2: '03-04' },
  '2030': { monthDay: '02-24', advance5: '02-19', advance2: '02-22' },
};

// ============================================================
// 主逻辑
// ============================================================
async function main() {
  const now = new Date();
  const yearStr = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayMMDD = `${mm}-${dd}`;

  console.log(`[${now.toISOString()}] 北京时间 ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} | 检查: ${todayMMDD}`);

  const messages = [];

  // ---- 公历提醒 ----
  for (const r of REMINDERS) {
    if (todayMMDD === r.monthDay) {
      messages.push(`${r.emoji} 今天就是【${r.name}】！别忘了庆祝！`);
    } else if (todayMMDD === r.advance5) {
      messages.push(`📅 距离【${r.name}】还有 5 天（${r.monthDay}），该准备礼物和安排了。`);
    } else if (todayMMDD === r.advance2) {
      messages.push(`⚠️ 【${r.name}】就在后天（${r.monthDay}）！最后准备时间！`);
    }
  }

  // ---- 农历老婆生日 ----
  const lunarEntry = LUNAR_BIRTHDAY_MAP[yearStr];
  if (lunarEntry) {
    if (todayMMDD === lunarEntry.monthDay) {
      messages.push(`👸🎂 今天就是老婆农历生日（正月二十二）！`);
    } else if (todayMMDD === lunarEntry.advance5) {
      messages.push(`📅 距离老婆农历生日还有 5 天（${yearStr} 年公历 ${lunarEntry.monthDay}），该准备礼物了！`);
    } else if (todayMMDD === lunarEntry.advance2) {
      messages.push(`⚠️ 老婆农历生日就是后天（${yearStr} 年公历 ${lunarEntry.monthDay}）！最后准备！`);
    }
  } else {
    console.warn(`⚠️ 年份 ${yearStr} 的农历正月22未配置！请更新 LUNAR_BIRTHDAY_MAP`);
  }

  // ---- 无提醒 ----
  if (messages.length === 0) {
    console.log('今天无提醒');
    return;
  }

  // ---- 发送 Server酱 微信推送 ----
  const sendKey = process.env.SERVERCHAN_SENDKEY;
  if (!sendKey) {
    console.error('SERVERCHAN_SENDKEY 未配置！请在 GitHub Secrets 中设置。');
    console.log('本应推送的消息:\n', messages.join('\n'));
    process.exit(1);
  }

  const content = messages.join('\n\n');
  console.log(`准备推送 ${messages.length} 条提醒...`);

  try {
    const resp = await fetch(`https://sctapi.ftqq.com/${sendKey}.send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ title: '📅 重要日子提醒', desp: content }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await resp.json();
    console.log('推送成功:', JSON.stringify(result));
  } catch (err) {
    console.error('推送失败:', err.message);
    process.exit(1);
  }
}

main();
