🚀 swagger-autogen-hv

A plug-and-play module to auto-generate Swagger/OpenAPI documentation from route schemas with minimal setup. Perfect for modular Node.js/Express projects that want clean, versioned, and developer-friendly API docs.
✨ Features

    🔧 Automatic Swagger Docs – Generate paths from your Joi or validation schemas

    🧩 Modular & Scalable – Supports large codebases with modular schema organization

    ⚡ Zero-Hardcoding – No manual Swagger writing; just pass your schemas

    🔒 Production-Safe – Toggle Swagger UI with a single config flag

📦 Installation

npm install swagger-autogen-hv

⚙️ Quick Setup

Integrate with your Express server in a few lines:
<pre><code class="language-js">
const { setupSwagger, getOpenApiPaths } = require('swagger-autogen-hv');
const config = require('./config');
const schemas = require('./schemas'); // Your Joi or validation schema files

const documentation = getOpenApiPaths({ schemas }); // 'responses' is optional

setupSwagger(app, { 
  documentation, 
  title: 'Alpha Ads API', 
  serverUrl: `http://localhost:${config.port}`, 
  version: '1.0.0', 
  description: 'API Docs for Alpha Ads', 
  enabled: config.env !== 'production', // Enable only in dev or staging 
});
</code></pre>

📁 Recommended Project Structure
<pre> 
    /backend 
        ├── routes/ 
            ├── moduleName.route.js
            ├── index.js
        ├── schemas/ 
            ├──moduleName.schema.js
            ├──index.js
        ├── server.js 
</pre>

📘 API Reference
getOpenApiPaths({ schemas, responses })

Param	Type	Required	Description 

schemas	Object	✅ Yes	Your route validation schemas

responses	Object	❌ No	Custom Swagger response definitions

setupSwagger(app, options)

Option	Type	Required	Description

app	Object	✅ Yes	Your Express application instance

documentation	Object	✅ Yes	Output from getOpenApiPaths()

title	String	✅ Yes	Title of the Swagger UI

serverUrl	String	✅ Yes	Base URL of your API

version	String	✅ Yes	API version number

description	String	❌ No	Short description of the API

enabled	Boolean	✅ Yes	Toggle Swagger UI (e.g., disable in prod)

✅ Example Output

Swagger UI will be available at:

http://localhost:PORT/api-docs

Only if enabled: true in the setup.
🛡️ Best Practices

    Keep Swagger disabled in production (enabled: config.env !== 'production')

    Use consistent and modular naming in your schemas

    Define examples and descriptions for better auto-generation quality

🪪 License

MIT – Feel free to use, modify, and contribute!
