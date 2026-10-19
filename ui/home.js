/* Presentation only: reuse the original question, session and storage functions. */
V.home = () => {
  const study = studyToday();
  const tasks = todayTasks();
  const active = P && !P.finished;
  const empty = !d.qs.length;
  const mods = [...new Set([...MODS, ...uniq('mod')])];
  const last = d.ses[d.ses.length - 1];
  const primaryAction = active ? 'resume()' : empty ? "setTab('imp')" : tasks.length ? "go(todayTasks(),false,'practice')" : 'openPicker()';
  const primaryLabel = active ? '继续上次练习' : empty ? '导入第一份题' : tasks.length ? '开始今日任务' : '自由选题练习';
  const detail = active ? `已答 ${P.it.filter(it => it.p !== null).length} / ${P.it.length} 题，进度已为你保存` : empty ? '从一份试卷开始，慢慢积累自己的题库。' : tasks.length ? `这一轮 ${tasks.length} 题，包含到期复习与新题。` : '当前没有到期任务，可以自由选择想练的题。';
  const date = new Date().toLocaleDateString('zh-CN', {month: 'long', day: 'numeric', weekday: 'short'});
  return `<header class="study-heading">
    <div><small>${esc(date)}</small><h1>行测错题本</h1></div>
    ${globalThis.XINGCE_UI_PREVIEW ? '<span class="design-preview-label">设计预览</span>' : ''}
    <button class="icon-button" aria-label="搜索题库" onclick="setTab('lib');$('#library-search').focus()">${icon('search')}</button>
  </header>
  <section class="study-hero">
    <div class="study-kicker"><span>${active ? '继续专注' : '今日练习'}</span><span>今日已答 ${study.count} 题</span></div>
    <h2>${active ? '接着上次的进度，继续练。' : '留一点时间，练好每一题。'}</h2>
    <p>${detail}</p>
    <button class="study-primary" onclick="${primaryAction}">${primaryLabel}${icon('chevron-right')}</button>
    <div class="study-hero-footer"><span>${study.seconds >= 60 ? '今日专注 ' + Math.floor(study.seconds / 60) + ' 分钟' : '按自己的节奏，稳稳向前'}</span><button onclick="setTab('settings')">调整练习目标</button></div>
  </section>
  <div class="study-shortcuts">
    <button onclick="openPicker()">${icon('checklist')}<span>自由选题</span></button>
    <button onclick="setTab('sets')">${icon('book')}<span>我的试卷</span></button>
    <button onclick="openWrongReview()">${icon('clipboard-list')}<span>错题复习</span></button>
  </div>
  ${empty ? `<section class="study-empty"><h2>让题库，从你的资料里长出来</h2><p>支持导入 PDF、Word 和文本。没有准备好资料，也可以先试着做几道题。</p><button onclick="examples()">添加3道示例题</button></section>` : `
  <div class="study-section-heading"><h2>按科目练习</h2><button class="text-button" onclick="setTab('imp')">导入题目</button></div>
  <section class="study-modules" aria-label="行测专项选题">${mods.map(mod => {
    const st = moduleProgress(mod);
    return `<button class="study-module" onclick="modulePicker(${arg(mod)})"><strong>${esc(MODULE_NAMES[mod] || mod)}</strong><span>${st.total ? '已练 ' + st.done + ' / ' + st.total + ' 题' : '等待加入题目'}</span><progress value="${st.done}" max="${Math.max(1, st.total)}" aria-label="${esc(MODULE_NAMES[mod] || mod)}已练进度"></progress></button>`;
  }).join('')}</section>`}
  ${last ? `<section class="study-recent"><div><strong>最近一次练习</strong><p>${esc(last.title || '行测练习')} · 完成 ${last.n}/${last.total || last.n} 题</p></div><button class="text-button" onclick="${last.it?.length ? `viewSession(${arg(last.id)})` : "setTab('history')"}">查看复盘</button></section>` : ''}
  ${!empty ? `<div class="study-section-heading"><h2>题库整理</h2><button class="text-button" onclick="setTab('lib')">查看全部</button></div><section class="c"><div class="stats">${statButton(d.qs.filter(ready).length, '可练题目', 'ready')}${statButton(d.qs.filter(q => !q.ans).length, '待补答案', 'answer')}${statButton(d.qs.filter(q => imageNeeded(q) && !hasVisual(q)).length, '待补原图', 'image')}</div></section>` : ''}
  <p class="study-summary">${d.qs.length} 道题 · ${d.sets.length} 份试卷 · ${d.practiceLists.length} 份练习清单</p>`;
};

if (globalThis.XINGCE_UI_PREVIEW) {
  // A separately installed preview must never offer the production APK update.
  V.updates = () => `${pageHeading('设计预览', 'settings')}<section class="c"><h2>行测错题本 · 界面预览</h2><p>这份预览独立安装，与正式版分别保存数据。</p><p class="m">可以从正式版导出备份，再到这里恢复体验。正式版更新仍在原应用中进行。</p><button class="b" onclick="setTab('bk')">备份与恢复</button></section>`;
}
