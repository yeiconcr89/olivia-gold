import React from 'react';

const SizeGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Guía de Tallas</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-medium mb-4">Cómo medir tu talla de anillo</h2>
          <div className="prose prose-lg">
            <p>Para encontrar tu talla perfecta de anillo, sigue estos pasos:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Utiliza un anillo que te quede bien</li>
              <li>Mide el diámetro interno del anillo</li>
              <li>Compara la medida con nuestra tabla de tallas</li>
            </ol>
          </div>
          
          <div className="mt-6">
            <h3 className="text-xl font-medium mb-3">Tabla de Conversión de Tallas</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 bg-gray-50">Diámetro (mm)</th>
                    <th className="px-4 py-2 bg-gray-50">Talla EU</th>
                    <th className="px-4 py-2 bg-gray-50">Talla US</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2">15.7</td>
                    <td className="px-4 py-2">49</td>
                    <td className="px-4 py-2">5</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">16.5</td>
                    <td className="px-4 py-2">52</td>
                    <td className="px-4 py-2">6</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">17.3</td>
                    <td className="px-4 py-2">54</td>
                    <td className="px-4 py-2">7</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-medium mb-4">Cómo medir tu talla de pulsera</h2>
          <div className="prose prose-lg">
            <p>Para encontrar tu talla de pulsera perfecta:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Mide la circunferencia de tu muñeca con una cinta métrica</li>
              <li>Añade 1-2 cm para un ajuste cómodo</li>
              <li>Consulta nuestra tabla de tallas de pulsera</li>
            </ol>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-medium mb-4">Consejos adicionales</h2>
          <div className="prose prose-lg">
            <ul className="list-disc pl-5 space-y-2">
              <li>Mide tu dedo al final del día cuando esté en su tamaño natural</li>
              <li>Considera los cambios estacionales que pueden afectar el tamaño de tus dedos</li>
              <li>Si estás entre dos tallas, elige la más grande</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SizeGuide;
