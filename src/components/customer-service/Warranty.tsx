import React from 'react';

const Warranty: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Garantía</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-medium mb-4">Nuestra Garantía</h2>
          <div className="prose prose-lg">
            <p>Todos nuestros productos cuentan con garantía de 1 año contra defectos de fabricación.</p>
            <p>La garantía cubre:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Defectos en materiales</li>
              <li>Problemas de manufactura</li>
              <li>Desgaste anormal del chapado</li>
              <li>Desprendimiento de piedras</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-medium mb-4">Exclusiones de la Garantía</h2>
          <div className="prose prose-lg">
            <p>La garantía no cubre:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Daños por uso inadecuado</li>
              <li>Desgaste normal por uso</li>
              <li>Daños por accidentes o golpes</li>
              <li>Reparaciones realizadas por terceros</li>
              <li>Daños por exposición a productos químicos</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-medium mb-4">Proceso de Garantía</h2>
          <div className="prose prose-lg">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Contacta a nuestro servicio al cliente</li>
              <li>Describe el problema detalladamente</li>
              <li>Envía fotos del producto</li>
              <li>Recibe instrucciones para el envío</li>
              <li>Evaluación técnica (24-48 horas)</li>
              <li>Reparación o reemplazo según corresponda</li>
            </ol>
          </div>
        </section>

        <section className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-medium mb-4">Documentación Necesaria</h2>
          <div className="prose prose-lg">
            <ul className="list-disc pl-5 space-y-2">
              <li>Factura de compra original</li>
              <li>Certificado de garantía</li>
              <li>Formulario de solicitud de garantía</li>
              <li>Fotos del producto y del defecto</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-medium mb-4">Tiempos de Servicio</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Evaluación</h3>
              <p>24-48 horas hábiles después de recibir el producto</p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-3">Reparación</h3>
              <p>5-10 días hábiles según la complejidad</p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-3">Reemplazo</h3>
              <p>3-5 días hábiles según disponibilidad</p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-3">Envío</h3>
              <p>2-3 días hábiles después de la reparación</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Warranty;
