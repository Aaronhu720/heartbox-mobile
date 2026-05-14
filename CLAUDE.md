# Half日记 - 移动版 (heartbox-mobile)

## 项目概述
Half日记是一款情感疗愈日记应用，帮助用户记录情绪、疗愈心灵。
- **技术栈**: React 19 + TypeScript + Vite 6 + Capacitor 7
- **数据存储**: sql.js (asm版) + localStorage，全部本地存储，无需服务器
- **目标平台**: Android (已发布内测), iOS (待开发)

## 核心功能
- 📝 情绪日记 — 7种心情标签 + 10级评分
- 📅 情绪日历 — 颜色展示每日心情
- 💬 AI陪伴 — 豆包API对话（会员功能）
- ✉️ 延迟信件 — 定时发送 + 写给未来的自己
- 🔮 塔罗占卜 — 22张大阿卡纳，¥9.9/次
- ✨ 姓名测试 — 性格解析，¥9.9/次
- 🫂 疗愈空间 — 失恋五阶段建议 + 70+条疗愈语录
- 💝 每日暖心话 — 首页每日自动展示

## 项目结构
```
src/
  pages/          # 页面组件（Dashboard, NewEntry, Tarot, NameTest, Healing...）
  components/     # 通用组件（AdBanner, DailyQuoteCard, Navbar...）
  lib/            # 核心逻辑
    db.ts         # sql.js 数据库操作
    membership.ts # 会员/积分系统
    payment.ts    # 支付抽象层（当前模拟，待接入Google Play Billing）
    healing.ts    # 疗愈语录库 + 失恋阶段 + 情绪智能回复
    safety.ts     # 危机内容检测 + 心情标签定义
    AuthContext.tsx # 认证上下文
android/          # Capacitor Android 项目
public/           # 静态资源（privacy-policy.html）
```

## 会员/收费体系
- **免费**: 无限日记、情绪日历、写给未来的自己、隐私密码、疗愈空间
- **月度会员**: ¥19.9/月 → AI陪伴、趋势图表、数据导出、去广告
- **年度会员**: ¥199/年（推荐）
- **塔罗占卜**: ¥9.9/次，购买积分消耗
- **姓名测试**: ¥9.9/次，购买积分消耗
- **支付状态**: 当前为模拟支付（payment.ts），待接入 Google Play Billing

## Android 构建
```bash
# 环境变量
$env:JAVA_HOME = "E:\ANDRIOD\jbr"
$env:ANDROID_HOME = "E:\AndroidSdk"

# 构建步骤
npm run build
npx cap sync android
cd android && ./gradlew.bat bundleRelease  # 生成 AAB

# 签名信息
# keystore: halfdiary-release.keystore
# alias: halfdiary, 密码: halfdiary2026
```

## 关键注意事项
- sql.js **必须用 asm 版本**（sql-asm.js），sql-wasm 在 Android WebView 报 illegal type
- vite.config.ts 中有 alias 配置指向 asm 版本
- gradle.properties 需要 `android.overridePathCheck=true`（路径含中文字符）
- C盘空间紧张(~2GB)，大文件操作用E盘
- 包名: com.halfdiary.app, versionCode: 2, versionName: 1.1.0

## Google Play 状态
- **组织**: JONIE HOLDING LIMITED
- **账号ID**: 8181421572276574324
- **状态**: 内部测试已发布，等待审核
- **网站**: https://myhalf.ai (GitHub Pages)
- **隐私政策**: https://myhalf.ai/privacy-policy.html

## 待办事项
- [ ] 接入 Google Play Billing SDK（替换 payment.ts 模拟）
- [ ] iOS 版本（需 Mac + Xcode）
- [ ] 正式版发布到 Google Play
- [ ] myhalf.ai 开启 HTTPS (Enforce HTTPS)
