import fs from 'fs';
import path from 'path';
import babelParser from '@babel/parser';
import traverse from '@babel/traverse';
import { extractSwaggerSchema } from './extractSchemas.js';
import { transformRoutePath } from './utils/transformPath.js';

export function parseRoutes({ routesDir = path.resolve(process.cwd(), 'backend', 'routes'), schemas, responses = {} }) {
  /*
  1. ROUTES_DIR = /Users/hemavardhang/Desktop/anime/way2newsall-alpha_ads_panel-860c90c08eb6/backend/routes
  the ROUTES_DIR is the directory where all the route files are located and extracted using path.resolve
  the ROUTES_DIR is then used to read all the files in the directory
  the ROUTES_DIR is then used to filter the files that end with .route.js
  
  2. routefiles looks like this:
      [
        'ads.route.js',
      'dashboard.route.js',
      'events.route.js',
      'home.route.js',
      'loginHistory.route.js',
      'meetings.route.js',
      'payment.route.js',
      'push.route.js',
      'user.route.js'
    ]
    we are only interested in the files that end with .route.js

  3. modulepaths are path of extracted routefiles path
    eg: /Users/hemavardhang/Desktop/anime/way2newsall-alpha_ads_panel-860c90c08eb6/backend/routes/ads.route.js
  4. read each file using fs.readFileSync and store the content in fileContent
  5. parse the fileContent using babel parser
  6. AST is the abstract syntax tree of the fileContent
  7. prefix is the path of the route file without the .route.js extension
  8. traverse the AST to find the routes
    traverse used to walk through the AST and extract information about route definitions.
    You're walking through every function call in the AST.
     This includes calls like router.get(...), router.post(...), etc.
  9. CallExpression is used to find the routes
  10. callee is the function that is being called
  11. if the callee is a member expression and the object name is router
  12. then we extract the method, path, schema and controller

  callee example : it will be a node which represents the functions called in that file 
  1. router function call looks like this:
  Node {
  type: 'MemberExpression',
  start: 1551,
  end: 1562,
  loc: SourceLocation {
    start: Position { line: 34, column: 0, index: 1551 },
    end: Position { line: 34, column: 11, index: 1562 },
    filename: 'user.route.js',
    identifierName: undefined
  },
  object: Node {
    type: 'Identifier',
    start: 1551,
    end: 1557,
    loc: SourceLocation {
      start: [Position],
      end: [Position],
      filename: 'user.route.js',
      identifierName: 'router'
    },
    name: 'router'
  },
  computed: false,
  property: Node {
    type: 'Identifier',
    start: 1558,
    end: 1562,
    loc: SourceLocation {
      start: [Position],
      end: [Position],
      filename: 'user.route.js',
      identifierName: 'post'
    },
    name: 'post'
  }
}
  2. validation function call looks like this:
  Node {
  type: 'MemberExpression',
  start: 1587,
  end: 1606,
  loc: SourceLocation {
    start: Position { line: 34, column: 36, index: 1587 },
    end: Position { line: 34, column: 55, index: 1606 },
    filename: 'user.route.js',
    identifierName: undefined
  },
  object: Node {
    type: 'Identifier',
    start: 1587,
    end: 1597,
    loc: SourceLocation {
      start: [Position],
      end: [Position],
      filename: 'user.route.js',
      identifierName: 'Validation'
    },
    name: 'Validation'
  },
  computed: false,
  property: Node {
    type: 'Identifier',
    start: 1598,
    end: 1606,
    loc: SourceLocation {
      start: [Position],
      end: [Position],
      filename: 'user.route.js',
      identifierName: 'validate'
    },
    name: 'validate'
  }
}
  3. controller function call looks like this:
  Node {
  type: 'MemberExpression',
  start: 1519,
  end: 1547,
  loc: SourceLocation {
    start: Position { line: 33, column: 84, index: 1519 },
    end: Position { line: 33, column: 112, index: 1547 },
    filename: 'user.route.js',
    identifierName: undefined
  },
  object: Node {
    type: 'Identifier',
    start: 1519,
    end: 1533,
    loc: SourceLocation {
      start: [Position],
      end: [Position],
      filename: 'user.route.js',
      identifierName: 'UserController'
    },
    name: 'UserController'
  },
  computed: false,
  property: Node {
    type: 'Identifier',
    start: 1534,
    end: 1547,
    loc: SourceLocation {
      start: [Position],
      end: [Position],
      filename: 'user.route.js',
      identifierName: 'partnerStatus'
    },
    name: 'partnerStatus'
  }
}
  */
  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.route.js'));
  const allRoutes = [];
  const commonRes = responses['200'] || {};

  routeFiles.forEach((file) => {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const ast = babelParser.parse(content, {
      sourceType: 'module',
      plugins: ['classProperties'],
      sourceFilename: file
    });

    const prefix = '/' + file.replace('.route.js', '');

    traverse.default(ast, {
      CallExpression(pathNode) {
        const callee = pathNode.node.callee;
        if (
          callee.type === 'MemberExpression' &&
          callee.object.name === 'router'
        ) {
          const method = callee.property.name;
          const args = pathNode.node.arguments;
          const routePath = transformRoutePath(args[0]?.value) || '';
          const middlewares = args.slice(1);

          const schemaArg = middlewares.find(arg =>
            arg.type === 'CallExpression' &&
            arg.callee?.object?.name === 'Validation' &&
            arg.callee?.property?.name === 'validate'
          );

          let schema = null;
          if (schemaArg?.arguments?.[0]?.type === 'MemberExpression') {
            const obj = schemaArg.arguments[0];
            schema = `${obj.object?.name}.${obj.property?.name}`;
          }

          const controllerArg = middlewares.find(arg =>
            arg.type === 'MemberExpression' &&
            arg.object?.name?.endsWith('Controller')
          );

          let controller = null;
          if (controllerArg) {
            controller = `${controllerArg.object.name}.${controllerArg.property.name}`;
          }

          const fullPath = prefix === "/dashboard" ? routePath : prefix + routePath;
          let requestBodySchema = {};
          let parameters = [];

          if (schema) {
            const extracted = extractSwaggerSchema({ schemas, schemaString: schema, routePath: prefix });
            requestBodySchema = extracted.requestBodySchema || {};
            parameters = extracted.parameters || [];
          }

          const resObj = responses[fullPath] || {};

          allRoutes.push({
            method,
            path: fullPath,
            schema: schema || 'none',
            controller: controller || 'unknown',
            tags: prefix.replace('/', ''),
            requestBodySchema,
            parameters,
            description: resObj.description || 'No description available',
            responseSchema: { ...commonRes.response, ...resObj.responseData },
            summary: resObj.summary || 'No summary available',
          });
        }
      }
    });
  });

  return allRoutes;
}
