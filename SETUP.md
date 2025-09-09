# Configuración del Proyecto A2A-B2B

## Configuración de Variables de Entorno

### 1. Crear archivo `.env.local`

En la raíz del proyecto, crea un archivo llamado `.env.local` con el siguiente contenido:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=tu_api_key_de_openai_aqui

# N8N Webhook URL (si es necesario)
N8N_WEBHOOK_URL=https://vtex.app.n8n.cloud/webhook/b8121cae-31aa-4192-b0f2-5373452bc0e2

# Environment
NODE_ENV=development
```

### 2. Obtener API Key de OpenAI

1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Inicia sesión o crea una cuenta
3. Haz clic en "Create new secret key"
4. Copia la API key generada
5. Pégala en el archivo `.env.local` reemplazando `tu_api_key_de_openai_aqui`

### 3. Verificar configuración

El archivo `.env.local` debe estar en la raíz del proyecto y NO debe ser commitado al repositorio (ya está en `.gitignore`).

### 4. Reiniciar el servidor

Después de crear el archivo `.env.local`, reinicia el servidor de desarrollo:

```bash
npm run dev
```

## Estructura de Archivos de Entorno

- `.env.local` - Variables locales (NO se commitea)
- `.env.example` - Ejemplo de configuración (SÍ se commitea)
- `.env` - Variables por defecto (NO se commitea)

## Seguridad

✅ **Correcto**: Usar `OPENAI_API_KEY` (sin `NEXT_PUBLIC_`)
❌ **Incorrecto**: Usar `NEXT_PUBLIC_OPENAI_API_KEY` (expone la key en el cliente)

## Troubleshooting

### Error: "OpenAI API key not configured"
- Verifica que el archivo `.env.local` existe
- Verifica que la variable se llama `OPENAI_API_KEY` (no `NEXT_PUBLIC_OPENAI_API_KEY`)
- Reinicia el servidor después de crear/modificar el archivo

### Error: "API error: 500"
- Verifica que la API key es válida
- Verifica que tienes créditos en tu cuenta de OpenAI
- Revisa los logs del servidor para más detalles
