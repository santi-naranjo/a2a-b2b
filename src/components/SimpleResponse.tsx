import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

interface SimpleResponseProps {
  content: string;
}

export function SimpleResponse({ content }: SimpleResponseProps) {
  // Detectar si es un mensaje pidiendo más información
  const isRequestingMoreInfo = content.toLowerCase().includes('incomplete') || 
                              content.toLowerCase().includes('more information') ||
                              content.toLowerCase().includes('please provide') ||
                              content.toLowerCase().includes('could you please');

  // Extraer información clave del texto
  const extractVendorInfo = (text: string) => {
    const vendorMatch = text.match(/Vendor\d+/i);
    const priceMatch = text.match(/\$[\d,]+/g);
    const discountMatch = text.match(/(\d+)%/g);
    
    return {
      vendor: vendorMatch ? vendorMatch[0] : null,
      prices: priceMatch || [],
      discounts: discountMatch || []
    };
  };

  const info = extractVendorInfo(content);

  return (
    <Card className={`${isRequestingMoreInfo ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200' : 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          {isRequestingMoreInfo ? (
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          <CardTitle className={`text-lg font-semibold ${isRequestingMoreInfo ? 'text-orange-900' : 'text-blue-900'}`}>
            {isRequestingMoreInfo ? 'Información Requerida' : 'Recomendación del Agente'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información extraída - solo mostrar si no es un mensaje pidiendo más información */}
        {!isRequestingMoreInfo && info.vendor && (
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-green-800">
                Proveedor Recomendado: {info.vendor}
              </h3>
              <Badge className="bg-green-600">Mejor Opción</Badge>
            </div>
            
            {info.prices.length > 0 && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Precios encontrados:</span>
                  <span className="font-semibold text-green-600">
                    {info.prices.join(', ')}
                  </span>
                </div>
              </div>
            )}
            
            {info.discounts.length > 0 && (
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-gray-600">Descuentos:</span>
                <span className="font-semibold text-orange-600">
                  {info.discounts.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Contenido completo */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-800 mb-2">
            {isRequestingMoreInfo ? 'Mensaje del Agente:' : 'Análisis Completo:'}
          </h4>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {content}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 