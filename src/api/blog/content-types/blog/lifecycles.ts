const BLOG_UID = 'api::blog.blog';

const createSlug = (value?: string | null) =>
  (value || 'blog-post')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || 'blog-post';

const buildUniqueSlug = async (baseSlug: string, currentId?: number | string) => {
  const existingPosts = await strapi.db.query(BLOG_UID).findMany({
    select: ['id', 'slug'],
    limit: 1000,
  });
  const existingSlugs = new Set(
    existingPosts
      .filter((post) => String(post.id) !== String(currentId || ''))
      .map((post) => post.slug)
      .filter(Boolean),
  );

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  for (let index = 2; index < 1000; index += 1) {
    const candidateSlug = `${baseSlug}-${index}`;

    if (!existingSlugs.has(candidateSlug)) {
      return candidateSlug;
    }
  }

  return `${baseSlug}-${Date.now()}`;
};

export default {
  async beforeCreate(event) {
    const data = event.params.data;

    if (!data.slug) {
      data.slug = await buildUniqueSlug(createSlug(data.title));
    }
  },

  async beforeUpdate(event) {
    const data = event.params.data;

    if (!data.slug && data.title) {
      data.slug = await buildUniqueSlug(createSlug(data.title), event.params.where?.id);
    }
  },
};
