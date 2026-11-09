// Posts recovered from the deployed site are already rendered HTML.
// Front matter `rawhtml: true` makes Hexo skip markdown/nunjucks for them.
hexo.extend.filter.register('before_post_render', data => {
  if (data.rawhtml) { data._rawContent = data.content; data.content = ''; }
  return data;
}, 1);
hexo.extend.filter.register('after_post_render', data => {
  if (data.rawhtml) { data.content = data._rawContent; }
  return data;
}, 1);
