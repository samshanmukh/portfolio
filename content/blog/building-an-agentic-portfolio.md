---
title: "I rebuilt my portfolio as an AI agent"
date: "2026-06-18"
excerpt: "Why the best way to prove you build agentic AI is to make the site itself one, plus the in-browser ML demos behind it."
---

Most portfolios *tell* you what someone can do. For an engineer who builds AI, that's a missed opportunity: you can **show** it, live, in the browser.

So I rebuilt mine around a simple idea: **the site itself should be the demo.**

## The portfolio agent

The homepage is a chat agent you can ask anything about my work. It runs on a small intent engine over my own data, and you can flip on a **free in-browser LLM** (WebGPU) for free-form answers. No server, no API key, no cost. The medium is the message: if I claim to build agents, you should be able to talk to one.

## Live ML you can touch

Two demos run entirely on your device:

- **AI personal trainer:** your webcam, pose estimation, and a rep counter that checks squat depth *and coaches you out loud*. It's my RepRight + VoiceCoach projects, merged.
- **Draw-a-digit:** a neural net I trained on MNIST (~97% accuracy) running as plain JavaScript. No TensorFlow, no model server, just the weights and a forward pass.

## Why it matters

A recruiter who *experiences* a model believes it instantly, far more than a bullet point. And it's shareable, which is the only real way a portfolio earns repeat visits.

If you want the details on any of these, just ask the agent on the homepage.
