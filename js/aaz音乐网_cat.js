var rule = {
    title: 'AZ音乐',
    host: 'https://www.aaz.cx',
    url: '/fyclass/fypage.html',
    searchUrl: '/so/**/fypage.html',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 16; PJV110 Build/BP2A.250605.015) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36',
        'Referer': 'https://www.aaz.cx/'
    },
    class_name: '华语歌手&欧美歌手&韩国歌手&日本歌手&歌单&MV&TOP榜&新歌榜',
    class_url: 'singerlist/huayu/index/index/index&singerlist/oumei/index/index/index&singerlist/hanguo/index/index/index&singerlist/ribrn/index/index/index&playtype/liuxing&mvlist/index&list/top&list/new',
    play_parse: true,
    推荐: 'li;.name a&&title;.pic img&&src;;.name a&&href',
    一级: 'li;.name a&&title;.pic img&&src;;.name a&&href',
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
    搜索: 'li;.name a&&title;.pic img&&src;;.name a&&href',
    lazy: $js.toString(() => {
        input = {parse: 1, jx: 1, url: input, header: rule.headers};
    })
};
