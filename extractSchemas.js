// core/extractSchemas.js
import Joi from 'joi';

function generateExampleFromKey(key) {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('id')) return 125069;
  if (lowerKey === 'limit') return 10;
  if (lowerKey === 'start') return 0;
  if (lowerKey === 'email') return 'user@example.com';
  if (lowerKey.includes('date')) return '2024-01-01';
  if (lowerKey.includes('status')) return 'active';
  if (lowerKey.includes('name')) return 'John Doe';
  return 'example';
}

function generateDescriptionFromKey(key, routeTag) {
  const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
  if (key.toLowerCase() === 'custid') return `Enter customer ID to fetch ${routeTag}-related records.`;
  if (key.toLowerCase() === 'limit') return `Number of ${routeTag} records to fetch.`;
  if (key.toLowerCase() === 'start') return `Starting index for ${routeTag} pagination.`;
  if (key.toLowerCase().includes('status')) return `Status of the ${routeTag} (e.g., active, inactive).`;
  return `${formattedKey} related to ${routeTag}.`;
}

function joiToSwaggerParam(joiSchema, key = '', routeTag = '', location = 'query') {
  const baseSchema = joiToSwagger(joiSchema, key, routeTag);
  
  return {
    name: key,
    in: location,
    required: !!joiSchema._flags.presence && joiSchema._flags.presence === 'required',
    schema: {
      type: baseSchema.type,
      example: baseSchema.example,
      ...(baseSchema.enum && { enum: baseSchema.enum })
    },
    description: baseSchema.description || generateDescriptionFromKey(key, routeTag)
  };
}


function joiToSwagger(joiSchema, key = '', routeTag = '') {
  if (!joiSchema || typeof joiSchema !== 'object') {
    return { type: 'string', example: 'string', description: 'Generic string field' };
  }

  if (joiSchema.type === 'array') {
    const items = joiToSwagger(joiSchema._terms?.items?.[0]?.schema, '', routeTag);
    return { type: 'array', items, example: [items.example], description: `List of ${key}s` };
  }

  if (joiSchema.type === 'object') {
    const keys = joiSchema._ids?._byKey || new Map();
    const properties = {};
    const example = {};
    for (const [subKey, meta] of keys) {
      const field = joiToSwagger(meta.schema, subKey, routeTag);
      properties[subKey] = field;
      if (field.example !== undefined) example[subKey] = field.example;
    }
    return { type: 'object', properties, example };
  }

  const type = joiSchema.type || 'string';
  const swaggerSchema = { type };

  const enumValues = joiSchema._valids?.values;
  if (enumValues?.size > 0 && !enumValues.has(undefined)) {
    swaggerSchema.enum = [...enumValues];
    swaggerSchema.example = [...enumValues][0];
  }

  if (joiSchema._flags?.default !== undefined) {
    swaggerSchema.default = joiSchema._flags.default;
    if (!swaggerSchema.example) swaggerSchema.example = joiSchema._flags.default;
  }

  if (joiSchema._flags?.description) {
    swaggerSchema.description = joiSchema._flags.description;
  } else if (key) {
    swaggerSchema.description = generateDescriptionFromKey(key, routeTag);
  }

  if (!swaggerSchema.example && key) swaggerSchema.example = generateExampleFromKey(key);

  if (!swaggerSchema.example) {
    switch (type) {
      case 'string': swaggerSchema.example = 'example string'; break;
      case 'number':
      case 'integer': swaggerSchema.example = 123; break;
      case 'boolean': swaggerSchema.example = true; break;
      case 'date': swaggerSchema.example = new Date().toISOString(); break;
      default: swaggerSchema.example = `sample ${type}`;
    }
  }

  return swaggerSchema;
}

export function extractSwaggerSchema(schemaString, schemas, routePath = '') {
  const [moduleName, schemaName] = schemaString.split('.');
  if (!schemas[moduleName]) return { requestBodySchema: {}, parameters: [] };

  const schemaObject = schemas[moduleName][schemaName];
  if (!schemaObject) return { requestBodySchema: {}, parameters: [] };

  const routeTag = routePath.split('/').filter(Boolean)[0]?.toLowerCase() || moduleName.toLowerCase();
  const requestBodySchema = {};
  const parameters = [];
  const sections = ['body', 'params', 'query'];

  for (const section of sections) {
    const joiSection = schemaObject[section];
    if (!joiSection || !joiSection._ids) continue;

    const joiKeys = joiSection._ids._byKey;
    for (const [key, meta] of joiKeys) {
      const fieldSchema = meta.schema;
      const isRequired = fieldSchema._flags?.presence === 'required';

      if (section === 'body') {
        requestBodySchema[key] = joiToSwagger(fieldSchema, key, routeTag);
      } else {
        const location = section === 'params' ? 'path' : 'query';
        parameters.push(joiToSwaggerParam(fieldSchema, key, routeTag, location));
      }
    }
  }

  return { requestBodySchema, parameters };
}
