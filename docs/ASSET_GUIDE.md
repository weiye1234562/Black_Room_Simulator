# 式神头像资源获取指南

> 本文档说明如何获取 178 个式神的头像图片资源

---

## 方案一：萌娘百科共享资源（推荐）

**地址**：https://commons.moegirl.org.cn/zh/Category:阴阳师·百闻牌

包含了 **1,914 个**百闻牌相关图片文件（卡面原画、头像、立绘等）。

### 步骤
1. 访问上述地址
2. 按式神名称搜索对应图片
3. 下载 PNG/JPG 文件
4. 按 `data/shikigami.json` 中的 `image` 字段重命名
5. 放入 `public/images/shikigami/` 目录

---

## 方案二：BWIKI 百闻牌 Wiki

**地址**：https://wiki.biligame.com/yysbwp/

每个式神有独立页面，页面内嵌有式神头像和立绘。

### 步骤
1. 访问 Wiki 首页 → 式神图鉴
2. 进入每个式神的详情页
3. 右键保存头像图片
4. 按式神 ID 重命名（如 `001_taohuayao.png`）

---

## 方案三：游戏客户端解包（最高清）

百闻牌基于网易 NEXO 引擎开发，游戏资源可以从 Android 客户端提取。

### 所需工具
| 工具 | 用途 | 链接 |
|---|---|---|
| NeoXtractor | 解包 .npk 文件 | https://github.com/MarcosVLl2/NeoXtractor |
| SpineViewer | 查看 Spine 动画 | https://github.com/ww-rm/SpineViewer |

### 步骤
1. 在 Android 设备安装百闻牌
2. 从 `Android/data/com.netease.yysbwp/files/netease/g97/` 提取以下 NPK：
   - `texture.npk` → 式神小图/头像
   - `spine.npk` → 头像框、头像
   - `bigtexture.npk` → 卡面原画
3. 使用 NeoXtractor 解包提取 PNG 资源
4. 从中筛选方形头像并重命名

---

## 方案四：成品资源合集

搜索关键词：`百闻牌 卡牌原画 合集 网盘`

部分公众号/社区有整理好的资源包，覆盖至 2022 年内容，约 5GB。

---

## 开发阶段占位方案

在获取到真实美术资源之前，使用 **CSS 首字头像**作为占位：

- 圆形色块背景（根据式神 ID 生成颜色）
- 中央显示式神名称的第一个字
- 示例实现：

```css
.shikigami-avatar {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: var(--avatar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  font-weight: bold;
}
```

```html
<div class="shikigami-avatar" style="--avatar-bg: #c0392b;">
  桃
</div>
```

### 重命名对照

下载真实图片后，按以下格式重命名并放入 `public/images/shikigami/`：

```
001_taohuayao.png     → 桃花妖
002_quanshen.png       → 犬神
003_jiutuntongzi.png   → 酒吞童子
...
```

完整对应关系见 `data/shikigami.json` 中的 `image` 字段。

---

## 建议优先级

1. **开发阶段** → 使用 CSS 首字占位头像
2. **测试阶段** → 从萌娘共享/BWIKI 手动下载常用式神头像
3. **正式比赛** → 使用方案三（客户端解包）获取高清完整资源
