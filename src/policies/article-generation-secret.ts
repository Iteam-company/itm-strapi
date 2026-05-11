export default async (policyContext) => {
  const configuredSecret = process.env.ARTICLE_GENERATION_SECRET;
  const providedSecret = policyContext.request.headers['x-article-generation-secret'];

  if (!configuredSecret) {
    policyContext.throw(500, 'ARTICLE_GENERATION_SECRET is not configured.');
  }

  if (!providedSecret || providedSecret !== configuredSecret) {
    policyContext.throw(401, 'Invalid article generation secret.');
  }

  return true;
};
