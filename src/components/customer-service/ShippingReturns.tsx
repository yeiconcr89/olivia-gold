import React from 'react';

const ShippingReturns: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Envíos y Devoluciones</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-medium mb-4">Política de Envíos</h2>
          <div className="prose prose-lg">
            <h3 className="text-xl font-medium mb-3">Tiempos de Entrega</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Bogotá: 1-2 días hábiles</li>
              <li>Ciudades principales: 2-3 días hábiles</li>
              <li>Resto del país: 3-5 días hábiles</li>
            </ul>

            <h3 className="text-xl font-medium mt-4 mb-3">Costos de Envío</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Envío gratis en compras superiores a $500.000</li>
              <li>Bogotá: $12.000</li>
              <li>Ciudades principales: $15.000</li>
              <li>Resto del país: $18.000</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-medium mb-4">Política de Devoluciones</h2>
          <div className="prose prose-lg">
            <p>Aceptamos devoluciones dentro de los primeros 30 días después de la compra.</p>
            
            <h3 className="text-xl font-medium mt-4 mb-3">Requisitos</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>El producto debe estar en su estado original</li>
              <li>Debe incluir el empaque original</li>
              <li>Debe presentar la factura de compra</li>
              <li>El producto no debe mostrar señales de uso</li>
            </ul>

            <h3 className="text-xl font-medium mt-4 mb-3">Proceso de Devolución</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Contacta a nuestro servicio al cliente</li>
              <li>Recibe la autorización de devolución</li>
              <li>Envía el producto a nuestra dirección</li>
              <li>Recibirás el reembolso en 5-7 días hábiles</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-medium mb-4">Seguimiento de Pedidos</h2>
          <div className="prose prose-lg">
            <p>Para realizar seguimiento a tu pedido:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Ingresa a tu cuenta</li>
              <li>Ve a "Mis Pedidos"</li>
              <li>Selecciona el pedido que deseas rastrear</li>
              <li>Haz clic en "Seguimiento"</li>
            </ol>
          </div>
        </section>

        <section className="bg-gray-50 p-6 rounded-lg mt-8">
          <h2 className="text-2xl font-medium mb-4">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">¿Cuánto tiempo tarda el reembolso?</h3>
              <p>Los reembolsos se procesan en 5-7 días hábiles después de recibir el producto devuelto.</p>
            </div>
            <div>
              <h3 className="font-medium">¿Puedo cambiar la dirección de envío?</h3>
              <p>Sí, puedes modificar la dirección antes de que el pedido sea despachado.</p>
            </div>
            <div>
              <h3 className="font-medium">¿Realizan envíos internacionales?</h3>
              <p>Por el momento solo realizamos envíos dentro de Colombia.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShippingReturns;
