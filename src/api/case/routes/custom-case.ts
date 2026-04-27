export default {
  routes: [
    {
      method: "GET",
      path: "/case/by-id",
      handler: "case.getCase",
      config: {
        auth: false,
      },
    },
  ],
};
