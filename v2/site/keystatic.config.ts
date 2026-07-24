/* Keystatic — git-backed CMS, dev-mode only. Content lives in the repo;
   every edit is a commit, so the writing history is the public record.
   Run the editor with:  npm run cms  ->  http://localhost:4321/keystatic */

import { collection, config, fields } from '@keystatic/core';

export default config({
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'noorullah — writing' },
  },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        date: fields.date({ label: 'Date' }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
    works: collection({
      label: 'Works',
      slugField: 'title',
      path: 'src/content/works/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        date: fields.date({ label: 'Date' }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        order: fields.number({ label: 'Order' }),
        role: fields.text({ label: 'Role' }),
        stack: fields.array(fields.text({ label: 'Stack item' }), {
          label: 'Stack',
          itemLabel: (props) => props.value,
        }),
        outcome: fields.text({ label: 'Outcome' }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
  },
});
