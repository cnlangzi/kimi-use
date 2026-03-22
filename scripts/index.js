#!/usr/bin/env node

/**
 * Kimi Use - Kimi AI tools for Node.js
 * 
 * Usage:
 *   node scripts/index.js chat "hello"
 *   node scripts/index.js image "what is this?" /path/to/image.jpg
 *   node scripts/index.js translate "hello" --to Chinese
 */

import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const KIMI_API_KEY = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
const KIMI_API_HOST = process.env.KIMI_API_HOST || 'https://api.moonshot.cn';

if (!KIMI_API_KEY) {
  console.error('Error: KIMI_API_KEY (or MOONSHOT_API_KEY) environment variable not set.');
  console.error('Get your API key at: https://platform.moonshot.cn/');
  process.exit(1);
}

const client = new OpenAI({
  apiKey: KIMI_API_KEY,
  baseURL: `${KIMI_API_HOST}/v1`,
});

const MODEL = process.env.KIMI_MODEL || 'moonshot-v1-8k';
const VISION_MODEL = process.env.KIMI_VISION_MODEL || 'kimi-vl-flash';

async function chat(message, opts = {}) {
  const { system = null, model = MODEL, temperature = 1.0, max_tokens = 4096, stream = false, history = null } = opts;
  
  const messages = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  if (history) {
    messages.push(...history);
  }
  messages.push({ role: 'user', content: message });

  try {
    const params = {
      model,
      messages,
      temperature,
      max_tokens,
      stream,
    };
    
    if (stream) {
      params.stream = true;
      const stream = await client.chat.completions.create(params);
      for await (const chunk of stream) {
        process.stdout.write(chunk.choices[0]?.delta?.content || '');
      }
      return null;
    }
    
    const response = await client.chat.completions.create(params);
    const content = response.choices[0]?.message?.content || '';
    return { success: true, result: { content } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function understandImage(prompt, imagePath, opts = {}) {
  const { model = VISION_MODEL, temperature = 0.3, max_tokens = 300 } = opts;
  
  // Read image and encode as base64
  let imageData;
  try {
    const buffer = readFileSync(resolve(imagePath));
    const ext = imagePath.toLowerCase().split('.').pop();
    const mimeType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
    }[ext] || 'image/jpeg';
    imageData = buffer.toString('base64');
    
    const imageUrl = `data:${mimeType};base64,${imageData}`;
    
    const response = await client.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: prompt }
        ]
      }],
      temperature,
      max_tokens,
    });
    
    const content = response.choices[0]?.message?.content || '';
    return { success: true, result: { content } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function translate(text, opts = {}) {
  const { to = 'English', from = 'auto', model = MODEL } = opts;
  
  const systemPrompt = `You are a professional translator. Translate the following text to ${to}${from !== 'auto' ? ` from ${from}` : ''}. Only output the translated text, no explanations.`;
  
  return await chat(text, { system: systemPrompt, model, temperature: 0.3, max_tokens: 4096 });
}

async function webSearch(query, opts = {}) {
  // Kimi doesn't have a native web search API, use chat for now
  const { model = MODEL } = opts;
  return await chat(
    `Please search your knowledge and provide information about: ${query}`,
    { system: 'You are a helpful assistant with up-to-date knowledge.', model }
  );
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/index.js chat "message" [--model MODEL] [--stream]');
    console.log('  node scripts/index.js image "prompt" /path/to/image.jpg [--model MODEL]');
    console.log('  node scripts/index.js translate "text" --to Chinese [--from English]');
    console.log('  node scripts/index.js search "query"');
    console.log('');
    console.log('Environment variables:');
    console.log('  KIMI_API_KEY or MOONSHOT_API_KEY - API key (required)');
    console.log('  KIMI_API_HOST - API host (default: https://api.moonshot.cn)');
    console.log('  KIMI_MODEL - chat model (default: moonshot-v1-8k)');
    console.log('  KIMI_VISION_MODEL - vision model (default: kimi-vl-flash)');
    process.exit(0);
  }

  const command = args[0];
  const rest = args.slice(1);

  // Parse arguments - process rest array
  const getOpt = (args) => {
    const result = {};
    const remaining = [];
    const consumed = new Set();
    for (let i = 0; i < args.length; i++) {
      if (consumed.has(i)) continue;
      const opt = args[i];
      if (opt === '--model' && i + 1 < args.length) { result.model = args[i + 1]; consumed.add(i); consumed.add(i + 1); }
      else if (opt === '--stream') { result.stream = true; consumed.add(i); }
      else if (opt === '--to' && i + 1 < args.length) { result.to = args[i + 1]; consumed.add(i); consumed.add(i + 1); }
      else if (opt === '--from' && i + 1 < args.length) { result.from = args[i + 1]; consumed.add(i); consumed.add(i + 1); }
      else if (opt === '--temperature' && i + 1 < args.length) { result.temperature = parseFloat(args[i + 1]); consumed.add(i); consumed.add(i + 1); }
      else if (opt === '--max-tokens' && i + 1 < args.length) { result.max_tokens = parseInt(args[i + 1]); consumed.add(i); consumed.add(i + 1); }
      else if (!opt.startsWith('--')) { remaining.push(opt); consumed.add(i); }
    }
    return { parsed: result, remaining };
  };

  let result;
  
  switch (command) {
    case 'chat': {
      const msg = rest.find(a => !a.startsWith('--')) || '';
      const { parsed, remaining } = getOpt(rest);
      result = await chat(msg, parsed);
      break;
    }
    
    case 'image': {
      const prompt = rest.find((a, i) => !a.startsWith('--') && i < rest.length - 1 && rest[i + 1]?.startsWith('/'));
      const imagePath = rest.find(a => a.startsWith('/'));
      const { parsed } = getOpt(rest);
      if (!imagePath) {
        console.error('Error: image path required');
        process.exit(1);
      }
      result = await understandImage(prompt, imagePath, parsed);
      break;
    }
    
    case 'translate': {
      const text = rest.find(a => !a.startsWith('--'));
      const { parsed } = getOpt(rest);
      result = await translate(text, parsed);
      break;
    }
    
    case 'search': {
      const query = rest.find(a => !a.startsWith('--')) || '';
      result = await webSearch(query, {});
      break;
    }
    
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }

  if (result?.success) {
    const output = typeof result.result === 'object' 
      ? JSON.stringify(result.result, null, 2)
      : result.result;
    console.log(output);
  } else {
    console.error('Error:', result?.error || 'Unknown error');
    process.exit(1);
  }
}

// Export functions for use as module
export { chat, understandImage, translate, webSearch };

// Run if executed directly
main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
