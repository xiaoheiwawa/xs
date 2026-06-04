# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

This repository is a TVBox/影视TV-style source configuration bundle. The root `api.json` is the main entry point and references the bundled `spider.jar`, site definitions, live sources, parsers, sniffing rules, DoH servers, flags, and ad filters.

## Common commands

There is no package manager metadata or build system in this repo. Most work is editing configuration/rule assets and validating syntax.

```bash
# Validate strict JSON files only: api.json and json/*.json
python -m json.tool api.json >/dev/null
python - <<'PY'
import json, pathlib
for p in pathlib.Path('json').glob('*.json'):
    json.loads(p.read_text(encoding='utf-8-sig'))
    print(p)
PY

# Validate all strict JSON candidates and report failures
python - <<'PY'
import json, pathlib
for p in [pathlib.Path('api.json'), *pathlib.Path('json').glob('*.json')]:
    try:
        json.loads(p.read_text(encoding='utf-8-sig'))
        print('OK', p.as_posix())
    except Exception as e:
        print('FAIL', p.as_posix(), type(e).__name__, e)
PY
```

Do not run standard JSON validation across `XBPQ/` or `XYQHiker/` as a blanket check: several files in those directories intentionally contain comment-style rule templates or non-strict JSON syntax accepted by their target rule engines.

## High-level structure

- `api.json` — main TVBox configuration. Important top-level sections include:
  - `spider`: points to `./spider.jar`.
  - `sites`: primary source list; each source has fields such as `key`, `name`, `type`, `api`, `searchable`, `quickSearch`, `filterable`, and optional `ext`.
  - `lives`: IPTV/live playlist entries, often with `playerType`, `timeout`, `ua`, EPG, and logo settings.
  - `parses`: external parse endpoints and parse headers.
  - `rules`: sniffing or click automation rules keyed by host/regex/script.
  - `doh`, `flags`, `ads`: DNS-over-HTTPS servers, parser flags, and ad filters.
- `js/` — JavaScript rule files for DRPY-style engines. Most files define `var rule = { ... }` with fields like `title`, `host`, `url`, `class_name`, `class_url`, `一级`, `二级`, `搜索`, `lazy`, and `headers`. `drpy2.min.js` and `drpy-core-lite.min.js` are bundled/minified dependencies; avoid editing them unless explicitly requested.
- `py/` — Python spider implementations loaded by compatible TVBox engines. Each file subclasses `base.spider.Spider` and implements methods such as `homeContent`, `categoryContent`, `detailContent`, `searchContent`, and `playerContent`. These scripts rely on the runtime-provided `base.spider` module, so they are not directly runnable as standalone Python programs in this repo.
- `json/` — strict JSON extension/config files, including Alist and Bilibili education/media collection configs.
- `XBPQ/` — XBPQ rule files. Some are strict JSON and some are rule-format files with comments or relaxed syntax.
- `XYQHiker/` — XYQHiker rule files. These often include comments and template guidance inside the file; preserve the target engine’s accepted syntax rather than forcing strict JSON.
- `spider.jar` — bundled Java spider library referenced by `api.json`.

## Editing guidance for this repo

- Preserve Chinese filenames and display names; they are meaningful to the rule engines and users.
- When adding a site to `api.json`, keep `key` unique and make sure any local `ext` path or JS/Python rule reference matches an existing file.
- Validate strict JSON after changes to `api.json` or files under `json/`.
- For `js/` rules, preserve the engine-specific globals and conventions (`rule`, `HOST`, `input`, `VODS`, `VOD`, `setResult`, `$js.toString`, `request`, `jsp`, `PC_UA`, `MOBILE_UA`).
- For Python spiders, preserve the expected TVBox method signatures; imports from `base.spider` are provided by the host runtime, not this repository.
