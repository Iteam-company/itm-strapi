/**
 * about-us service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService(
  "api::about-us.about-us",
  ({ strapi }) => ({
    async findWithRelations(query) {
      return await strapi.entityService.findMany("api::about-us.about-us", {
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
