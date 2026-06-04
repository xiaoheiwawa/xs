const axios = require('axios');
const http = require('http');
const https = require('https');
const cheerio = require('cheerio');
const CryptoJS = require('crypto-js');

const HOST = 'https://www.aaz.cx';
const UA = 'Mozilla/5.0 (Linux; Android 16; PJV110 Build/BP2A.250605.015) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36';
const PIC = 'https://copyright.bdstatic.com/vcg/creative/fcbafd433c4960b5039ef96217838ecf.jpg@h_1280';
const PUBLIC_PROXY_BASE = process.env.AAZMUSIC_PUBLIC_PROXY_BASE || 'http://192.168.50.210:25002';

const client = axios.create({
  timeout: 15000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false }),
  headers: { 'User-Agent': UA, Referer: HOST + '/' },
  validateStatus: () => true,
  maxRedirects: 5,
});

const meta = {
  key: 'aazmusic',
  name: 'AAZ音乐网',
  type: 4,
  api: '/video/aazmusic',
  searchable: 1,
  quickSearch: 0,
  changeable: 0,
};

const CLASSES = [
  { type_name: '华语歌手', type_id: 'singer:huayu' },
  { type_name: '欧美歌手', type_id: 'singer:oumei' },
  { type_name: '韩国歌手', type_id: 'singer:hanguo' },
  { type_name: '日本歌手', type_id: 'singer:ribrn' },
  { type_name: '歌单', type_id: 'playlist:liuxing' },
  { type_name: 'MV', type_id: 'mv:index' },
  { type_name: 'TOP榜', type_id: 'list:top' },
  { type_name: '新歌榜', type_id: 'list:new' },
];

const PLAYLIST_FILTERS = 'DJ$dj#抖音$douyin#经典$jingdian#BGM$bgm#古风$gufeng#喊麦$hanmai#游戏$youxi#轻音乐$qingyinle#怀旧$huaijiu#佛乐$fule#合唱$hechang#网络$wangluo#儿童$ertong#ACG$acg#影视$yingshi#网红$wanghong#3D$3d#纯音乐$chunyinle#KTV$ktv#乐器$leqi#翻唱$fanchang#店铺专用$dianpu#伤感$shanggan#放松$fangsong#励志$lizhi#开心$kaixin#甜蜜$tianmi#兴奋$xingfen#安静$anjing#治愈$zhiyu#寂寞$jimo#思恋$silian#开车$kaiche#运动$yundong#睡前$shuiqian#跳舞$tiaowu#清晨$qingchen#夜店$yedian#校园$xiaoyuan#咖啡店$kafeidian#旅行$lvxing#工作$gongzuo#广场舞$guangchangwu#70后$70h#80后$80h#90后$90h#00后$00h#10后$10h#流行$liuxing#电子$dianzi#摇滚$yaogun#民歌$minge#民谣$minyao#古典$gudian#嘻哈$xiha#乡村$xiangcun#爵士$jueshi#R.B$rb#华语$huayu#欧美$oumei#韩语$hanyu#粤语$yueyu#日语$riyu#小语种$xiaoyuzhong';

function toAbs(u = '') {
  if (!u) return '';
  u = String(u).replace(/&amp;/g, '&').trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('//')) return 'https:' + u;
  return new URL(u, HOST).href;
}
function e64(s) { return Buffer.from(String(s), 'utf8').toString('base64'); }
function d64(s) { return Buffer.from(String(s), 'base64').toString('utf8'); }
function buildProxyUrl(req, targetUrl) {
  if (!targetUrl) return '';
  const token = req && req.query && req.query.token ? `&token=${encodeURIComponent(req.query.token)}` : '';
  return `${PUBLIC_PROXY_BASE}${meta.api}/proxy/aaz.m4a?do=media&u=${encodeURIComponent(e64(targetUrl))}${token}`;
}
function clean(s = '') { return String(s).replace(/\s+/g, ' ').replace(/AAZ音乐网|Mp3免费下载|MP3下载|网盘下载|LRC歌词下载|免费下载/gi, '').trim(); }
function isMedia(u = '') { return /\.(m3u8|mp4|mp3|m4a|flac)(\?|$)/i.test(u); }

async function fetchHtml(url, opts = {}) {
  const res = await client.get(toAbs(url), opts);
  return typeof res.data === 'string' ? res.data : JSON.stringify(res.data || '');
}
async function fetchDoc(url) {
  try { return cheerio.load(await fetchHtml(url)); } catch { return cheerio.load('<html></html>'); }
}
async function postPlayInfo(id, type, referer) {
  try {
    const data = new URLSearchParams({ id, type }).toString();
    const res = await client.post(HOST + '/js/play.php', data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: referer || HOST + '/', 'X-Requested-With': 'XMLHttpRequest' },
      // 播放接口经代理偶尔返回 502；强制直连更稳。
      proxy: false,
    });
    const obj = typeof res.data === 'object' ? res.data : JSON.parse(String(res.data || '{}'));
    return {
      url: obj && obj.url ? String(obj.url).replace(/\\\//g, '/') : '',
      lrc: obj && obj.lrc ? String(obj.lrc).replace(/\\\//g, '/') : '',
    };
  } catch { return { url: '', lrc: '' }; }
}
async function postPlay(id, type, referer) {
  return (await postPlayInfo(id, type, referer)).url;
}

async function postMv(id, referer) {
  // AAZ MV 的 /plug/down.php 需要先访问详情页拿 server_name_session；直接请求会返回空。
  const detailUrl = referer || `${HOST}/v/${id}.html`;
  try { await client.get(detailUrl, { headers: { Referer: HOST + '/' } }); } catch {}
  for (const q of [1080, 720, 480, 420]) {
    try {
      const res = await client.get(`${HOST}/plug/down.php`, {
        params: { ac: 'vplay', id, q },
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400,
        headers: { Referer: detailUrl, 'X-Requested-With': 'XMLHttpRequest' },
      });
      const loc = res.headers && (res.headers.location || res.headers.Location);
      if (loc && /^https?:\/\//i.test(loc)) return String(loc).replace(/\\\//g, '/');
      if (typeof res.data === 'string' && /^https?:\/\//i.test(res.data.trim())) return res.data.trim();
    } catch {}
  }
  return '';
}

function categoryUrl(tid, page = 1, ext = {}) {
  page = Number(page) || 1;
  const [kind, val] = String(tid).split(':');
  if (kind === 'singer') return `${HOST}/singerlist/${val}/index/index/index/${page}.html`;
  if (kind === 'playlist') return `${HOST}/playtype/${ext.id || val}/${page}.html`;
  if (kind === 'mv') return `${HOST}/mvlist/${ext.id || val}/${page}.html`;
  if (kind === 'list') return page > 1 ? `${HOST}/list/${val}/${page}.html` : `${HOST}/list/${val}.html`;
  if (/^https?:/.test(tid)) return tid;
  return `${HOST}/${tid}/${page}.html`;
}

function parseList($, selector, tid = '') {
  const list = [];
  $(selector).each((_, el) => {
    const li = $(el);
    const a = li.find('a[href]').first();
    let href = a.attr('href') || '';
    if (!href || /javascript|#|\/user\//i.test(href)) return;
    const abs = toAbs(href);
    if (!/aaz\.cx\/(m|v|p|s|list|playtype|mvlist|singerlist)\//i.test(abs)) return;
    const img = toAbs(li.find('img').first().attr('src') || '');
    let name = clean(a.attr('title') || li.find('.name').text() || li.find('h3').text() || a.text());
    if (!name) name = clean(li.text());
    if (!name) return;
    let remarks = clean(li.find('.singer').text() || li.find('.size,.info,.playtime').first().text() || '');
    let type = /singer/.test(tid) || /\/s\//.test(abs) ? 'oval' : (/list:|playlist:/.test(tid) ? 'list' : 'rect');
    list.push({
      vod_id: abs,
      vod_name: name,
      vod_pic: img || PIC,
      vod_remarks: remarks,
      style: { type, ratio: type === 'oval' ? 1 : 1.33 },
    });
  });
  const seen = new Set();
  return list.filter(v => v.vod_id && !seen.has(v.vod_id) && seen.add(v.vod_id));
}

function musicIdFromUrl(url = '') {
  const m = String(url).match(/\/m\/([^/]+)\.html/i);
  return m ? m[1] : '';
}
function lrcUrlById(id = '') {
  return id ? `${HOST}/plug/down.php?ac=music&lk=lrc&id=${encodeURIComponent(id)}` : '';
}
function cleanLrc(lrc = '') {
  return String(lrc || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !(/^(?:\[\d{2}:\d{2}(?:\.\d+)?\])/.test(line) && /(欢迎来访|本站|广告|QQ群|www\.|http|\.com|\.cn|\.net|音乐网|提供|下载)/i.test(line)))
    .join('\n');
}
async function fetchLrc(lrcUrl, referer) {
  if (!lrcUrl) return '';
  try {
    // LRC 下载接口经代理偶尔返回 502；这里强制直连，和站点页面/播放接口分开处理。
    const res = await client.get(toAbs(lrcUrl), {
      headers: { 'User-Agent': UA, Referer: referer || HOST + '/' },
      responseType: 'text',
      transformResponse: [data => data],
      proxy: false,
    });
    if (res.status >= 200 && res.status < 300 && typeof res.data === 'string') {
      return cleanLrc(res.data);
    }
  } catch {}
  return '';
}
async function resolveFinalMediaUrl(url) {
  if (!url || !isMedia(url)) return url || '';
  try {
    const res = await client.head(url, {
      headers: { 'User-Agent': UA, Referer: HOST + '/' },
      maxRedirects: 5,
      proxy: false,
    });
    const finalUrl = res.request && res.request.res && res.request.res.responseUrl;
    if (finalUrl && /^https?:\/\//i.test(finalUrl)) return finalUrl;
  } catch {}
  return url;
}
function makeEpisode(name, url) {
  const abs = toAbs(url);
  const mid = musicIdFromUrl(abs);
  const payload = mid ? { url: abs, id: mid, type: 'music', lrcUrl: lrcUrlById(mid) } : abs;
  return `${clean(name) || '播放'}$${e64(typeof payload === 'string' ? payload : JSON.stringify(payload))}`;
}
function extractPlayer(html) {
  const m = String(html).match(/player\(["']([^"']+)["']\s*,\s*["']([^"']+)["']\)/i);
  return m ? { type: m[1], id: m[2] } : null;
}

async function _home({ filter }) {
  const filters = {
    'playlist:liuxing': [{ key: 'id', name: '类型', value: PLAYLIST_FILTERS.split('#').map(x => { const [n, v] = x.split('$'); return { n, v }; }) }],
    'mv:index': [{ key: 'id', name: '类型', value: [{ n: '全部', v: 'index' }, { n: '华语', v: 'huayu' }, { n: '欧美', v: 'oumei' }, { n: '韩语', v: 'hanyu' }, { n: '日语', v: 'riyu' }] }],
  };
  return { class: CLASSES, filters, list: [] };
}

async function _category({ id, page, filters }) {
  const url = categoryUrl(id, page, filters || {});
  const $ = await fetchDoc(url);
  let selector = '.play_list li, .singer_list li, .video_list li, .ilingku_list li, .lkmusic_list li';
  const list = parseList($, selector, id);
  return { list, page: Number(page) || 1, pagecount: 9999, limit: 90, total: 999999 };
}

async function collectEpisodes($) {
  const eps = [];
  $('.play_list li, .video_list li, .lkmusic_list li, .song_list li').each((_, el) => {
    const li = $(el);
    const a = li.find('a[href*="/m/"]').first();
    if (a.length) eps.push(makeEpisode(a.attr('title') || a.text(), a.attr('href')));
  });
  const seen = new Set();
  return eps.filter(x => !seen.has(x.split('$').pop()) && seen.add(x.split('$').pop()));
}

async function _detail({ id }) {
  const result = { list: [] };
  for (const rawId of id) {
    const url = toAbs(rawId);
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const title = clean($('h1').first().text() || $('title').text());
    const vod = {
      vod_id: url,
      vod_name: title || 'AAZ音乐',
      vod_pic: toAbs($('#mcover, .djpic img, .play_singer img, .pic img').first().attr('src') || '') || PIC,
      vod_remarks: clean($('.play_singer .name').text() || $('.playtime,.info').first().text() || ''),
      vod_content: clean($('.sm').text() || $('meta[name="description"]').attr('content') || ''),
      vod_play_from: '在线播放',
      vod_play_url: '',
    };

    if (/\/s\/|\/p\//.test(url)) {
      const eps = await collectEpisodes($);
      if (eps.length) {
        vod.vod_play_from = /\/s\//.test(url) ? '歌手歌曲' : '歌单歌曲';
        vod.vod_play_url = eps.join('#');
        result.list.push(vod);
        continue;
      }
    }

    const p = extractPlayer(html) || (url.match(/\/(m|v)\/([^/]+)\.html/i) ? { type: url.includes('/v/') ? 'video' : 'music', id: url.match(/\/(?:m|v)\/([^/]+)\.html/i)[1] } : null);
    if (p) {
      const payload = { url, id: p.id, type: p.type };
      if (p.type !== 'video') payload.lrcUrl = lrcUrlById(p.id);
      vod.vod_play_url = `${vod.vod_name || '播放'}$${e64(JSON.stringify(payload))}`;
    } else {
      vod.vod_play_url = `解析失败$${e64(JSON.stringify({ url }))}`;
    }
    result.list.push(vod);
  }
  return result;
}

async function _search({ page, wd }) {
  page = Number(page) || 1;
  const urls = [`${HOST}/so/${encodeURIComponent(wd)}/${page}.html`, `${HOST}/so.php?wd=${encodeURIComponent(wd)}`, `${HOST}/search/${page}/?q=${encodeURIComponent(wd)}`];
  for (const url of urls) {
    const $ = await fetchDoc(url);
    const list = parseList($, '.play_list li, .video_list li, .lkmusic_list li, .base_l li, li', 'search').filter(v => /\/m\/|\/v\/|\/p\/|\/s\//.test(v.vod_id));
    if (list.length) return { list, page, pagecount: 9999, total: 999999 };
  }
  return { list: [], page, pagecount: 1, total: 0 };
}

async function _play({ id }) {
  let url = '';
  let referer = HOST + '/';
  let lrcUrl = '';
  try {
    const raw = d64(id);
    if (/^\{/.test(raw)) {
      const obj = JSON.parse(raw);
      referer = obj.url || referer;
      lrcUrl = obj.lrcUrl || '';
      if (obj.type === 'video') {
        url = await postMv(obj.id, obj.url);
      } else {
        const info = await postPlayInfo(obj.id, obj.type || 'music', obj.url);
        url = info.url;
        if (!lrcUrl && info.lrc) lrcUrl = info.lrc;
      }
      if (!lrcUrl && obj.type !== 'video' && obj.id) lrcUrl = lrcUrlById(obj.id);
    } else {
      url = raw;
      referer = /^https?:\/\//i.test(raw) ? raw : referer;
      lrcUrl = lrcUrlById(musicIdFromUrl(raw));
    }
  } catch { url = id; }
  if (/\.html/i.test(url) && !isMedia(url)) {
    referer = url;
    const html = await fetchHtml(url);
    const p = extractPlayer(html);
    if (p) {
      if (p.type === 'video') {
        url = (await postMv(p.id, url)) || url;
      } else {
        const info = await postPlayInfo(p.id, p.type || 'music', url);
        url = info.url || url;
        if (!lrcUrl && info.lrc) lrcUrl = info.lrc;
      }
      if (!lrcUrl && p.type !== 'video') lrcUrl = lrcUrlById(p.id);
    }
  }
  const result = { parse: isMedia(url) ? 0 : 1, jx: isMedia(url) ? 0 : 1, url, header: { 'User-Agent': UA, Referer: HOST + '/' } };
  const lrc = await fetchLrc(lrcUrl, referer);
  if (lrc) result.lrc = lrc;
  return result;
}

async function _proxy(req, reply) {
  const q = req.query || {};
  if (q.do !== 'media' || !q.u) return Object.assign({}, req.query, req.params);
  let target = '';
  try { target = d64(q.u); } catch { target = ''; }
  if (!/^https?:\/\//i.test(target) || !/(^|\.)(5bb3\.com|kuwo\.cn)$/i.test(new URL(target).hostname)) {
    reply.code(403);
    return 'forbidden';
  }
  try {
    const headers = { 'User-Agent': UA, Referer: HOST + '/', Accept: '*/*' };
    if (req.headers && req.headers.range) headers.Range = req.headers.range;
    const res = await client.get(target, {
      responseType: 'stream',
      maxRedirects: 5,
      proxy: false,
      validateStatus: status => status >= 200 && status < 400,
      headers,
    });
    reply.code(res.status === 206 ? 206 : 200);
    reply.header('Content-Type', res.headers['content-type'] || 'audio/mp4');
    if (res.headers['content-length']) reply.header('Content-Length', res.headers['content-length']);
    if (res.headers['content-range']) reply.header('Content-Range', res.headers['content-range']);
    reply.header('Accept-Ranges', res.headers['accept-ranges'] || 'bytes');
    return reply.send(res.data);
  } catch (e) {
    reply.code(502);
    return 'media proxy failed';
  }
}

module.exports = async (app, opt) => {
  app.get(meta.api, async (req, reply) => {
    const { extend, filter, t, ac, pg, ext, ids, flag, play, wd, quick } = req.query;
    if (play) return await _play({ flag: flag || '', id: play, req });
    if (wd) return await _search({ page: parseInt(pg || '1'), wd, quick });
    if (!ac) return await _home({ filter: filter ?? false });
    if (ac === 'detail') {
      if (t) {
        const body = { id: t, page: parseInt(pg || '1'), filters: {} };
        if (ext) {
          try { body.filters = JSON.parse(CryptoJS.enc.Base64.parse(ext).toString(CryptoJS.enc.Utf8)); } catch {}
        }
        return await _category(body);
      }
      if (ids) return await _detail({ id: ids.split(',').map(x => x.trim()).filter(Boolean) });
    }
    return req.query;
  });
  app.get(`${meta.api}/proxy`, _proxy);
  app.get(`${meta.api}/proxy/:name`, _proxy);
  opt.sites.push(meta);
};
