---
name: kimi-use
version: 0.2.0
description: "Kimi AI tools for Node.js - chat, image understanding, translation, web search. Use when you need LLM capabilities with Kimi models."
metadata:
  openclaw:
    requires:
      env:
        - KIMI_API_KEY
    primaryEnv: KIMI_API_KEY
    os:
      - linux
      - darwin
      - win32
---

# Kimi Use - Node.js AI Tools

Kimi AI 工具集，提供对话、图像理解、翻译、搜索等功能。Node.js 实现。

## 统一接口（与其他 provider 接口一致）

```javascript
import { chat, translate, understandImage, webSearch } from 'kimi-use/scripts/index.js';

// 对话
await chat('你好');                              // 简单对话
await chat('写代码', { model: 'kimi-for-coding' });  // 指定模型
await chat('继续', { history: [{role:'user',content:'你好'}] }); // 带历史

// 图像理解
await understandImage('图片里有什么?', '/path/to/image.jpg');
await understandImage('描述这张图', 'https://example.com/image.jpg');

// 翻译
await translate('hello', { to: 'Chinese' });
await translate('你好', { to: 'English', from: 'zh' });

// 搜索（基于模型知识库）
await webSearch('今日新闻');
```

## 返回格式

```javascript
// 成功
{ success: true, result: { content: '...' } }

// 失败
{ success: false, error: 'error message' }
```

## CLI 用法

```bash
# 对话
node scripts/index.js chat "你好"

# 图像理解
node scripts/index.js image "描述图片" /path/to/image.jpg

# 翻译
node scripts/index.js translate "hello" --to Chinese

# 搜索
node scripts/index.js search "news"
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `KIMI_API_KEY` | - | 必填，API Key |
| `KIMI_API_HOST` | `https://api.kimi.com/coding` | API 端点 |
| `KIMI_MODEL` | `kimi-for-coding` | 对话模型 |
| `KIMI_VISION_MODEL` | `kimi-vl-flash` | 视觉模型 |

获取 API Key: https://www.kimi.com/code/user-center/basic-information/interface-key

## 函数签名

### chat(message, opts)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| message | string | - | 用户消息 |
| opts.system | string | null | 系统提示 |
| opts.model | string | kimi-for-coding | 模型名 |
| opts.temperature | number | 1.0 | 温度 0-1 |
| opts.max_tokens | number | 4096 | 最大 token |
| opts.stream | boolean | false | 流式输出 |
| opts.history | array | null | 历史记录 |

### understandImage(prompt, imagePath, opts)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| prompt | string | - | 关于图片的问题 |
| imagePath | string | - | 图片路径或 URL |
| opts.model | string | kimi-vl-flash | 视觉模型 |
| opts.temperature | number | 0.3 | 温度 |
| opts.max_tokens | number | 300 | 最大 token |

### translate(text, opts)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | string | - | 待翻译文本 |
| opts.to | string | English | 目标语言 |
| opts.from | string | auto | 源语言 |
| opts.model | string | kimi-for-coding | 模型名 |

### webSearch(query, opts)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| query | string | - | 搜索查询 |
| opts.model | string | kimi-for-coding | 模型名 |

## 安装依赖

```bash
cd ~/workspace/skills/kimi-use
npm install
```
