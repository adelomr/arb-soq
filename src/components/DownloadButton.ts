import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import DownloadButtonNodeView from './DownloadButtonNodeView';

export const DownloadButton = Node.create({
  name: 'downloadButton',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      text: {
        default: 'تحميل الملف',
        // Support reading from both old <a href> and new <span data-url> format
        parseHTML: element => {
          // New format: data-text attribute
          if (element.hasAttribute('data-text')) {
            return element.getAttribute('data-text') || 'تحميل الملف';
          }
          // Old format: read text from <span> child or element text
          return element.querySelector('span')?.textContent || element.textContent || 'تحميل الملف';
        },
      },
      url: {
        default: '',
        // Support reading from both old <a href> and new <span data-url> format
        parseHTML: element => {
          // New format: data-url attribute
          if (element.hasAttribute('data-url')) {
            return element.getAttribute('data-url') || '';
          }
          // Old format: href attribute
          return element.getAttribute('href') || '';
        },
      },
    };
  },

  parseHTML() {
    return [
      // New format: <span data-download-btn> — safe, never navigates
      {
        tag: 'span[data-download-btn]',
        getAttrs: element => {
          const el = element as HTMLElement;
          return {
            text: el.getAttribute('data-text') || el.textContent || 'تحميل الملف',
            url: el.getAttribute('data-url') || '',
          };
        },
      },
      // Legacy wrapper: <a class="download-btn-wrapper"> - when copy-pasted or loaded
      {
        tag: 'a.download-btn-wrapper',
        getAttrs: element => {
          const el = element as HTMLElement;
          const innerSpan = el.querySelector('span[data-download-btn], span.download-btn-custom');
          if (innerSpan) {
            return {
              text: innerSpan.getAttribute('data-text') || innerSpan.textContent || 'تحميل الملف',
              url: innerSpan.getAttribute('data-url') || '',
            };
          }
          return {
            text: el.textContent || 'تحميل الملف',
            url: el.getAttribute('href') || '',
          };
        },
      },
      // Legacy format: <a class="download-btn-custom"> — kept for backwards compat
      {
        tag: 'a.download-btn-custom',
        getAttrs: element => {
          const el = element as HTMLElement;
          return {
            text: el.querySelector('span')?.textContent || el.textContent || 'تحميل الملف',
            url: el.getAttribute('href') || '',
          };
        },
      },
    ];
  },

  /**
   * renderHTML is used when:
   *  1. The editor serialises content to HTML (getHTML / onChange)
   *  2. Content is pasted / loaded back into the editor
   *
   * IMPORTANT: We use <span data-download-btn> instead of <a href> so that
   * the stored HTML never contains a real anchor element that browsers / the
   * LinkInterceptor would follow on click.  The visible download link is only
   * rendered by the NodeView (in the editor) or by the blog display CSS/JS
   * (in the front-end view).
   */
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({
        'data-download-btn': 'true',
        'data-url': HTMLAttributes.url || '',
        'data-text': HTMLAttributes.text || 'تحميل الملف',
        class: 'download-btn-custom',
        // Prevent accidental contenteditable cursor from jumping into the span
        contenteditable: 'false',
      }),
      [
        'svg',
        {
          width: '16',
          height: '16',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2.5',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          style: 'display: inline-block; vertical-align: middle; margin-left: 6px; pointer-events: none;',
        },
        [
          'path',
          { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }
        ],
        [
          'polyline',
          { points: '7 10 12 15 17 10' }
        ],
        [
          'line',
          { x1: '12', y1: '15', x2: '12', y2: '3' }
        ]
      ],
      ['span', { style: 'pointer-events: none;' }, HTMLAttributes.text || 'تحميل الملف']
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DownloadButtonNodeView);
  },
});
export default DownloadButton;
