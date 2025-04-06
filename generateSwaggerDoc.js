export function generateSwaggerDoc({
  path,
  method,
  summary,
  description,
  tags,
  parameters = [],
  requestBodySchema = {},
  responseSchema = {},
}) {
  function buildSchema(properties) {
    if (!properties || typeof properties !== "object") {
      return { type: typeof properties, example: properties }; // Handle primitive types
    }
  
    return Object.fromEntries(
      Object.entries(properties).map(([key, value]) => {
        if (value.type === "array") {
          return [
            key,
            {
              type: "array",
              items: value.items
                ? value.items.type === "object"
                  ? { type: "object", properties: buildSchema(value.items.properties || {}) }
                  : { type: value.items.type || "string", example: value.items.example || "" }
                : { type: "string" }, // Default array items to string
            },
          ];
        }
  
        if (value.type === "object") {
          return [
            key,
            {
              type: "object",
              properties: value.properties ? buildSchema(value.properties) : {},
            },
          ];
        }
  
        return [key, { type: value.type, example: value.example }];
      })
    );
  }   

  function buildResponseSchema(responseSchema) {
    if (!responseSchema || typeof responseSchema !== "object") return {};

    // Case: If `data` is a primitive (string, number, boolean, etc.)
    if (responseSchema.data && typeof responseSchema.data !== "object") {
        return {
            type: "object",
            properties: {
                success: { type: "boolean", example: true },
                message: { type: "string", example: "Operation successful" },
                code: { type: "integer", example: 200 },
                data: { type: typeof responseSchema.data, example: responseSchema.data },
            },
        };
    }

    // Case: If `data` is explicitly `null`
    if (responseSchema.data === null) {
        return {
            type: "object",
            properties: {
                success: { type: "boolean", example: true },
                message: { type: "string", example: "Operation successful" },
                code: { type: "integer", example: 200 },
                data: { type: "null" },
            },
        };
    }

    // Case: `data.items` is an array of values (e.g., ["string1", "string2"])
    if (Array.isArray(responseSchema.data?.items)) {
        return {
            type: "object",
            properties: {
                success: { type: "boolean", example: true },
                message: { type: "string", example: "Operation successful" },
                code: { type: "integer", example: 200 },
                data: {
                    type: "array",
                    items: responseSchema.data.items[0]?.type
                        ? { type: responseSchema.data.items[0].type, example: responseSchema.data.items[0].example }
                        : { type: "string" }, // Default to string
                },
            },
        };
    }

    // Case: `data.items` is an object defining array schema
    if (responseSchema.data?.items?.type) {
        return {
            type: "object",
            properties: {
                success: { type: "boolean", example: true },
                message: { type: "string", example: "Operation successful" },
                code: { type: "integer", example: 200 },
                data: {
                    type: "array",
                    items:
                        responseSchema.data.items?.type === "object"
                            ? { type: "object", properties: buildSchema(responseSchema.data.items.properties || {}) }
                            : { type: responseSchema.data.items?.type || "string", example: responseSchema.data.items?.example || "" },
                },
            },
        };
    }

    // Case: `data` is an object with properties
    if (responseSchema.data?.properties) {
        return {
            type: "object",
            properties: {
                success: { type: "boolean", example: true },
                message: { type: "string", example: "Operation successful" },
                code: { type: "integer", example: 200 },
                data: {
                    type: "object",
                    properties: buildSchema(responseSchema.data.properties),
                },
            },
        };
    }

    // Case: `data` itself is an array (without `items` defined)
    if (responseSchema.data?.type === "array") {
        return {
            type: "object",
            properties: {
                success: { type: "boolean", example: true },
                message: { type: "string", example: "Operation successful" },
                code: { type: "integer", example: 200 },
                data: {
                    type: "array",
                    items: {
                        type: responseSchema.data.items?.type || "string", // Default to string
                        example: responseSchema.data.items?.example || "",
                    },
                },
            },
        };
    }

    // Default fallback: Treat `data` as an object
    return {
        type: "object",
        properties: buildSchema(responseSchema),
    };
  }

  return {
    [path]: {
      [method.toLowerCase()]: {
        summary,
        description,
        tags: Array.isArray(tags) ? tags : [tags],
        security: [{ BearerAuth: [] }],

        parameters: parameters.length > 0
        ? parameters.map(param => ({
            name: param.name,
            in: param.in,
            required: param.required,
            description: param.description || "",
            schema: param.type === "array"
              ? { type: "array", items: { type: param.itemsType || "string" }, example: param.example }
              : { type: param.type, example: param.example, default: param.default },
            allowEmptyValue: param.in === "query" ? !param.required : undefined,
          }))
        : undefined,

        requestBody:
          method.toUpperCase() !== "GET" && Object.keys(requestBodySchema).length > 0
            ? {
                required: true,
                content: {
                  "application/json": {
                    schema: { type: "object", properties: buildSchema(requestBodySchema) },
                  },
                },
              }
            : undefined,

        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: buildResponseSchema(responseSchema),
              },
            },
          },
          400: { description: "Bad request, invalid parameters" },
          500: { description: "Internal server error" },
        },
      },
    },
  };
}


/*
Explanation of this function is as follows:
- this returns a documentation object of our API endpoint
which is used to generate the swagger doc

parameters are:
path,
method,
summary,
description,
tags,
parameters = [],
requestBodySchema = {},
responseSchema = {},

- path means the path of the API endpoint
- method means the method of the API endpoint
- summary means the short explanation of the API endpoint 
- description means the detailed explanation of the API endpoint

- tags define the category of the API endpoint.
- These tags help organize API documentation by grouping related endpoints into specific modules.
- The value of tags should be an array of strings. If a single tag is provided as a string, it is automatically converted into an array.


- parameters is an array of objects, where each object defines a parameter used in the API request.
    - Each object contains the following keys:
        - name: name of the parameter
        - in: The location of the parameter in the request (path, query, header, cookie).
        - required: A boolean indicating whether the parameter is mandatory (true or false).
        - type: The data type of the parameter (string, integer, boolean, array, etc.).
        - example: An example value for the parameter.
        - description: A brief explanation of the parameter's purpose.
    - If no parameters are provided, an empty array ([]) is used as the default value.

- requestBodySchema is an object that defines the schema for the request body. It follows these rules:
    - Each key represents a parameter name in the request body.
    - Each value is an object describing the parameter, containing:
        - type: The data type of the parameter (e.g., string, integer, boolean, array, object).
        - example: A sample value demonstrating the expected input format.
    - If no schema is provided, an empty object {} is used by default.

  request object possibilities handled:
    - normal objects 
    - array of objects 
    - premimitive types

- responseSchema is an object which contains the schema of the response body
    - if nothing is given then empty object is passed

  response object possibilities handled:
    
  responseSchema: {
  data: {}   // Object with properties (JSON)
       | []  // Array of objects or primitives
       | ""  // String response
       | 123 // Number response
       | true // Boolean response
       | null // Explicit null response
  }

*/