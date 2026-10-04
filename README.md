# 行测错题本

Android 行测刷题应用的 APK 和更新信息发布仓库。支持离线练习、错题复习、收藏、笔记、题目与原卷导入、学习记录和个性化设置。

## 下载与安装

[查看最新正式版本](https://github.com/feiguang50-hub/xingce-updates/releases/latest)。通过 Release 中的下载链接获取 APK，支持 Android 9 及以上。首次接入在线更新，请安装 1.4.0 或更新版本。

## 应用内更新

打开“设置 → 关于 → 版本更新”，将更新源设为：

```text
https://raw.githubusercontent.com/feiguang50-hub/xingce-updates/main/latest.json
```

地址只需填写一次。之后可手动检查新版，也可打开“启动时检查”。应用显示版本说明，下载完成后校验文件和签名，再打开 Android 系统安装界面，由使用者确认安装。

覆盖安装保留题库、笔记、设置和进度。完整备份可在应用设置中导出。

## 版本发布

签名 APK 保存在 `apks/`，更新信息保存在 `main` 分支的 `latest.json`。每个正式 Release 使用新的版本标签，并设为 Latest；Release 页面提供 APK 下载链接。

更新信息中记录实际版本、APK 完整下载地址、文件大小、SHA-256 和更新说明。APK 下载地址指向对应版本标签，更新时提高 versionCode，并保留原签名密钥与包名。

发布下一版时先上传新的 APK，创建并发布对应版本标签，再更新 `main/latest.json`。应用的更新源保持不变。

这个仓库用于公开下载更新文件；签名密钥与密码单独保存。
