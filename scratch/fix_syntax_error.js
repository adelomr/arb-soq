const fs = require('fs');
const path = 'd:/mashro3/mashroh/sooq_el arab/arb-soq/src/components/video-ad/RegularVideoPlayer.tsx';
let content = fs.readFileSync(path, 'utf8');

// The problematic section:
//                </div>
//         </div>
//
//         {/* Share Modal Dialog */}

const targetMatch = /\s+<\/div>\s+<\/div>\s+\{\/\* Share Modal Dialog \*\/\}/;
const replacement = `\n            </div>\n        </div>\n    </div>\n\n    {/* Share Modal Dialog */}`;

if (targetMatch.test(content)) {
    const newContent = content.replace(targetMatch, replacement);
    fs.writeFileSync(path, newContent);
    console.log('Successfully fixed syntax error in RegularVideoPlayer.tsx');
} else {
    // Try another way if regex fails due to line endings
    const marker = '{/* Share Modal Dialog */}';
    const markerIndex = content.indexOf(marker);
    if (markerIndex !== -1) {
        // Look backwards for the two divs
        const secondDivIndex = content.lastIndexOf('</div>', markerIndex);
        const firstDivIndex = content.lastIndexOf('</div>', secondDivIndex - 1);
        
        if (firstDivIndex !== -1 && secondDivIndex !== -1) {
             // Let's just rewrite the whole part from the last map to the dialog
             const fixedPart = `\n                  )}
               </div>
            </div>
        </div>

       {/* Share Modal Dialog */}`;
             
             // We need to find where the map ends
             const mapEndIndex = content.lastIndexOf(')}', markerIndex);
             if (mapEndIndex !== -1) {
                 const newContent = content.substring(0, mapEndIndex) + fixedPart + content.substring(markerIndex + marker.length);
                 fs.writeFileSync(path, newContent);
                 console.log('Successfully fixed syntax error (variant 2)');
             } else {
                 console.log('Could not find map end');
             }
        } else {
            console.log('Could not find closing divs');
        }
    } else {
        console.log('Could not find start marker');
    }
}
