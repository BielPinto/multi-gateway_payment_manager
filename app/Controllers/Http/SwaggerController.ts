import HttpContext from '@ioc:Adonis/Core/HttpContext'
import { openApiSpec } from 'Config/openapi'

export default class SwaggerController {
  /**
   * GET /openapi.json — especificação OpenAPI 3.0 em JSON.
   */
  spec(ctx: InstanceType<typeof HttpContext>) {
    return ctx.response.header('Content-Type', 'application/json').send(JSON.stringify(openApiSpec, null, 2))
  }

  /**
   * GET /docs — Swagger UI (HTML) que consome /openapi.json.
   */
  ui(ctx: InstanceType<typeof HttpContext>) {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Gateway Payment Manager — API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: window.location.origin + '/openapi.json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`
    return ctx.response.header('Content-Type', 'text/html; charset=utf-8').send(html)
  }
}
