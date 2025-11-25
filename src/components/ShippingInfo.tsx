const ShippingInfo = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-playfair font-bold text-center mb-8">
        Información de Envíos
      </h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gradient-gold p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">🚚 Envío GRATIS</h2>
          <p>En compras superiores a $200.000 en toda Colombia</p>
          <ul className="mt-4 space-y-2">
            <li>• Tiempo de entrega: 2-5 días hábiles</li>
            <li>• Cobertura nacional</li>
            <li>• Rastreo incluido</li>
          </ul>
        </div>
        
        <div className="bg-white border-2 border-gold-200 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">📦 Envío Estándar</h2>
          <p>Para compras menores a $200.000</p>
          <ul className="mt-4 space-y-2">
            <li>• Costo: $15.000</li>
            <li>• Tiempo: 3-7 días hábiles</li>
            <li>• Rastreo incluido</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShippingInfo;