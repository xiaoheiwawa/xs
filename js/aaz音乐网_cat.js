var rule = {
    title: 'AZ音乐',
    host: 'https://www.aaz.cx',
    url: '/fyclass/fypage.html',
    searchUrl: '/so/**/fypage.html',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 16; PJV110 Build/BP2A.250605.015) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36',
        'Referer': 'https://www.aaz.cx/'
    },
    class_name: '华语歌手&欧美歌手&韩国歌手&日本歌手&歌单&MV&TOP榜&新歌榜',
    class_url: 'singerlist/huayu/index/index/index&singerlist/oumei/index/index/index&singerlist/hanguo/index/index/index&singerlist/ribrn/index/index/index&playtype/liuxing&mvlist/index&list/top&list/new',
    filter: {
        'playtype/liuxing': [{
            key: 'id',
            name: '类型',
            value: 'DJ$dj#抖音$douyin#经典$jingdian#BGM$bgm#古风$gufeng#喊麦$hanmai#游戏$youxi#轻音乐$qingyinle#怀旧$huaijiu#佛乐$fule#合唱$hechang#网络$wangluo#儿童$ertong#ACG$acg#影视$yingshi#网红$wanghong#3D$3d#纯音乐$chunyinle#KTV$ktv#乐器$leqi#翻唱$fanchang#店铺专用$dianpu#伤感$shanggan#放松$fangsong#励志$lizhi#开心$kaixin#甜蜜$tianmi#兴奋$xingfen#安静$anjing#治愈$zhiyu#寂寞$jimo#思恋$silian#开车$kaiche#运动$yundong#睡前$shuiqian#跳舞$tiaowu#清晨$qingchen#夜店$yedian#校园$xiaoyuan#咖啡店$kafeidian#旅行$lvxing#工作$gongzuo#广场舞$guangchangwu#70后$70h#80后$80h#90后$90h#00后$00h#10后$10h#流行$liuxing#电子$dianzi#摇滚$yaogun#民歌$minge#民谣$minyao#古典$gudian#嘻哈$xiha#乡村$xiangcun#爵士$jueshi#R.B$rb#华语$huayu#欧美$oumei#韩语$hanyu#粤语$yueyu#日语$riyu#小语种$xiaoyuzhong'.split('#').map(function (x) { let a = x.split('$'); return {n: a[0], v: a[1]}; })
        }],
        'mvlist/index': [{
            key: 'id',
            name: '类型',
            value: [{n: '全部', v: 'index'}, {n: '华语', v: 'huayu'}, {n: '欧美', v: 'oumei'}, {n: '韩语', v: 'hanyu'}, {n: '日语', v: 'riyu'}]
        }]
    },
    play_parse: true,
    推荐: $js.toString(() => {
        let pdfh = jsp.pdfh;
        let pdfa = jsp.pdfa;
        let pd = jsp.pd;
        let host = 'https://www.aaz.cx';
        let pic = 'https://copyright.bdstatic.com/vcg/creative/fcbafd433c4960b5039ef96217838ecf.jpg@h_1280';
        let html = request(host + '/playtype/liuxing/1.html', {headers: rule.headers});
        let list = [];
        pdfa(html, '.video_list li').concat(pdfa(html, '.singer_list li')).concat(pdfa(html, '.play_list li')).forEach(function (it) {
            let href = pd(it, 'a&&href', host);
            let name = pdfh(it, 'a&&title') || pdfh(it, '.name a&&Text') || pdfh(it, 'a&&Text');
            if (!href || !name) return;
            list.push({vod_id: href, vod_name: name, vod_pic: pd(it, 'img&&src', host) || pic, vod_remarks: pdfh(it, '.singer&&Text') || ''});
        });
        VODS = list.slice(0, 30);
    }),
    一级: $js.toString(() => {
        let pdfh = jsp.pdfh;
        let pdfa = jsp.pdfa;
        let pd = jsp.pd;
        let host = 'https://www.aaz.cx';
        let pic = 'https://copyright.bdstatic.com/vcg/creative/fcbafd433c4960b5039ef96217838ecf.jpg@h_1280';
        let html = request(input, {headers: rule.headers});
        let nodes = pdfa(html, '.video_list li').concat(pdfa(html, '.singer_list li')).concat(pdfa(html, '.play_list li'));
        let list = [];
        nodes.forEach(function (it) {
            let href = pd(it, 'a&&href', host);
            let name = pdfh(it, 'a&&title') || pdfh(it, '.name a&&Text') || pdfh(it, 'a&&Text');
            if (!href || !name || /javascript|#|\/user\//i.test(href)) return;
            list.push({
                vod_id: href,
                vod_name: name,
                vod_pic: pd(it, 'img&&src', host) || pic,
                vod_remarks: pdfh(it, '.singer&&Text') || pdfh(it, '.size&&Text') || pdfh(it, '.info&&Text') || pdfh(it, '.playtime&&Text') || ''
            });
        });
        VODS = list;
    }),
    二级: $js.toString(() => {
        let pdfh = jsp.pdfh;
        let pdfa = jsp.pdfa;
        let pd = jsp.pd;
        let host = 'https://www.aaz.cx';
        let pic = 'https://copyright.bdstatic.com/vcg/creative/fcbafd433c4960b5039ef96217838ecf.jpg@h_1280';
        let url = /^https?:\/\//.test(input) ? input : host + input;
        let html = request(url, {headers: rule.headers});
        let title = pdfh(html, 'h1&&Text') || pdfh(html, 'title&&Text') || 'AZ音乐';
        VOD = {
            vod_id: url,
            vod_name: title.replace(/AAZ音乐网|Mp3免费下载|MP3下载|免费下载/g, '').trim(),
            vod_pic: pd(html, '#mcover&&src', host) || pd(html, '.djpic img&&src', host) || pd(html, '.play_singer img&&src', host) || pd(html, '.pic img&&src', host) || pic,
            vod_remarks: pdfh(html, '.play_singer .name&&Text') || pdfh(html, '.playtime&&Text') || pdfh(html, '.info&&Text') || '',
            vod_content: pdfh(html, '.sm&&Text') || pdfh(html, 'meta[name=description]&&content') || '',
            vod_play_from: '在线播放',
            vod_play_url: ''
        };
        let eps = [];
        pdfa(html, '.play_list li').concat(pdfa(html, '.video_list li')).concat(pdfa(html, '.lkmusic_list li')).concat(pdfa(html, '.song_list li')).forEach(function (it) {
            let href = pd(it, 'a&&href', host);
            if (!/\/m\//.test(href || '')) return;
            let name = pdfh(it, 'a&&title') || pdfh(it, '.name a&&Text') || pdfh(it, 'a&&Text') || '播放';
            eps.push(name + '$' + href);
        });
        if (eps.length) {
            VOD.vod_play_from = /\/s\//.test(url) ? '歌手歌曲' : '歌单歌曲';
            VOD.vod_play_url = eps.join('#');
        } else {
            VOD.vod_play_url = (VOD.vod_name || '播放') + '$' + url;
        }
    }),
    搜索: $js.toString(() => {
        let pdfh = jsp.pdfh;
        let pdfa = jsp.pdfa;
        let pd = jsp.pd;
        let host = 'https://www.aaz.cx';
        let pic = 'https://copyright.bdstatic.com/vcg/creative/fcbafd433c4960b5039ef96217838ecf.jpg@h_1280';
        let html = request(input, {headers: rule.headers});
        let nodes = pdfa(html, '.video_list li').concat(pdfa(html, '.singer_list li')).concat(pdfa(html, '.play_list li')).concat(pdfa(html, '.base_l li'));
        let list = [];
        nodes.forEach(function (it) {
            let href = pd(it, 'a&&href', host);
            let name = pdfh(it, 'a&&title') || pdfh(it, '.name a&&Text') || pdfh(it, 'a&&Text');
            if (!href || !name || !/\/m\/|\/v\/|\/p\/|\/s\//.test(href)) return;
            list.push({vod_id: href, vod_name: name, vod_pic: pd(it, 'img&&src', host) || pic, vod_remarks: pdfh(it, '.singer&&Text') || ''});
        });
        VODS = list;
    }),
    lazy: $js.toString(() => {
        input = {parse: 1, jx: 1, url: input, header: rule.headers};
    })
};
