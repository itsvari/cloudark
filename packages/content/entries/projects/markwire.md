---
title: Markwire
summary: a multi-agent workflow for grading coding assignments, built as an accelerant (not a replacement) for human reviewers, with zero external Python dependencies.
publishedAt: 2026-11-22T02:00:00+08:00
canonicalSite: itsvari
syndicateTo: []
status: active
tags: [python, multi-agent, ai, cli]
links:
  github: https://github.com/itsvari/markwire
featured: true
---

## why i built it

Markwire grew out of my work as a TA for CS3227 (*Agentic Software Engineering*) at NUS, where my job was grading four coding projects and running online consults for my tutorial group. going in, i already knew one obvious truth about agent-assisted development: codebases bloat *fast* once coding agents get involved. manually combing through every line of every submission at that scale wasn't going to fly, so i wanted an agentic workflow that would speed up the grunt work while keeping a strict human-in-the-loop setup where i still had the final say over every single grade.

***accelerant, not replacement.*** that was the rule from day one.

the first version was a fairly ad-hoc setup i hacked together for the first coding assignment, and it kept evolving across the remaining three as real grading edge cases kept ambushing me - quota hiccups, models missing different bugs, checks that needed an actual browser/desktop on my Mac, and the joy of staring at raw agent output across a whole cohort. once it had survived all four projects, i stripped out the course-specific context and rebuilt it into a clean, general-purpose tool anyone can pick up without needing my setup.

## why multiple independent agents

the core bet in Markwire is simple: don't trust a single model pass, and don't only call in a second opinion after something already looks wrong. when grading CS3227, i pulled in grader agents from completely different model families (GPT, Claude, Gemini, DeepSeek) because every family has its own habits, strengths, and blind spots. a second reviewer brought in *only* after a score split won't catch a broken flow that the first model never bothered to test.

every assignment runs through a strict, auditable multi-agent pipeline:

- **pinned snapshots:** submissions (Git repos, local directories, or ZIP archives) are frozen up front alongside the rubric (supporting both shared team criteria + individual member criteria), so every grader agent is looking at the exact same code.
- **independent grading passes:** each configured grader evaluates submissions against the same verification floor, gathers concrete evidence, and stays isolated from peer scores.
- **arbitration + sanity review:** an arbiter agent reconciles score splits and conflicting evidence, followed by an independent sanity reviewer checking the proposed verdict before it ever lands in front of a human.
- **human sign-off:** a TA or instructor still reviews and approves every result before final grades or student feedback are exported.

## fixing the parts that actually sucked in practice

most of the real engineering in Markwire came from fixing my own clunky v1 decisions and the UX friction that showed up mid-semester:

- **structured offline reports instead of walls of text:** dumping raw flags from four grader agents into one view *sucks* to parse, and duplicate issues get buried fast. Markwire generates self-contained offline HTML reports - a Columns staff ledger (comparing scores, evidence, and arbitration rationales with semantic colour coding) plus optional per-stage reports (`setup`, `grading`, `arbitration`, `sanity`, `release`). open findings are grouped by topic and ranked by severity/impact; reviewers pick remediation options (or `Defer`, or write custom instructions) right in the browser and export one complete JSON decision packet back to the CLI via `import-decisions`.
- **targeted sibling revisions:** real courses *always* get last-minute rubric tweaks, late resubmissions, or regrade requests. because prepared workspaces freeze their inputs, `revise plan` and `revise create` spin up a sibling revision workspace that carries forward unaffected evaluations and only re-runs the exact submissions or criteria that changed.
- **detached multi-machine checks:** the later assignments had browser and computer-use checks that couldn't run on my main Linux box and had to be farmed out to my Mac (which, in my earlier ad-hoc setup, meant manually shuffling tarballs around like a cavewoman). `grading_bundles.py` packs a minimal, self-contained task archive (`pack` / `open` / `finish` / `import`) so a remote machine can run a check (including local interactive logins) and ship verified evidence back - works completely standalone over any file transfer, and hooks into T3 Code's multi-machine orchestration if you have it enabled.

## built to be portable

Markwire is written in standard-library Python 3.11+ with zero external runtime dependencies, tested across macOS, Linux, and Windows (with strict `mypy`, `ruff`, `unittest`, and Node.js checks for the interactive report JS in CI). it's also harness-agnostic - it works with any coding agent that can read and write workspace files, and ships with a fully offline synthetic demo so you can poke through the staff ledger, stage report, and student feedback archive without burning a single token.
