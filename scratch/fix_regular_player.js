const fs = require('fs');
const path = 'd:/mashro3/mashroh/sooq_el arab/arb-soq/src/components/video-ad/RegularVideoPlayer.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = /\{(\/\* Fake empty related section to visually complete the design \*\/|)\s*<div className="flex flex-col gap-3">[\s\S]*?\{\[1, 2, 3, 4, 5\].map[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const replacement = `               <div className="flex flex-col gap-3">
                  {relatedAds.map((relatedAd) => {
                     const thumb = resolveThumbnail(relatedAd);
                     return (
                        <div 
                           key={relatedAd.id} 
                           onClick={() => onAdSelect(relatedAd.id)}
                           className="flex gap-3 hover:bg-secondary/30 p-2 rounded-xl cursor-pointer transition-colors border border-transparent shadow-sm group"
                        >
                            <div className="w-[140px] aspect-video bg-secondary/50 rounded-lg shrink-0 flex items-center justify-center border border-border/50 overflow-hidden relative">
                                 {thumb ? (
                                     <img src={thumb} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                                 ) : (
                                     <Film className="w-6 h-6 text-muted-foreground/30" />
                                 )}
                                 <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                     <PlayCircle className="w-6 h-6 text-white" />
                                 </div>
                            </div>
                            <div className="flex flex-col gap-1 overflow-hidden py-1">
                                <span className="font-bold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                    {relatedAd.title}
                                </span>
                                <span className="text-xs text-muted-foreground mt-0.5">{relatedAd.user?.name || 'سوق العرب'}</span>
                                <span className="text-[11px] text-muted-foreground">{getTimeAgo(relatedAd)}</span>
                            </div>
                        </div>
                     );
                  })}

                  {relatedAds.length === 0 && (
                      <div className="text-center py-10 bg-secondary/20 rounded-2xl border border-dashed border-border">
                          <Film className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">لا توجد مقترحات إضافية</p>
                      </div>
                  )}
               </div>`;

// Find the section by searching for the marker and the map call
const startMarker = '{/* Fake empty related section to visually complete the design */}';
const startIndex = content.indexOf(startMarker);
const mapIndex = content.indexOf('[1, 2, 3, 4, 5].map');

if (startIndex !== -1 && mapIndex !== -1) {
    // Find the div wrapper start relative to startMarker
    const divStart = content.lastIndexOf('<div className="flex flex-col gap-3">', mapIndex);
    // Find the closing divs
    const firstClose = content.indexOf('</div>', content.indexOf('))}'));
    const secondClose = content.indexOf('</div>', firstClose + 1);
    
    if (divStart !== -1 && secondClose !== -1) {
        const result = content.substring(0, divStart) + replacement + content.substring(secondClose + 6);
        fs.writeFileSync(path, result);
        console.log('Successfully updated RegularVideoPlayer.tsx');
    } else {
        console.log('Could not find wrapping divs');
    }
} else {
    console.log('Could not find start marker or map call');
}
