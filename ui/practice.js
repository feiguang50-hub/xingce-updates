/* Reading tools share the original attachment store and never change answers. */
(() => {
  const viewer = document.createElement('dialog');
  viewer.className = 'image-viewer';
  viewer.setAttribute('aria-labelledby', 'image-viewer-title');
  viewer.innerHTML = `<header class="image-viewer-heading"><div><strong id="image-viewer-title">题目附图</strong><span id="image-viewer-info">正在加载…</span></div><button class="icon-button" aria-label="关闭大图" onclick="this.closest('dialog').close()">${icon('x')}</button></header>
    <div class="image-viewer-stage" tabindex="0" aria-label="题图，可滚动查看"><img alt="题目附图原图" hidden><p role="status">正在加载题图…</p></div>
    <footer class="image-viewer-controls"><button class="b g" data-zoom="out" aria-label="缩小题图">−</button><output aria-label="题图缩放比例">100%</output><button class="b g" data-zoom="in" aria-label="放大题图">＋</button><button class="b g" data-zoom="fit">适应宽度</button></footer>`;
  document.body.appendChild(viewer);
  const stage = viewer.querySelector('.image-viewer-stage');
  const image = viewer.querySelector('img');
  const status = viewer.querySelector('[role=status]');
  const info = viewer.querySelector('#image-viewer-info');
  let generation = 0, objectURL = null, zoom = 1, returnFocus = null;

  function showScale(center = true) {
    if (image.hidden || !image.naturalWidth) return;
    const fit = Math.min(image.naturalWidth, Math.max(1, stage.clientWidth - 32));
    image.style.width = Math.round(fit * zoom) + 'px';
    viewer.querySelector('output').textContent = Math.round(zoom * 100) + '%';
    viewer.querySelector('[data-zoom=out]').disabled = zoom <= .5;
    viewer.querySelector('[data-zoom=in]').disabled = zoom >= 4;
    if (center) stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
  }

  viewer.addEventListener('click', event => {
    const action = event.target.closest('[data-zoom]')?.dataset.zoom;
    if (!action || image.hidden) return;
    zoom = action === 'fit' ? 1 : Math.max(.5, Math.min(4, zoom * (action === 'in' ? 1.5 : 1 / 1.5)));
    showScale();
    if (action === 'fit') stage.scrollTop = 0;
  });
  viewer.addEventListener('close', () => {
    generation++;
    image.onload = image.onerror = null;
    image.removeAttribute('src');
    image.hidden = true;
    if (objectURL) URL.revokeObjectURL(objectURL);
    objectURL = null;
    if (returnFocus?.isConnected) returnFocus.focus({preventScroll: true});
  });
  window.addEventListener('resize', () => { if (viewer.open) showScale(false); });

  async function openImage(id, trigger) {
    cancelAutoNext();
    const request = ++generation;
    returnFocus = trigger;
    zoom = 1;
    status.hidden = false;
    status.textContent = '正在加载题图…';
    info.textContent = '支持放大后滑动查看';
    image.hidden = true;
    for (const button of viewer.querySelectorAll('[data-zoom]')) button.disabled = true;
    viewer.querySelector('output').textContent = '100%';
    viewer.showModal();
    try {
      const attachment = await vault.get(id);
      if (!viewer.open || request !== generation) return;
      if (!attachment?.blob) throw Error('题图不存在，请重新导入附件');
      objectURL = URL.createObjectURL(attachment.blob);
      image.onload = () => {
        if (!viewer.open || request !== generation) return;
        status.hidden = true;
        image.hidden = false;
        info.textContent = `原图 ${image.naturalWidth} × ${image.naturalHeight} · 可滑动查看`;
        for (const button of viewer.querySelectorAll('[data-zoom]')) button.disabled = false;
        showScale();
        stage.scrollTop = 0;
      };
      image.onerror = () => {
        if (viewer.open && request === generation) {
          status.textContent = '题图无法显示，请检查附件或重新导入';
          info.textContent = '题图加载失败';
        }
      };
      image.src = objectURL;
    } catch (error) {
      if (viewer.open && request === generation) {
        status.textContent = error.message;
        info.textContent = '题图加载失败';
      }
    }
  }

  const originalMedia = renderMedia;
  renderMedia = async function (...args) {
    await originalMedia.apply(this, args);
    for (const img of document.querySelectorAll('#app [data-image] > img.qimage')) {
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'question-image-button';
      trigger.setAttribute('aria-label', '查看题目附图大图');
      const id = img.parentElement.dataset.image;
      img.replaceWith(trigger);
      trigger.appendChild(img);
      const hint = document.createElement('span');
      hint.className = 'question-image-hint';
      hint.textContent = '轻点查看大图';
      trigger.appendChild(hint);
      trigger.addEventListener('click', () => openImage(id, trigger));
    }
  };

  const originalBack = handleAndroidBack;
  handleAndroidBack = function () {
    if (viewer.open) { viewer.close(); return true; }
    return originalBack();
  };

  const originalHeader = practiceHeader;
  practiceHeader = function () {
    const answered = P.it.filter(it => it.p !== null).length;
    return originalHeader().replace('</header>', `<progress class="practice-completion" value="${answered}" max="${P.it.length}" aria-label="本轮已答 ${answered} / ${P.it.length} 题"></progress></header>`);
  };
})();
