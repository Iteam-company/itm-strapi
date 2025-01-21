export default ({ env }) => ({
  "strapi-plugin-populate-deep": {
    config: {
      defaultDepth: 5,
    },
  },
  "users-permissions": {
    config: {
      jwt: {
        expiresIn: "8h",
      },
    },
  },
});
