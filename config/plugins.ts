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
  upload: {
    config: {
      provider: "cloudinary",
      providerOptions: {
        cloud_name: env("CLOUDINARY_NAME"),
        api_key: env("CLOUDINARY_KEY"),
        api_secret: env("CLOUDINARY_SECRET"),
        params: {
          folder: "strapi-assets",
          resource_type: "auto",
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: { folder: "strapi-assets" },
        delete: {},
      },
    },
  },
});
