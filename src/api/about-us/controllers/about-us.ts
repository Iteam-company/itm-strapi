/**
 * about-us controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::about-us.about-us",
  ({ strapi }) => ({
    async find(ctx) {
      const { query } = ctx;

      return await strapi.query("api::about-us.about-us").findWithCount({
        ...query,
        populate: {
          comments: {
            populate: {
              commentInfo: true,
            },
          },
        },
      });
    },
  })
);
