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
          transformation: {
            format: {
              thumbnail: {
                width: 150,
                height: 150,
                crop: "fill",
              },
              small: {
                width: 320,
                height: 320,
                crop: "fill",
              },
              large: {
                width: 1000,
                height: 1000,
                crop: "fill",
              },
            },
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
