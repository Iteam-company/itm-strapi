/**
 * article-generation controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article-generation.article-generation',
  ({ strapi }) => ({
    async generateDraft(ctx) {
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
    },

    async generateAndPublish(ctx) {
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
    },
  })
);
