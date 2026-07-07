import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ContactButtonNodeView from './ContactButtonNodeView';

export const ContactButton = Node.create({
  name: 'contactButton',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      type: {
        default: 'whatsapp', // 'whatsapp' or 'call'
        parseHTML: element => element.getAttribute('data-contact-btn') || 'whatsapp',
      },
      phone: {
        default: '',
        parseHTML: element => element.getAttribute('data-phone') || '',
      },
      text: {
        default: '',
        parseHTML: element => element.getAttribute('data-text') || '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-contact-btn]',
        getAttrs: element => {
          const el = element as HTMLElement;
          return {
            type: el.getAttribute('data-contact-btn') || 'whatsapp',
            phone: el.getAttribute('data-phone') || '',
            text: el.getAttribute('data-text') || el.textContent || '',
          };
        },
      },
      {
        tag: 'a.contact-btn-wrapper',
        getAttrs: element => {
          const el = element as HTMLElement;
          const innerSpan = el.querySelector('span.contact-btn-custom');
          if (innerSpan) {
            return {
              type: innerSpan.getAttribute('data-contact-btn') || 'whatsapp',
              phone: innerSpan.getAttribute('data-phone') || el.getAttribute('href')?.replace(/^(tel:|https:\/\/wa\.me\/)/, '') || '',
              text: innerSpan.getAttribute('data-text') || innerSpan.textContent || '',
            };
          }
          return {
            type: el.getAttribute('href')?.startsWith('tel:') ? 'call' : 'whatsapp',
            phone: el.getAttribute('href')?.replace(/^(tel:|https:\/\/wa\.me\/)/, '') || '',
            text: el.textContent || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({
        'data-contact-btn': HTMLAttributes.type || 'whatsapp',
        'data-phone': HTMLAttributes.phone || '',
        'data-text': HTMLAttributes.text || '',
        class: 'contact-btn-custom',
        contenteditable: 'false',
      }),
      [
        'span',
        { style: 'pointer-events: none;' },
        (HTMLAttributes.type === 'whatsapp' ? '📱 ' : '📞 ') + (HTMLAttributes.text || HTMLAttributes.phone || '')
      ]
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ContactButtonNodeView);
  },
});

export default ContactButton;
