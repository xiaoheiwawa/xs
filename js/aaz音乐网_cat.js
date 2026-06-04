const AAZ_HOST = 'https://www.aaz.cx';
const AAZ_UA = 'Mozilla/5.0 (Linux; Android 16; PJV110 Build/BP2A.250605.015) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36';
const AAZ_PIC = 'https://copyright.bdstatic.com/vcg/creative/fcbafd433c4960b5039ef96217838ecf.jpg@h_1280';

function aazAbs(u) {
    if (!u) return '';
    u = String(u).replace(/&amp;/g, '&').trim();
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('//')) return 'https:' + u;
    if (u.startsWith('/')) return AAZ_HOST + u;
    return AAZ_HOST + '/' + u.replace(/^\.\//, '');
}

function aazClean(s) {
    return String(s || '').replace(/<\/?[^>]+>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/AAZ音乐网|Mp3免费下载|MP3下载|网盘下载|LRC歌词下载|免费下载/gi, '').replace(/\s+/g, ' ').trim();
}

function aazEnc(o) {
    return encodeURIComponent(typeof o === 'string' ? o : JSON.stringify(o));
}

function aazDec(s) {
    try {
        return decodeURIComponent(s);
    } catch (e) {
        return s;
    }
}

function aazMusicId(url) {
    let m = String(url || '').match(/\/m\/([^/]+)\.html/i);
    return m ? m[1] : '';
}

function aazVideoId(url) {
    let m = String(url || '').match(/\/v\/([^/]+)\.html/i);
    return m ? m[1] : '';
}

function aazLrcUrl(id) {
    return id ? AAZ_HOST + '/plug/down.php?ac=music&lk=lrc&id=' + encodeURIComponent(id) : '';
}

function aazPlayUrl(id) {
    return id ? AAZ_HOST + '/plug/down.php?ac=music&lk=play&id=' + encodeURIComponent(id) : '';
}

function aazIsMedia(u) {
    return /\.(m3u8|mp4|mp3|m4a|flac|aac|ogg)(\?|$)/i.test(u || '') || /\/plug\/down\.php\?(?=[^#]*\bac=music\b)(?=[^#]*\blk=(?:play|url|mp3)\b)/i.test(u || '');
}

function aazCategoryUrl(tid, page, ext) {
    page = Number(page) || 1;
    ext = ext || {};
    let arr = String(tid || '').split(':');
    let kind = arr[0];
    let val = arr[1] || 'index';
    if (kind === 'singer') return AAZ_HOST + '/singerlist/' + val + '/index/index/index/' + page + '.html';
    if (kind === 'playlist') return AAZ_HOST + '/playtype/' + (ext.id || val) + '/' + page + '.html';
    if (kind === 'mv') return AAZ_HOST + '/mvlist/' + (ext.id || val) + '/' + page + '.html';
    if (kind === 'list') return page > 1 ? AAZ_HOST + '/list/' + val + '/' + page + '.html' : AAZ_HOST + '/list/' + val + '.html';
    return AAZ_HOST + '/' + tid + '/' + page + '.html';
}

function aazParseList(html, selector, tid) {
    let pdfh = jsp.pdfh;
    let pdfa = jsp.pdfa;
    let pd = jsp.pd;
    let list = [];
    let nodes = pdfa(html, selector);
    nodes.forEach(function (it) {
        let href = pd(it, 'a&&href', AAZ_HOST);
        if (!href || /javascript|#|\/user\//i.test(href)) return;
        href = aazAbs(href);
        if (!/aaz\.cx\/(m|v|p|s|list|playtype|mvlist|singerlist)\//i.test(href)) return;
        let name = aazClean(pdfh(it, 'a&&title') || pdfh(it, '.name&&Text') || pdfh(it, 'h3&&Text') || pdfh(it, 'a&&Text'));
        if (!name) return;
        let img = aazAbs(pd(it, 'img&&src', AAZ_HOST));
        let remark = aazClean(pdfh(it, '.singer&&Text') || pdfh(it, '.size&&Text') || pdfh(it, '.info&&Text') || pdfh(it, '.playtime&&Text'));
        let styleType = /singer/.test(tid || '') || /\/s\//.test(href) ? 'oval' : (/list:|playlist:/.test(tid || '') ? 'list' : 'rect');
        list.push({
            vod_id: href,
            vod_name: name,
            vod_pic: img || AAZ_PIC,
            vod_remarks: remark,
            style: {type: styleType, ratio: styleType === 'oval' ? 1 : 1.33}
        });
    });
    let seen = {};
    return list.filter(function (v) {
        if (!v.vod_id || seen[v.vod_id]) return false;
        seen[v.vod_id] = true;
        return true;
    });
}

function aazPlayer(html) {
    let m = String(html || '').match(/player\(["']([^"']+)["']\s*,\s*["']([^"']+)["']\)/i);
    return m ? {type: m[1], id: m[2]} : null;
}

function aazEpisode(name, url) {
    let abs = aazAbs(url);
    let mid = aazMusicId(abs);
    let payload = mid ? {url: abs, id: mid, type: 'music', lrcUrl: aazLrcUrl(mid)} : {url: abs};
    return (aazClean(name) || '播放') + '$' + aazEnc(payload);
}

function aazPostPlayInfo(id, type, referer) {
    try {
        let html = request(AAZ_HOST + '/js/play.php', {
            method: 'POST',
            headers: {
                'User-Agent': AAZ_UA,
                'Referer': referer || AAZ_HOST + '/',
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: 'id=' + encodeURIComponent(id) + '&type=' + encodeURIComponent(type || 'music')
        });
        let obj = JSON.parse(html || '{}');
        return {
            url: obj.url ? String(obj.url).replace(/\\\//g, '/') : '',
            lrc: obj.lrc ? String(obj.lrc).replace(/\\\//g, '/') : ''
        };
    } catch (e) {
        return {url: '', lrc: ''};
    }
}

function aazPostMv(id, referer) {
    let detailUrl = referer || AAZ_HOST + '/v/' + id + '.html';
    try { request(detailUrl, {headers: {'User-Agent': AAZ_UA, 'Referer': AAZ_HOST + '/'}}); } catch (e) {}
    for (let q of [1080, 720, 480, 420]) {
        try {
            let html = request(AAZ_HOST + '/plug/down.php?ac=vplay&id=' + encodeURIComponent(id) + '&q=' + q, {
                headers: {'User-Agent': AAZ_UA, 'Referer': detailUrl, 'X-Requested-With': 'XMLHttpRequest'}
            });
            let text = String(html || '').trim();
            if (/^https?:\/\//i.test(text)) return text.replace(/\\\//g, '/');
            let m = text.match(/https?:\/\/[^"'<>\s]+/i);
            if (m) return m[0].replace(/\\\//g, '/');
        } catch (e) {}
    }
    return '';
}

function aazFetchLrc(lrcUrl, referer) {
    if (!lrcUrl) return '';
    try {
        let lrc = request(lrcUrl, {headers: {'User-Agent': AAZ_UA, 'Referer': referer || AAZ_HOST + '/', 'Accept': 'text/plain,*/*'}, timeout: 10000});
        return String(lrc || '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(function (line) {
            return line && !(/^(?:\[\d{2}:\d{2}(?:\.\d+)?\])/.test(line) && /(欢迎来访|本站|广告|QQ群|www\.|http|\.com|\.cn|\.net|音乐网|提供|下载)/i.test(line));
        }).join('\n');
    } catch (e) {
        return '';
    }
}

var rule = {
    title: 'AAZ音乐网',
    host: AAZ_HOST,
    url: '',
    searchUrl: '/so/**/fypage.html',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    headers: {'User-Agent': AAZ_UA, 'Referer': AAZ_HOST + '/'},
    class_name: '华语歌手&欧美歌手&韩国歌手&日本歌手&歌单&MV&TOP榜&新歌榜',
    class_url: 'singer:huayu&singer:oumei&singer:hanguo&singer:ribrn&playlist:liuxing&mv:index&list:top&list:new',
    filter: {
        'playlist:liuxing': [{
            key: 'id',
            name: '类型',
            value: 'DJ$dj#抖音$douyin#经典$jingdian#BGM$bgm#古风$gufeng#喊麦$hanmai#游戏$youxi#轻音乐$qingyinle#怀旧$huaijiu#佛乐$fule#合唱$hechang#网络$wangluo#儿童$ertong#ACG$acg#影视$yingshi#网红$wanghong#3D$3d#纯音乐$chunyinle#KTV$ktv#乐器$leqi#翻唱$fanchang#店铺专用$dianpu#伤感$shanggan#放松$fangsong#励志$lizhi#开心$kaixin#甜蜜$tianmi#兴奋$xingfen#安静$anjing#治愈$zhiyu#寂寞$jimo#思恋$silian#开车$kaiche#运动$yundong#睡前$shuiqian#跳舞$tiaowu#清晨$qingchen#夜店$yedian#校园$xiaoyuan#咖啡店$kafeidian#旅行$lvxing#工作$gongzuo#广场舞$guangchangwu#70后$70h#80后$80h#90后$90h#00后$00h#10后$10h#流行$liuxing#电子$dianzi#摇滚$yaogun#民歌$minge#民谣$minyao#古典$gudian#嘻哈$xiha#乡村$xiangcun#爵士$jueshi#R.B$rb#华语$huayu#欧美$oumei#韩语$hanyu#粤语$yueyu#日语$riyu#小语种$xiaoyuzhong'.split('#').map(function (x) { let a = x.split('$'); return {n: a[0], v: a[1]}; })
        }],
        'mv:index': [{
            key: 'id',
            name: '类型',
            value: [{n: '全部', v: 'index'}, {n: '华语', v: 'huayu'}, {n: '欧美', v: 'oumei'}, {n: '韩语', v: 'hanyu'}, {n: '日语', v: 'riyu'}]
        }]
    },
    play_parse: true,
    推荐: $js.toString(() => {
        let html = request(AAZ_HOST + '/playtype/liuxing/1.html', {headers: rule.headers});
        VODS = aazParseList(html, '.play_list li, .singer_list li, .video_list li, .ilingku_list li, .lkmusic_list li', 'playlist:liuxing').slice(0, 30);
    }),
    一级: $js.toString(() => {
        let ext = typeof MY_FL !== 'undefined' ? MY_FL : {};
        let url = aazCategoryUrl(MY_CATE, MY_PAGE, ext);
        let html = request(url, {headers: rule.headers});
        VODS = aazParseList(html, '.play_list li, .singer_list li, .video_list li, .ilingku_list li, .lkmusic_list li', MY_CATE);
    }),
    二级: $js.toString(() => {
        let pdfh = jsp.pdfh;
        let pdfa = jsp.pdfa;
        let pd = jsp.pd;
        let url = aazAbs(input);
        let html = request(url, {headers: rule.headers});
        let title = aazClean(pdfh(html, 'h1&&Text') || pdfh(html, 'title&&Text')) || 'AAZ音乐';
        VOD = {
            vod_id: url,
            vod_name: title,
            vod_pic: aazAbs(pd(html, '#mcover&&src', AAZ_HOST) || pd(html, '.djpic img&&src', AAZ_HOST) || pd(html, '.play_singer img&&src', AAZ_HOST) || pd(html, '.pic img&&src', AAZ_HOST)) || AAZ_PIC,
            vod_remarks: aazClean(pdfh(html, '.play_singer .name&&Text') || pdfh(html, '.playtime&&Text') || pdfh(html, '.info&&Text')),
            vod_content: aazClean(pdfh(html, '.sm&&Text') || pdfh(html, 'meta[name=description]&&content')),
            vod_play_from: '在线播放',
            vod_play_url: ''
        };
        if (/\/s\/|\/p\//.test(url)) {
            let eps = [];
            pdfa(html, '.play_list li, .video_list li, .lkmusic_list li, .song_list li').forEach(function (it) {
                let href = pd(it, 'a&&href', AAZ_HOST);
                if (/\/m\//.test(href || '')) eps.push(aazEpisode(pdfh(it, 'a&&title') || pdfh(it, 'a&&Text'), href));
            });
            if (eps.length) {
                VOD.vod_play_from = /\/s\//.test(url) ? '歌手歌曲' : '歌单歌曲';
                VOD.vod_play_url = eps.join('#');
            }
        }
        if (!VOD.vod_play_url) {
            let p = aazPlayer(html);
            let mid = aazMusicId(url);
            let vid = aazVideoId(url);
            if (!p && mid) p = {type: 'music', id: mid};
            if (!p && vid) p = {type: 'video', id: vid};
            if (p) {
                let payload = {url: url, id: p.id, type: p.type};
                if (p.type !== 'video') payload.lrcUrl = aazLrcUrl(p.id);
                VOD.vod_play_url = (VOD.vod_name || '播放') + '$' + aazEnc(payload);
            } else {
                VOD.vod_play_url = '解析失败$' + aazEnc({url: url});
            }
        }
    }),
    搜索: $js.toString(() => {
        let urls = [AAZ_HOST + '/so/' + encodeURIComponent(KEY) + '/' + MY_PAGE + '.html', AAZ_HOST + '/so.php?wd=' + encodeURIComponent(KEY), AAZ_HOST + '/search/' + MY_PAGE + '/?q=' + encodeURIComponent(KEY)];
        VODS = [];
        for (let url of urls) {
            let html = request(url, {headers: rule.headers});
            let list = aazParseList(html, '.play_list li, .video_list li, .lkmusic_list li, .base_l li, li', 'search').filter(function (v) { return /\/m\/|\/v\/|\/p\/|\/s\//.test(v.vod_id); });
            if (list.length) {
                VODS = list;
                break;
            }
        }
    }),
    lazy: $js.toString(() => {
        let raw = aazDec(input);
        let obj = null;
        let url = raw;
        let referer = AAZ_HOST + '/';
        let lrcUrl = '';
        try {
            obj = JSON.parse(raw);
        } catch (e) {}
        if (obj) {
            referer = obj.url || referer;
            lrcUrl = obj.lrcUrl || '';
            if (obj.type === 'video') {
                url = aazPostMv(obj.id, obj.url) || obj.url;
            } else if (obj.id) {
                let info = aazPostPlayInfo(obj.id, obj.type || 'music', obj.url);
                url = aazPlayUrl(obj.id) || info.url || obj.url;
                if (!lrcUrl && info.lrc) lrcUrl = info.lrc;
                if (!lrcUrl) lrcUrl = aazLrcUrl(obj.id);
            } else {
                url = obj.url || raw;
            }
        }
        if (/\.html/i.test(url) && !aazIsMedia(url)) {
            referer = url;
            let html = request(url, {headers: rule.headers});
            let p = aazPlayer(html);
            if (p) {
                if (p.type === 'video') {
                    url = aazPostMv(p.id, referer) || url;
                } else {
                    let info = aazPostPlayInfo(p.id, p.type || 'music', referer);
                    url = aazPlayUrl(p.id) || info.url || url;
                    if (!lrcUrl && info.lrc) lrcUrl = info.lrc;
                    if (!lrcUrl) lrcUrl = aazLrcUrl(p.id);
                }
            }
        }
        input = {
            parse: aazIsMedia(url) ? 0 : 1,
            jx: aazIsMedia(url) ? 0 : 1,
            url: url || raw,
            header: {'User-Agent': AAZ_UA, 'Referer': referer || AAZ_HOST + '/'}
        };
        let lrc = aazFetchLrc(lrcUrl, referer);
        if (lrc) input.lrc = lrc;
    })
};
