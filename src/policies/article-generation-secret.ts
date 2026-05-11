import { errors } from '@strapi/utils';

const { ApplicationError, UnauthorizedError } = errors;

export default async (policyContext) => {
  const configuredSecret = process.env.ARTICLE_GENERATION_SECRET;
  const providedSecret = policyContext.request.headers['x-article-generation-secret'];

  if (!configuredSecret) {
    throw new ApplicationError('ARTICLE_GENERATION_SECRET is not configured.');
  }

  if (!providedSecret || providedSecret !== configuredSecret) {
    throw new UnauthorizedError('Invalid article generation secret.');
  }

  return true;
};
