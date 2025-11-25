# Configuración de Cloudinary para Olivia Gold

Este documento explica cómo configurar Cloudinary para el panel de administrador de Olivia Gold.

## ¿Qué es Cloudinary?

Cloudinary es un servicio en la nube que permite almacenar, gestionar, manipular y entregar imágenes y videos para sitios web y aplicaciones. En Olivia Gold, utilizamos Cloudinary para almacenar todas las imágenes de productos, banners y contenido SEO.

## Pasos para configurar Cloudinary

### 1. Crear una cuenta en Cloudinary

1. Ve a [Cloudinary](https://cloudinary.com/) y regístrate para obtener una cuenta gratuita.
2. Una vez registrado, accede al dashboard de Cloudinary.

### 2. Obtener credenciales de API

En el dashboard de Cloudinary, encontrarás las siguientes credenciales que necesitarás:

- **Cloud Name**: El nombre de tu cuenta en Cloudinary
- **API Key**: La clave de API para autenticar solicitudes
- **API Secret**: El secreto de API para autenticar solicitudes

### 3. Configurar variables de entorno

#### Backend (.env)

Edita el archivo `backend/.env` y actualiza las siguientes variables:

```
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

#### Frontend (.env.local)

Edita el archivo `.env.local` y actualiza las siguientes variables:

```
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_API_KEY=tu_api_key
```

### 4. Crear un Upload Preset (opcional)

Si deseas permitir cargas sin firmar desde el frontend:

1. En el dashboard de Cloudinary, ve a "Settings" > "Upload"
2. Desplázate hacia abajo hasta "Upload presets"
3. Haz clic en "Add upload preset"
4. Configura el preset según tus necesidades (modo de firma, carpeta, transformaciones, etc.)
5. Guarda el preset y anota su nombre
6. Actualiza la variable `VITE_CLOUDINARY_UPLOAD_PRESET` en `.env.local` con el nombre del preset

### 5. Verificar la configuración

1. Inicia el backend y el frontend
2. Accede al panel de administrador
3. Ve a la pestaña "Cloudinary"
4. Haz clic en "Probar conexión" para verificar que todo funciona correctamente

## Estructura de carpetas recomendada

Para mantener organizadas tus imágenes en Cloudinary, te recomendamos usar la siguiente estructura de carpetas:

- **products/**: Imágenes de productos
- **seo/**: Imágenes para contenido SEO, blog, etc.
- **banners/**: Banners para el sitio web
- **general/**: Imágenes generales
- **tests/**: Imágenes de prueba (se pueden eliminar periódicamente)

## Optimización de imágenes

Para optimizar el rendimiento y reducir costos:

1. Comprime las imágenes antes de subirlas
2. Utiliza formatos modernos como WebP cuando sea posible
3. Aprovecha las transformaciones de Cloudinary para generar miniaturas y versiones optimizadas
4. Configura el caché adecuadamente para reducir el ancho de banda

## Solución de problemas

Si encuentras problemas con la configuración de Cloudinary:

1. Verifica que las credenciales sean correctas
2. Asegúrate de que tu cuenta de Cloudinary esté activa
3. Revisa los logs del backend para ver errores específicos
4. Prueba a subir una imagen manualmente desde el dashboard de Cloudinary

Para más información, consulta la [documentación oficial de Cloudinary](https://cloudinary.com/documentation).