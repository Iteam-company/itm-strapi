export default {
  routes: [
    {
      method: 'POST',
      path: '/article-generations/generate-draft',
      handler: 'article-generation.generateDraft',
      config: {
        auth: false,
        policies: ['global::article-generation-secret'],
      },
    },
    {
      method: 'POST',
      path: '/article-generations/generate-and-publish',
      handler: 'article-generation.generateAndPublish',
      config: {
        auth: false,
        policies: ['global::article-generation-secret'],
      },
    },
  ],
};
