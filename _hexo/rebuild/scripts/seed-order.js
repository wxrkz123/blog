// Recreate the historical creation order of tags so the tag cloud and the
// per-post tag chips keep the same order as the previously deployed site.
const tags = ['program', 'data Structure and alagorithm', 'computer', 'technology', 'java',
  'finance', 'software', 'Quantitative Investment', 'Financial Data Analysis Experiment'];
const Tag = hexo.model('Tag');
for (const name of tags) if (!Tag.findOne({ name })) Tag.insert({ name });
const Category = hexo.model('Category');
for (const name of ['Program', 'Computer', 'Finance']) if (!Category.findOne({ name })) Category.insert({ name });
