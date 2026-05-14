# Half日记 移动端构建指南

## 项目概述

Half日记移动版基于 React + Capacitor 构建，支持 iOS 和 Android 平台。
所有数据存储在用户设备本地（SQLite），不需要服务器。

---

## 一、开发环境准备

### 通用工具
- Node.js 18+
- npm 或 yarn

### Android 开发
- [Android Studio](https://developer.android.com/studio) (最新版)
- Android SDK (API Level 33+)
- JDK 17

### iOS 开发 (需要 Mac)
- macOS 电脑
- [Xcode](https://developer.apple.com/xcode/) 15+
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer 账号 ($99/年)

---

## 二、本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（浏览器预览）
npm run dev

# 类型检查
npx tsc --noEmit
```

---

## 三、构建 Android APK/AAB

### 3.1 构建 Web 资源并同步
```bash
npm run build
npx cap sync android
```

### 3.2 用 Android Studio 打开
```bash
npx cap open android
```

### 3.3 生成签名密钥（首次）
```bash
keytool -genkey -v -keystore halfdiary-release.keystore -alias halfdiary -keyalg RSA -keysize 2048 -validity 10000
```

### 3.4 在 Android Studio 中构建
1. 菜单 → Build → Generate Signed Bundle / APK
2. 选择 **Android App Bundle (AAB)** 用于 Google Play
3. 选择 **APK** 用于直接分发
4. 选择你的签名密钥
5. 选择 release 构建
6. 等待构建完成

### 3.5 输出文件位置
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### 3.6 上传到 Google Play
1. 登录 [Google Play Console](https://play.google.com/console)
2. 创建应用 → 填写应用名称 "Half日记"
3. 上传 AAB 文件
4. 填写商店信息（截图、描述等）
5. 设定定价（免费）
6. 提交审核

---

## 四、构建 iOS (需要 Mac)

### 4.1 构建并同步
```bash
npm run build
npx cap sync ios
```

### 4.2 安装 CocoaPods 依赖
```bash
cd ios/App
pod install
cd ../..
```

### 4.3 用 Xcode 打开
```bash
npx cap open ios
```

### 4.4 在 Xcode 中配置
1. 选择 **App** target
2. **General** 标签 → 设置 Bundle Identifier: `com.halfdiary.app`
3. **Signing & Capabilities** → 选择你的 Apple Developer Team
4. 设置最低 iOS 版本为 15.0

### 4.5 构建 Archive
1. 选择目标设备为 "Any iOS Device (arm64)"
2. 菜单 → Product → Archive
3. 等待 Archive 完成

### 4.6 上传到 App Store
1. Archive 完成后 → Distribute App
2. 选择 **App Store Connect**
3. 上传到 App Store Connect
4. 登录 [App Store Connect](https://appstoreconnect.apple.com)
5. 创建应用 → 填写信息
6. 选择已上传的 Build
7. 填写截图、描述、关键词
8. 提交审核

---

## 五、应用商店信息建议

### 应用名称
Half日记 - 私密情绪空间

### 简短描述
写下来，但不冲动发出去。你的私人情绪日记和未来信件盒子。

### 详细描述
Half日记是一款专为情感疗愈设计的私密日记应用。

主要功能：
• 情绪日记 - 记录每天的心情，支持情绪标签和评分
• AI 陪伴 - 温柔的 AI 倾听者，随时倾听你的感受
• 延迟发送 - 写下想说的话，设定未来再决定是否发送
• 写给未来的自己 - 锁定信件，未来某天再开启
• 情绪日历 - 可视化你每天的情绪变化
• 情绪趋势 - 看到自己正在慢慢好起来
• 隐私保护 - 独立隐私密码，数据仅存本地

所有数据只保存在你的手机上，不会上传到任何服务器。

### 分类
Health & Fitness / Lifestyle

### 关键词
日记,情绪,心理健康,疗愈,私密,分手恢复,情感

---

## 六、修改应用图标

### Android
替换以下目录中的图标文件：
```
android/app/src/main/res/mipmap-hdpi/ic_launcher.png      (72x72)
android/app/src/main/res/mipmap-mdpi/ic_launcher.png      (48x48)
android/app/src/main/res/mipmap-xhdpi/ic_launcher.png     (96x96)
android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png    (144x144)
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png   (192x192)
```

### iOS
在 Xcode 中打开 `ios/App/App/Assets.xcassets/AppIcon.appiconset`，替换图标。

---

## 七、注意事项

1. **签名密钥**: Android 的 keystore 文件要妥善保管，丢失后无法更新应用
2. **Apple Developer**: iOS 上架需要 Apple Developer 账号 ($99/年)
3. **Google Play**: 首次注册 Google Play 开发者需要 $25 一次性费用
4. **隐私政策**: 两个平台都需要提供隐私政策页面
5. **AI 功能**: 用户需要自行配置豆包 API Key 才能使用 AI 陪伴功能
6. **数据安全**: 所有数据存储在设备本地 localStorage 中，卸载应用会丢失数据

---

## 八、常用命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本

# Capacitor
npx cap sync         # 同步 Web 资源到原生项目
npx cap open android # 用 Android Studio 打开
npx cap open ios     # 用 Xcode 打开

# 一键构建+同步
npm run cap:build    # build + sync
```
