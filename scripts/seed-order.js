// Recreate the historical creation order of tags and categories so the tag cloud,
// category cloud and per-post chips keep the same order as the deployed site.
const tags = ["program", "data Structure and alagorithm", "computer", "technology", "DID", "DID基础", "DID进阶", "DID高级", "java", "Python", "Python基础", "Python进阶", "Python高级", "finance", "software", "Quantitative Investment", "Financial Data Analysis Experiment"];
const categories = ["Program", "Computer", "Econometrics", "Python", "Finance"];
const Tag = hexo.model('Tag');
for (const name of tags) if (!Tag.findOne({ name })) Tag.insert({ name });
const Category = hexo.model('Category');
for (const name of categories) if (!Category.findOne({ name })) Category.insert({ name });
