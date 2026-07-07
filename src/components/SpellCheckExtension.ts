import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { handleTextCorrection } from '@/app/actions';

export interface SpellError {
    from: number;
    to: number;
    word: string;
    message: string;
    replacements: string[];
}

export const spellCheckKey = new PluginKey<{
    decorations: DecorationSet;
    errors: SpellError[];
}>('spellCheck');

// ── Convert plain-text character offset → ProseMirror position ──
function buildCharPosMap(doc: ProseMirrorNode): number[] {
    // map[charIndex] = pmPos  (absolute doc position of that character)
    const map: number[] = [];
    doc.descendants((node, pos) => {
        if (node.isText && node.text) {
            for (let i = 0; i < node.text.length; i++) {
                map.push(pos + i);
            }
        }
    });
    return map;
}

const COMMON_ARABIC_TYPOS: Record<string, string[]> = {
    'أتمنا': ['أتمنى'],
    'اتمنا': ['أتمنى'],
    'ذالك': ['ذلك'],
    'الاكتروني': ['الإلكتروني'],
    'الالكتروني': ['الإلكتروني'],
    'خي': ['أخي'],
    'تترددا': ['تتردد'],
    'انشاء الله': ['إن شاء الله'],
    'انشالله': ['إن شاء الله'],
    'هذى': ['هذه'],
    'هذة': ['هذه'],
    'وأضافه': ['وإضافة'],
    'أعلانات': ['إعلانات'],
    'اعلانات': ['إعلانات'],
    'وأبداء': ['وإبداء'],
    'وابداء': ['وإبداء'],
    'الاراء': ['الآراء'],
    'اريد': ['أريد'],
    'اضافتها': ['إضافتها'],
};

function generateArabicSuggestions(word: string): string[] {
    const suggestions: string[] = [];
    
    // 1. Check common typos map
    if (COMMON_ARABIC_TYPOS[word]) {
        suggestions.push(...COMMON_ARABIC_TYPOS[word]);
    }
    
    // 2. Hamza rules
    // Starts with Alif (ا) -> try أ and إ
    if (word.startsWith('ا') && word.length > 2) {
        suggestions.push('أ' + word.slice(1));
        suggestions.push('إ' + word.slice(1));
    }
    // Starts with wa-Alif (وا) -> try وأ and وإ
    if (word.startsWith('وا') && word.length > 3) {
        suggestions.push('وأ' + word.slice(2));
        suggestions.push('وإ' + word.slice(2));
    }
    // Starts with Al-Alif (الا) -> try الإ, الأ, الآ
    if (word.startsWith('الا') && word.length > 4) {
        suggestions.push('الإ' + word.slice(3));
        suggestions.push('الأ' + word.slice(3));
        suggestions.push('الآ' + word.slice(3));
    }
    
    // 3. Ending rules
    // Ends with Yaa (ي) <-> Alif Maksura (ى)
    if (word.endsWith('ي')) {
        suggestions.push(word.slice(0, -1) + 'ى');
    } else if (word.endsWith('ى')) {
        suggestions.push(word.slice(0, -1) + 'ي');
    }
    
    // Ends with Haa (ه) <-> Taa Marbuta (ة)
    if (word.endsWith('ه')) {
        suggestions.push(word.slice(0, -1) + 'ة');
    } else if (word.endsWith('ة')) {
        suggestions.push(word.slice(0, -1) + 'ه');
    }

    return Array.from(new Set(suggestions)).filter(s => s !== word);
}

function scanTextForCommonTypos(text: string): SpellError[] {
    const errors: SpellError[] = [];
    const words = text.split(/[\s،,.;()؟!؟]+/);
    let offset = 0;
    
    for (const rawWord of words) {
        const word = rawWord.trim();
        if (!word) continue;
        
        const idx = text.indexOf(word, offset);
        if (idx !== -1) {
            offset = idx + word.length;
            
            if (COMMON_ARABIC_TYPOS[word]) {
                errors.push({
                    from: idx,
                    to: idx + word.length,
                    word: word,
                    message: 'خطأ إملائي شائع',
                    replacements: COMMON_ARABIC_TYPOS[word]
                });
            }
        }
    }
    return errors;
}

function enhanceWordSuggestions(word: string, existingSuggestions: string[]): string[] {
    const list = [...existingSuggestions];
    
    if (COMMON_ARABIC_TYPOS[word]) {
        list.unshift(...COMMON_ARABIC_TYPOS[word]);
    }
    
    const generated = generateArabicSuggestions(word);
    list.push(...generated);
    
    const unique = Array.from(new Set(list))
        .filter(s => s !== word && s.trim().length > 0);
        
    return unique.sort((a, b) => {
        const aInMap = COMMON_ARABIC_TYPOS[word]?.includes(a) ? 1 : 0;
        const bInMap = COMMON_ARABIC_TYPOS[word]?.includes(b) ? 1 : 0;
        if (aInMap !== bInMap) return bInMap - aInMap;
        
        const aHamzaDiff = Math.abs(a.length - word.length);
        const bHamzaDiff = Math.abs(b.length - word.length);
        return aHamzaDiff - bHamzaDiff;
    });
}

async function fetchSpellErrors(text: string): Promise<SpellError[]> {
    if (!text.trim() || text.trim().length < 2) return [];
    
    // 1. Scan for local typos
    const localErrors = scanTextForCommonTypos(text);
    
    // 2. Fetch from Google Gemini API via handleTextCorrection Server Action
    let apiErrors: SpellError[] = [];
    try {
        const res = await handleTextCorrection(text);
        if (res.success && res.data) {
            let offset = 0;
            for (const item of res.data) {
                const idx = text.indexOf(item.word, offset);
                if (idx !== -1) {
                    offset = idx + item.word.length;
                    apiErrors.push({
                        from: idx,
                        to: idx + item.word.length,
                        word: item.word,
                        message: item.message || 'خطأ إملائي محتمل',
                        replacements: item.replacements || [],
                    });
                } else {
                    const fallbackIdx = text.indexOf(item.word);
                    if (fallbackIdx !== -1) {
                        apiErrors.push({
                            from: fallbackIdx,
                            to: fallbackIdx + item.word.length,
                            word: item.word,
                            message: item.message || 'خطأ إملائي محتمل',
                            replacements: item.replacements || [],
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.error('Google text correction failed:', err);
    }
    
    // 3. Merge local and API errors avoiding overlaps
    const mergedErrors: SpellError[] = [...apiErrors];
    for (const localErr of localErrors) {
        const isOverlap = mergedErrors.some(apiErr => 
            (localErr.from >= apiErr.from && localErr.from < apiErr.to) ||
            (apiErr.from >= localErr.from && apiErr.from < localErr.to)
        );
        if (!isOverlap) {
            const generated = generateArabicSuggestions(localErr.word);
            localErr.replacements = Array.from(new Set([...localErr.replacements, ...generated])).slice(0, 6);
            mergedErrors.push(localErr);
        } else {
            const matchIndex = mergedErrors.findIndex(apiErr => 
                (localErr.from >= apiErr.from && localErr.from < apiErr.to) ||
                (apiErr.from >= localErr.from && apiErr.from < localErr.to)
            );
            if (matchIndex !== -1) {
                const apiErr = mergedErrors[matchIndex];
                const generated = generateArabicSuggestions(apiErr.word);
                apiErr.replacements = Array.from(new Set([...localErr.replacements, ...apiErr.replacements, ...generated])).slice(0, 6);
            }
        }
    }
    
    return mergedErrors.sort((a, b) => a.from - b.from);
}

export const SpellCheckExtension = Extension.create({
    name: 'spellCheck',

    addProseMirrorPlugins() {
        const ignoredWords = new Set<string>();
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        return [
            new Plugin({
                key: spellCheckKey,

                state: {
                    init: () => ({ decorations: DecorationSet.empty, errors: [] as SpellError[] }),

                    apply(tr, prev) {
                        const meta = tr.getMeta(spellCheckKey);
                        if (meta) {
                            // rebuild decorations from fresh error list
                            const { doc, errors } = meta;
                            const charMap = buildCharPosMap(doc);
                            const decos: Decoration[] = [];
                            for (const err of errors) {
                                if (ignoredWords.has(err.word)) continue;
                                const pmFrom = charMap[err.from];
                                const pmTo = charMap[err.to - 1];
                                if (pmFrom == null || pmTo == null) continue;
                                const pmEnd = pmTo + 1;
                                if (pmFrom >= pmEnd) continue;
                                decos.push(
                                    Decoration.inline(pmFrom, pmEnd, {
                                        class: 'spell-error',
                                        'data-spell-from': String(pmFrom),
                                        'data-spell-to': String(pmEnd),
                                        'data-spell-word': err.word,
                                        'data-spell-replacements': err.replacements.join('||'),
                                        'data-spell-message': err.message,
                                    })
                                );
                            }
                            return {
                                decorations: DecorationSet.create(doc, decos),
                                errors,
                            };
                        }
                        // keep decorations updated when doc changes
                        if (tr.docChanged) {
                            return {
                                decorations: prev.decorations.map(tr.mapping, tr.doc),
                                errors: prev.errors,
                            };
                        }
                        return prev;
                    },
                },

                props: {
                    decorations(state) {
                        return spellCheckKey.getState(state)?.decorations ?? DecorationSet.empty;
                    },
                },

                view(editorView) {
                    const runCheck = () => {
                        if (debounceTimer) clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(async () => {
                            const text = editorView.state.doc.textContent;
                            if (!text.trim()) return;
                            const errors = await fetchSpellErrors(text);
                            if (!editorView.isDestroyed) {
                                const tr = editorView.state.tr.setMeta(spellCheckKey, {
                                    doc: editorView.state.doc,
                                    errors,
                                });
                                editorView.dispatch(tr);
                            }
                        }, 1800);
                    };

                    // run once on mount
                    runCheck();

                    return {
                        update(view, prevState) {
                            if (!view.state.doc.eq(prevState.doc)) {
                                runCheck();
                            }
                        },
                        destroy() {
                            if (debounceTimer) clearTimeout(debounceTimer);
                        },
                    };
                },
            }),
        ];
    },
});

export default SpellCheckExtension;
