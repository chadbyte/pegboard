# Pegboard

> You paste your text into ChatGPT and say "make this professional."
> Next time, you paste again. "Make this professional." Again. And again.
>
> **Pegboard pins that as a function. Paste in, get out. No repeat instructions.**

A desktop AI workspace where each agent is a **stateless function** on an infinite canvas. No chat history. No context drift. Just input → output.

## Why

Chat-based AI has a fundamental problem: **you repeat yourself constantly.** Every new conversation starts from zero. You re-explain your tone, your format, your rules.

Pegboard treats AI agents like Unix tools — each one does **one thing**, with a fixed system prompt. Compose them visually on a canvas. Send output from one to another.

**Chat is a conversation. Pegboard is a workbench.**

## Features

- **Infinite canvas** — Place AI agents as boxes, arrange them freely with zoom/pan
- **Stateless agents** — Each box has a fixed system prompt. No context bleed between runs
- **Multi-model** — GPT-4, Claude, Gemini in the same workspace
- **Send-to** — Route output from one agent to another
- **Multi-canvas tabs** — Organize different workflows in separate canvases
- **Desktop widgets** — Pop out any agent as an always-on-top floating window. Lives on your desktop, ready when you need it. Position and size remembered across restarts.
- **Text boxes** — Add notes and documentation alongside your agents
- **Local-first** — Your API keys stay on your machine. Nothing leaves your desktop.

## Install

### macOS (Apple Silicon)

```bash
curl -fsSL https://raw.githubusercontent.com/chadbyte/pegboard/main/install.sh | bash
```

Or download directly from [Releases](https://github.com/chadbyte/pegboard/releases).

## Use Cases

| Agent | System Prompt | Input → Output |
|-------|--------------|----------------|
| **Grammar** | "Fix grammar, keep tone" | Rough draft → Clean text |
| **Summarizer** | "Summarize in 3 bullets" | Long article → Key points |
| **Code Review** | "Review for bugs and style" | Code snippet → Feedback |
| **Email Drafter** | "Professional, concise, friendly" | Key points → Ready-to-send email |
| **Translator** | "Translate to Korean, natural tone" | English text → Korean |

Pop out any agent as a **desktop widget** — your grammar checker floats on screen while you write, your code reviewer sits next to your editor. Always there, always ready.

Pin it once. Use it forever. No repeat instructions.

## Development

```bash
npm install
npm run electron:dev
```

## License

ISC

---

Built by [chadbyte](https://dev.to/chadbyte)
