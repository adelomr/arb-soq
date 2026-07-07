const axios = require('axios');
async function test() {
    try {
        const response = await axios.get('https://www.youtube.com/playlist?list=PL8DDsWuvM_EXvdiwpTPRIJ7s7iGfczB2P', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;
        const videoIds = [...new Set([...html.matchAll(/"videoId":"([^"]+)"/g)].map(m => m[1]))];
        console.log('Found ' + videoIds.length + ' videos:', videoIds);
    } catch(e) { console.error('Error:', e.message); }
}
test();
