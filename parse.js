const fs = require('fs'); const html = fs.readFileSync('live_sooq.html', 'utf8'); const regex = /_next\/static\/chunks\/[^"']+\.js/g; console.log(Array.from(new Set(html.match(regex))));
