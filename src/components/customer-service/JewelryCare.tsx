import React from 'react';

const JewelryCare: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Cuidado de Joyas</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-medium mb-4">Cuidados Básicos</h2>
          <div className="prose prose-lg">
            <ul className="list-disc pl-5 space-y-2">
              <li>Limpia tus joyas regularmente con un paño suave</li>
              <li>Evita el contacto con productos químicos, perfumes y cremas</li>
              <li>Guarda las piezas por separado para evitar rayones</li>
              <li>Quítate las joyas antes de nadar o hacer ejercicio</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-medium mb-4">Limpieza por Tipo de Material</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-3">Oro</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Usa agua tibia con jabón suave</li>
                <li>Frota suavemente con un cepillo suave</li>
                <li>Enjuaga bien y seca con un paño suave</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-3">Plata</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Utiliza un limpiador específico para plata</li>
                <li>Guarda en bolsas antihumedad</li>
                <li>Evita la exposición al aire para prevenir el óxido</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-medium mb-4">Almacenamiento</h2>
          <div className="prose prose-lg">
            <p>Para mantener tus joyas en perfecto estado:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Guarda cada pieza en su caja o bolsa individual</li>
              <li>Mantén las joyas en un lugar fresco y seco</li>
              <li>Utiliza bolsitas antihumedad en tu joyero</li>
              <li>Evita la exposición directa a la luz solar</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-medium mb-4">Mantenimiento Profesional</h2>
          <div className="prose prose-lg">
            <p>Recomendamos un mantenimiento profesional:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Revisión anual de engastes y cierres</li>
              <li>Limpieza profesional cada 6-12 meses</li>
              <li>Pulido cuando sea necesario</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default JewelryCare;
