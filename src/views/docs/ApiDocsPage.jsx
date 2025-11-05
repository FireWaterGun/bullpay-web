import { useEffect } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import './ApiDocsPage.css'

export default function ApiDocsPage() {
  useEffect(() => {
    // Force light mode for Swagger UI
    document.documentElement.style.colorScheme = 'light'
    
    return () => {
      document.documentElement.style.colorScheme = ''
    }
  }, [])

  return (
    <div className="swagger-docs-page">
      <SwaggerUI 
        url="/openapi.json"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
        persistAuthorization={true}
        tryItOutEnabled={true}
        displayRequestDuration={true}
        filter={true}
      />
    </div>
  )
}
