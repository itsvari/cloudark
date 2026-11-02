---
title: Columba Zero
summary: A Raspberry Pi 5 pigeon-detection prototype, combining computer vision with opt-in, calibrated camera following.
publishedAt: 2026-11-02T07:30:00+08:00
canonicalSite: itsvari
syndicateTo: []
status: active
tags: [python, c++, computer vision]
links:
  github: https://github.com/itsvari/columba-zero
featured: false
---

## Vision on a small machine

Columba Zero is a Raspberry Pi 5 prototype for detecting pigeons and exploring camera-based deterrence. It combines a Python command-line interface with a native C++ inference extension, using YOLO and NCNN.

Camera following is opt-in and requires calibration. That keeps physical movement distinct from detection and makes the hardware constraints part of the design.

## A prototype with open checks

The implementation is still a prototype. Hardware acceptance and throughput checks remain open, so this page does not claim proven field deterrence or verified performance on the final setup.

The public repository records the implementation and the checks still needed to establish how it behaves on the target hardware.
