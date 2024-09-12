/**
 * about-us controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::about-us.about-us",
  ({ s }) => ({
    async find(ctx) {
      const { query } = ctx;

      return await s.query("api::about-us.about-us").find({
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
