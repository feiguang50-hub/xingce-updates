# 行测错题本 · 界面优化

这一层沿用 1.8.0 发布包里的题库、导入、练习、笔记、附件和备份逻辑，统一浅色与深色主题，并重新组织练习首页。所有依赖继续保存在生成的 HTML 内，使用时无需外部字体、CDN 或在线服务。

## 本地预览

```sh
python ui/build.py
python -m http.server 8766 --bind 127.0.0.1 --directory dist
```

用浏览器打开 `http://127.0.0.1:8766`。浏览器版本的数据存储与 Android 正式版相互独立；可用应用已有的完整备份在两者之间迁移。

`theme.css` 管理视觉样式；`home.js` 替换首页呈现；`practice.js` 提供附图大图、放大和平移查看、返回操作与答题进度条，复用原有附件存储和作答逻辑。关闭大图后保持题号、答案与页面位置。`build.py` 校验基底 APK 的 SHA-256，再注入这三个文件。修改基底版本前必须重新核对注入点和原有行为。

## 浏览器检查

```sh
python ui/build.py
npm ci
npx playwright install --with-deps chromium
npm test
```

检查覆盖离线图题放大和平移、反复打开、Escape 与 Android 返回处理、320px 长材料和超长选项、作答计数、进度条、刷新续练、深色主题与附件备份。CI 同时运行这些检查。使用本机已安装的 Chrome 时，可设置 `CHROME_PATH` 为浏览器可执行文件的路径。

## 正式 APK

正式升级必须使用原应用包名、递增版本号和原签名密钥。此目录不修改已发布 APK、标签或 `latest.json`，也不生成可冒充正式更新的包。

独立的 Android 界面预览使用另外的应用 ID 和开发签名，可以与正式版并行安装，不读取正式版私有数据。

```sh
python ui/build_preview.py
```

生成的 `dist/xingce-ui-preview-unsigned.apk` 还需要用 Android SDK 的 `zipalign` 对齐，再用 `apksigner` 和独立的开发密钥签名。应用 ID 为 `cn.xingce.practice.preview`，Activity 与 Provider 仍指向原有原生壳的完整类名，Provider authority 也独立命名。预览版关闭正式 APK 更新入口。

`1.8.0-ui.2` 已在 Android 15 / API 35 模拟器（WebView 124）中验证：与正式版并行安装、原生保存作答、系统返回暂停练习、杀进程后续练、Android 文件选择器导出与恢复完整备份、恢复附图、放大查看和返回关闭，以及正式版与预览版数据隔离。模拟器验证不等于真机测试；正式升级仍需原签名和实际设备验证。
