// While the series is being published in parts, a {% post_link %} may point at
// an article that does not exist yet. Render its text instead of failing the build.
const { postFindOneFactory } = require('hexo/lib/plugins/tag');
const postLink = require('hexo/lib/plugins/tag/post_link')(hexo);
hexo.extend.tag.register('post_link', args => {
  const slug = args[0];
  if (slug && !postFindOneFactory(hexo)({ slug })) {
    const text = args.slice(1).filter(a => a !== 'true' && a !== 'false').join(' ');
    return text || slug;
  }
  return postLink(args.slice());
}, { async: false });
