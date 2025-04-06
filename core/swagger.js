import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

/**
 * Initializes Swagger UI and JSON spec route.
 * @param {Object} app - Express app instance.
 * @param {Object} options - Swagger options.
 * @param {Object} options.documentation - Paths object (OpenAPI format).
 * @param {string} options.title - API title.
 * @param {string} options.version - API version.
 * @param {string} options.description - API description.
 * @param {string} options.serverUrl - Base URL of your API (e.g., http://localhost:3000).
 * @param {boolean} [options.enabled=true] - Whether to enable Swagger in current env.
 */
export function setupSwagger(app, {
  documentation,
  title = 'API Docs',
  version = '1.0.0',
  description = 'API Documentation',
  serverUrl = 'http://localhost:3000',
  enabled = true,
}) {
  if (!enabled) return;

  const options = {
    definition: {
      openapi: "3.0.0",
      info: { title, version, description },
      servers: [{ url: serverUrl }],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "apiKey",
            in: "header",
            name: "Authorization",
            description: "Enter your JWT token (without 'Bearer ' prefix)",
          },
        },
      },
      security: [{ BearerAuth: [] }],
      paths: {
        ...documentation,
      },
    },
    apis: [], // can be extended by user
  };

  const swaggerSpec = swaggerJsdoc(options);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: { persistAuthorization: true }
  }));
}
