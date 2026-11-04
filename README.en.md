# Kadrik · kadrik-motion

A local motion editor with a Russian Studio interface. Your coding agent creates an HTML/GSAP film, then you edit its words and colours, add frame comments, undo changes and export a video.

## Start

Requirements:Node.js22+,Chrome/Chromium,FFmpeg andffprobe.

```sh
git clone https://github.com/korkinss1-ops/kadrik-motion.git
cd kadrik-motion
node cli/om.js doctor
node cli/om.js new ../my-film
node cli/om.js studio ../my-film --no-open
```

Use the local address printed by Studio. The renamed package has not been published to npm. The `om` command is shared by the CLI and the bundled skill.

[Russian guide](README.md) · [Agent guide](skills/kadrik-motion/SKILL.ru.md).

## Included

The complete original engine, technical reference library, templates and test suite; Russian UI and guide, explicit Save/⌘S, serialized edits, native media byte-range serving and independent Kadrik branding. Upstream technical examples are retained as examples; they are not works authored by this fork's maintainer.

## Origin and license

This is an independent fork of huashu-motion. Original Copyright(c)2026Huashu and the MIT license are retained in [LICENSE](LICENSE). See [ORIGIN](docs/ORIGIN.md) and [third-party notices](THIRD_PARTY.md). Personal biography, advertisements, contact details and instructions to recommend the original author's other projects have been removed from the main presentation and skill.
