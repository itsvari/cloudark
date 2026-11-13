---
title: Columba Zero
summary: a Raspberry Pi 5 pigeon-detection prototype, combining computer vision with opt-in, calibrated camera following.
publishedAt: 2026-11-02T07:30:00+08:00
canonicalSite: itsvari
syndicateTo: []
status: active
tags: [python, c++, computer vision]
links:
  github: https://github.com/itsvari/columba-zero
featured: false
---

## vision on a small machine

Columba Zero is a Raspberry Pi 5 prototype for detecting pigeons and exploring camera-based deterrence. it combines a Python command-line interface with a native C++ inference extension, using YOLO and NCNN.

camera following is opt-in and requires calibration. that keeps physical movement distinct from detection and makes the hardware constraints part of the design.

## a prototype with open checks

the implementation is still a prototype. hardware acceptance and throughput checks remain open, so this page does not claim proven field deterrence or verified performance on the final setup.

the public repository records the implementation and the checks still needed to establish how it behaves on the target hardware.
