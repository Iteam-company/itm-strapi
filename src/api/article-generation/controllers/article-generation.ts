/**
 * article-generation controller
 */

import { factories } from '@strapi/strapi';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown article generation error.';

const buildGenerationErrorBody = (error: unknown) => ({
  data: null,
  error: {
    status: 500,
    name: 'ArticleGenerationError',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Article generation failed.'
        : getErrorMessage(error),
  },
});

export default factories.createCoreController(
  'api::article-generation.article-generation',
  ({ strapi }) => ({
    async generateDraft(ctx) {
      try {
        const requestedTopic = ctx.request.body?.topic;
        const draft = await strapi
          .service('api::article-generation.article-generation')
          .generateDraft(requestedTopic);

        ctx.body = {
          data: draft,
          meta: {
            generationMode: strapi
              .service('api::article-generation.article-generation')
              .getProvider().name,
            published: false,
          },
        };
      } catch (error) {
        strapi.log.error(`Article draft generation failed: ${getErrorMessage(error)}`);
        ctx.status = 500;
        ctx.body = buildGenerationErrorBody(error);
      }
    },

    async generateAndPublish(ctx) {
      try {
        const requestedTopic = ctx.request.body?.topic;
        const result = await strapi
          .service('api::article-generation.article-generation')
          .generateAndPublish(requestedTopic);

        ctx.status = 201;
        ctx.body = {
          data: result,
          meta: {
            generationMode: result.generationMode,
            published: true,
          },
        };
      } catch (error) {
        strapi.log.error(`Article generation and publish failed: ${getErrorMessage(error)}`);
        ctx.status = 500;
        ctx.body = buildGenerationErrorBody(error);
      }
    },
  })
);
