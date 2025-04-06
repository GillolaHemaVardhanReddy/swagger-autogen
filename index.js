// index.js
import { generateDocumentation } from './core/generateDocumentation.js';

/**
 * Main export function for users
 * @param {Object} options
 * @param {string} [options.routesDir] - Path to the routes directory (default: ../backend/routes)
 * @param {Object} options.schemas - Joi schemas grouped by module
 * @param {Object} [options.responses] - Optional response mapping object
 * @returns {Object} Swagger/OpenAPI-compatible paths object
 */
export function getOpenApiPaths({ routesDir, schemas, responses }) {
  return generateDocumentation({ routesDir, schemas, responses });
}
export { setupSwagger } from './core/swagger.js';