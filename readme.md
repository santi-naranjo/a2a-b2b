# Agente Comprador B2B - Frontend

Una aplicación web moderna para interactuar con un agente comprador B2B inteligente que obtiene cotizaciones de múltiples proveedores.

## 🚀 Características

- **Chat Inteligente**: Interfaz de chat moderna para solicitar cotizaciones
- **Procesamiento de Lenguaje Natural**: El agente entiende solicitudes en lenguaje natural
- **Comparación de Proveedores**: Visualización detallada de ofertas de múltiples proveedores
- **Recomendaciones Inteligentes**: El agente selecciona la mejor opción basada en múltiples criterios
- **UI Moderna**: Diseño responsive con shadcn/ui y Tailwind CSS

## 🛠️ Tecnologías

- **Next.js 14** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de CSS
- **shadcn/ui** - Componentes de UI modernos
- **Lucide React** - Iconos
- **n8n** - Backend de automatización

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd b2b-chat-frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 🎯 Uso

### Solicitar Cotizaciones

1. **Escribe tu solicitud** en lenguaje natural en el campo de texto
2. **Ejemplos de solicitudes**:
   - "Necesito 100 zapatos Adidas entregados en Miami urgentemente"
   - "Cotización para 50 laptops Dell con entrega en Bogotá en 2 semanas"
   - "Busco 200 camisetas Nike para entrega en Madrid con urgencia normal"

### Ver Resultados

1. **Resumen**: El agente te mostrará un resumen de la cotización
2. **Detalles Completos**: Haz clic en "Ver detalles completos" para ver:
   - Solicitud estructurada
   - Comparación de proveedores
   - Recomendación del agente
   - Análisis detallado

## 🔧 Configuración

### URL del Webhook

La aplicación está configurada para usar el webhook de n8n. Si necesitas cambiar la URL:

1. Edita `src/services/api.ts`
2. Actualiza la constante `N8N_WEBHOOK_URL`

```typescript
const N8N_WEBHOOK_URL = 'tu-nueva-url-del-webhook';
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Páginas de Next.js
├── components/             # Componentes React
│   ├── ui/                # Componentes de shadcn/ui
│   ├── ChatInterface.tsx  # Interfaz principal del chat
│   ├── QuoteResults.tsx   # Visualización de resultados
│   ├── VendorResponseCard.tsx # Tarjeta de respuesta de proveedor
│   └── StructuredRequestCard.tsx # Tarjeta de solicitud estructurada
├── services/              # Servicios de API
│   └── api.ts            # Servicio para comunicación con n8n
├── types/                 # Tipos TypeScript
│   └── chat.ts           # Interfaces del chat
└── lib/                   # Utilidades
    └── utils.ts          # Funciones de utilidad
```

## 🔌 Integración con n8n

La aplicación se integra con un flujo de n8n que incluye:

- **Webhook Trigger**: Recibe solicitudes del frontend
- **AI Agent**: Procesa solicitudes con OpenAI GPT-4
- **Vendor Tools**: Conecta con múltiples proveedores
- **Response Node**: Devuelve resultados al frontend

### Formato de Datos

**Entrada** (desde el frontend):
```json
{
  "chatInput": "Necesito 100 zapatos Adidas entregados en Miami urgentemente"
}
```

**Salida** (hacia el frontend):
```json
{
  "structured_request": {
    "product": "zapatos Adidas",
    "quantity": 100,
    "delivery_location": "Miami",
    "urgency": "high",
    "notes": "entrega urgente"
  },
  "vendor_responses": [...],
  "recommendation": {
    "selected_vendor": "Vendor1",
    "reasoning": "...",
    "trade_offs": "..."
  },
  "summary": "Resumen de la cotización..."
}
```

## 🎨 Personalización

### Temas y Colores

Los colores y estilos se pueden personalizar editando:

- `src/app/globals.css` - Variables CSS globales
- `tailwind.config.js` - Configuración de Tailwind
- `components.json` - Configuración de shadcn/ui

### Componentes

Todos los componentes están en `src/components/` y pueden ser modificados según tus necesidades.

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno si es necesario
3. Despliega automáticamente

### Otros Proveedores

La aplicación se puede desplegar en cualquier proveedor que soporte Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de n8n
2. Verifica que el webhook esté funcionando correctamente
3. Revisa los logs del navegador para errores
4. Abre un issue en el repositorio

## 🔮 Próximas Características

- [ ] Historial de conversaciones
- [ ] Exportación de cotizaciones a PDF
- [ ] Notificaciones en tiempo real
- [ ] Dashboard de análisis
- [ ] Integración con sistemas ERP
- [ ] Autenticación de usuarios
