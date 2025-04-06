// core/generateDocumentation.js
import { parseRoutes } from '../extractRoutes.js';
import { generateSwaggerDoc } from '../utils/generateSwaggerDoc.js';

/**
 * Generate the full OpenAPI `paths` object
 * @param {Object} options
 * @param {string} options.routesDir - Directory containing route files
 * @param {Object} options.schemas - Exported Joi schema modules
 * @param {Object} [options.responses={}] - User-defined response mappings
 * @returns {Object} Swagger/OpenAPI-compatible paths object
 */
export function generateDocumentation({ routesDir, schemas, responses = {} }) {
  const routes = parseRoutes({ routesDir, schemas, responses });

  const documentation = routes.reduce((acc, route) => {
    const doc = generateSwaggerDoc(route);
    return { ...acc, ...doc };
  }, {});

  return documentation;
}
