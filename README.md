# swagger-autogen
this module generates swagger automated documentation by calling a specific function with specific parameters

how to setup :
const documentation = getOpenApiPaths({ schemas }); // responses can be left out if not have any
setupSwagger(app, {
  documentation,
  title: 'Alpha Ads API',
  serverUrl: `http://localhost:${config.port}`,
  version: '1.0.0',
  description: 'API Docs for Alpha Ads',
  enabled: config.env !== 'production',
});