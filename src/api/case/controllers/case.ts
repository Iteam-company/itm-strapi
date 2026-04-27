/**
 * case controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::case.case",
  ({ strapi }) => ({
    async getCase(ctx) {
      const uid = ctx.query.filters?.uid?.$eq;

      const data = await strapi.entityService.findMany("api::case.case", {
        filters: {
          uid,
        },
        populate: {
          seo: true,
          components: {
            populate: "*",
          },
        },
      });

      ctx.body = data[0];
    },
  }),
);
