# 🧬 Mutation Testing Guide

Mutation testing es una técnica avanzada de testing que evalúa la calidad de nuestros tests introduciendo pequeños cambios (mutaciones) en el código fuente y verificando si nuestros tests detectan estos cambios.

## 📋 Índice

- [🧬 ¿Qué es Mutation Testing?](#-qué-es-mutation-testing)
- [🎯 Objetivos y Beneficios](#-objetivos-y-beneficios)
- [⚡ Configuración y Uso](#-configuración-y-uso)
- [📊 Interpretación de Resultados](#-interpretación-de-resultados)
- [🛠️ Mejores Prácticas](#-mejores-prácticas)
- [🔧 Configuraciones Avanzadas](#-configuraciones-avanzadas)

## 🧬 ¿Qué es Mutation Testing?

Mutation testing introduce **mutaciones** (pequeños cambios) en el código fuente para verificar si nuestros tests pueden detectarlos. Si un test no falla cuando el código está mutado, significa que ese test no está validando correctamente esa parte del código.

### Ejemplo de Mutaciones

**Código Original:**
```typescript
function calculateTotal(price: number, tax: number): number {
  return price + (price * tax);
}
```

**Mutaciones Posibles:**
```typescript
// Mutación 1: Cambio de operador
function calculateTotal(price: number, tax: number): number {
  return price - (price * tax); // + cambiado a -
}

// Mutación 2: Cambio de valor literal
function calculateTotal(price: number, tax: number): number {
  return price + (price * 0); // tax cambiado a 0
}

// Mutación 3: Cambio de condición
function calculateTotal(price: number, tax: number): number {
  return price + (price / tax); // * cambiado a /
}
```

## 🎯 Objetivos y Beneficios

### ✅ Beneficios

- **Calidad de Tests**: Identifica tests débiles o faltantes
- **Confianza**: Aumenta la confianza en la suite de tests
- **Detección de Code Smells**: Encuentra código que no está siendo testado
- **Mejora de Cobertura**: Va más allá de la cobertura de líneas

### 📊 Métricas

- **Mutation Score**: Porcentaje de mutaciones detectadas por tests
- **Killed Mutants**: Mutaciones detectadas (tests fallaron)
- **Survived Mutants**: Mutaciones no detectadas (tests pasaron)
- **Equivalent Mutants**: Mutaciones que no cambian el comportamiento

## ⚡ Configuración y Uso

### 🚀 Instalación

Las dependencias ya están instaladas en el proyecto:

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner @stryker-mutator/typescript-checker
```

### 🎮 Comandos Disponibles

```bash
# Mutation testing completo
npm run test:mutation

# Testing rápido (solo componentes)
npm run test:mutation:quick

# Testing crítico (utils y servicios)
npm run test:mutation:critical

# Con reporte automático
npm run test:mutation:report

# Suite completa incluyendo mutation testing
npm run test:full
```

### 📁 Configuraciones Disponibles

| Archivo | Propósito | Uso |
|---------|-----------|-----|
| `stryker.config.mjs` | Configuración general | `npm run test:mutation` |
| `stryker.components.config.mjs` | Solo componentes React | `stryker run --configFile stryker.components.config.mjs` |
| `stryker.utils.config.mjs` | Utils y lógica de negocio | `stryker run --configFile stryker.utils.config.mjs` |

### 🎯 Ejemplo de Ejecución

```bash
# 1. Ejecutar mutation testing completo
npm run test:mutation

# 2. Ver progreso en tiempo real
# ✅ Initial test run succeeded. 42 tests passed.
# ✨ 127 mutant(s) generated
# 🎯 Starting mutation testing...
# ✅ 89 killed (70.1%)
# 🗿 12 survived (9.4%)
# ⏰ 26 timeout (20.5%)

# 3. Ver reporte detallado
open reports/mutation/mutation-report.html
```

## 📊 Interpretación de Resultados

### 🏆 Mutation Score

| Score | Calidad | Acción Requerida |
|-------|---------|------------------|
| 90-100% | Excelente | Mantener calidad |
| 80-89% | Buena | Mejorar tests débiles |
| 70-79% | Aceptable | Revisar casos edge |
| 60-69% | Baja | Añadir tests importantes |
| <60% | Crítica | Refactor completo de tests |

### 🔍 Tipos de Resultados

#### ✅ **Killed Mutants** (Deseado)
```
✅ Mutant killed by test: validateEmail.test.ts
   - Original: if (email.length > 0)
   - Mutant:   if (email.length >= 0)
   - Test failed: ✅ Expected false, received true
```

#### 🗿 **Survived Mutants** (Problemas)
```
🗿 Mutant survived: validatePrice.test.ts
   - Original: if (price > 0)
   - Mutant:   if (price >= 0)
   - All tests passed: ❌ Missing test for price = 0
```

#### ⏰ **Timeout Mutants**
```
⏰ Mutant timeout: calculateDiscount.ts
   - Possibly infinite loop or very slow execution
   - Consider optimizing code or increasing timeout
```

#### 🔄 **Equivalent Mutants**
```
🔄 Equivalent mutant (ignore):
   - Original: const result = value + 0;
   - Mutant:   const result = value - 0;
   - Both have same behavior
```

## 🛠️ Mejores Prácticas

### ✅ Qué Hacer

1. **Enfocarse en Lógica de Negocio**
   ```bash
   # Priorizar utils y services
   npm run test:mutation:critical
   ```

2. **Ejecutar Incrementalmente**
   ```bash
   # Solo archivos modificados
   stryker run --incremental
   ```

3. **Analizar Survived Mutants**
   ```typescript
   // ❌ Test débil
   test('should validate positive numbers', () => {
     expect(validatePrice(100)).toBe(true);
     // Falta: expect(validatePrice(0)).toBe(false);
   });

   // ✅ Test robusto
   test('should validate positive numbers', () => {
     expect(validatePrice(100)).toBe(true);
     expect(validatePrice(0.01)).toBe(true);
     expect(validatePrice(0)).toBe(false);
     expect(validatePrice(-10)).toBe(false);
   });
   ```

4. **Usar Configuraciones Específicas**
   ```bash
   # Para desarrollo rápido
   stryker run --mutate src/utils/newFeature.ts --concurrency 2

   # Para CI/CD
   stryker run --incremental --concurrency 4
   ```

### ❌ Qué Evitar

1. **No Mutate Everything**
   ```typescript
   // ❌ Incluir archivos triviales
   mutate: ['**/*.ts'] // Muy amplio

   // ✅ Ser específico
   mutate: [
     'src/utils/**/*.ts',
     'src/services/**/*.ts',
     '!**/*.test.*'
   ]
   ```

2. **No Ignorar Survived Mutants**
   ```typescript
   // ❌ Ignorar el problema
   // "El mutation score está en 60%, está bien"

   // ✅ Investigar y mejorar
   // Analizar cada survived mutant y añadir tests
   ```

3. **No Usar Solo en CI**
   ```bash
   # ❌ Solo en pipeline
   # Los desarrolladores no ven los problemas a tiempo

   # ✅ Usar en desarrollo
   npm run test:mutation:quick # Durante desarrollo
   ```

## 🔧 Configuraciones Avanzadas

### ⚙️ Configuración para Diferentes Escenarios

#### 🏃‍♂️ **Desarrollo Rápido**
```javascript
// stryker.dev.config.mjs
export default defineConfig({
  mutate: ['src/utils/currentFeature.ts'],
  concurrency: 2,
  timeoutMS: 20000,
  thresholds: { break: 40 }
});
```

#### 🏭 **Producción/CI**
```javascript
// stryker.ci.config.mjs
export default defineConfig({
  mutate: ['src/**/*.ts', '!**/*.test.*'],
  concurrency: 4,
  incremental: true,
  thresholds: { 
    high: 90, 
    low: 75, 
    break: 65 
  }
});
```

#### 🧪 **Audit Completo**
```javascript
// stryker.audit.config.mjs
export default defineConfig({
  mutate: ['src/**/*.ts'],
  coverageAnalysis: 'perTest',
  concurrency: 1, // Máxima precisión
  thresholds: { 
    high: 95, 
    low: 85, 
    break: 75 
  }
});
```

### 🎯 Configuración de Mutaciones

#### Mutaciones Incluidas por Defecto
```javascript
// Operadores aritméticos: +, -, *, /, %
// Operadores de comparación: ==, !=, <, >, <=, >=
// Operadores lógicos: &&, ||
// Literales: true/false, números, strings
// Condicionales: if/else
```

#### Excluir Mutaciones Específicas
```javascript
mutator: {
  excludedMutations: [
    'StringLiteral',    // Cambios en strings
    'BooleanLiteral',   // true/false
    'ArrayDeclaration', // Arrays vacíos
    'ObjectLiteral'     // Objetos vacíos
  ]
}
```

### 📊 Reportes Personalizados

#### HTML Report
```javascript
htmlReporter: {
  baseDir: 'reports/mutation',
  fileName: 'index.html'
}
```

#### JSON Report para CI
```javascript
jsonReporter: {
  fileName: 'reports/mutation/results.json'
}
```

#### Dashboard Integration
```javascript
// Integración con SonarQube
reporters: ['json', 'sonarqube']
```

## 🚀 Integración con CI/CD

### GitHub Actions Integration

```yaml
# En .github/workflows/ci-cd-optimized.yml
mutation-testing:
  name: 🧬 Mutation Testing
  runs-on: ubuntu-latest
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  
  steps:
  - name: Run Mutation Testing
    run: |
      npm run test:mutation:critical
      
  - name: Upload Mutation Report
    uses: actions/upload-artifact@v4
    with:
      name: mutation-report
      path: reports/mutation/
      
  - name: Comment PR with Results
    if: github.event_name == 'pull_request'
    uses: actions/github-script@v6
    with:
      script: |
        const fs = require('fs');
        const report = JSON.parse(fs.readFileSync('reports/mutation/mutation-report.json'));
        const score = report.mutationScore;
        
        github.rest.issues.createComment({
          issue_number: context.issue.number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: `🧬 **Mutation Testing Results**\n\nMutation Score: ${score}%\n\n${score >= 80 ? '✅ Great test quality!' : '⚠️  Consider improving test coverage'}`
        });
```

### Pre-commit Hook
```bash
# .husky/pre-commit
#!/bin/sh
npm run test:mutation:quick
MUTATION_SCORE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('reports/mutation/mutation-report.json')).mutationScore)")

if [ "$MUTATION_SCORE" -lt 70 ]; then
  echo "❌ Mutation score too low: $MUTATION_SCORE%"
  exit 1
fi
```

## 📈 Mejorando el Mutation Score

### 🔍 Análisis de Survived Mutants

1. **Identificar Patterns**
   ```bash
   # Filtrar survived mutants por archivo
   cat reports/mutation/mutation-report.json | jq '.files[].mutants[] | select(.status == "Survived")'
   ```

2. **Añadir Tests Específicos**
   ```typescript
   // Survived Mutant: price > 0 → price >= 0
   
   // ❌ Test original (no detecta mutant)
   test('validates positive price', () => {
     expect(validatePrice(100)).toBe(true);
   });
   
   // ✅ Test mejorado (detecta mutant)
   test('validates positive price', () => {
     expect(validatePrice(100)).toBe(true);
     expect(validatePrice(0.01)).toBe(true);
     expect(validatePrice(0)).toBe(false);     // ← Detecta >= 0 mutant
   });
   ```

3. **Casos Edge Específicos**
   ```typescript
   // Cubrir boundary conditions
   describe('boundary conditions', () => {
     test('zero values', () => { /* ... */ });
     test('negative values', () => { /* ... */ });
     test('maximum values', () => { /* ... */ });
     test('null/undefined', () => { /* ... */ });
   });
   ```

## 📚 Recursos Adicionales

### 📖 Documentación
- [Stryker Mutator Docs](https://stryker-mutator.io/)
- [Mutation Testing Patterns](https://stryker-mutator.io/docs/mutation-testing-elements/test-runner/)

### 🛠️ Herramientas
- [Stryker Dashboard](https://dashboard.stryker-mutator.io/)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=stryker-mutator.stryker-runner)

### 📊 Métricas Industry Standard
- **Google**: 75-80% mutation score
- **Netflix**: 80-85% mutation score  
- **Spotify**: 70-75% mutation score

---

## 🎯 Conclusión

Mutation testing es una herramienta poderosa para validar la calidad de nuestros tests. Úsalo estratégicamente:

1. **🎯 Enfócate en lógica crítica** - Utils, services, business logic
2. **⚡ Ejecuta incrementalmente** - Solo cambios recientes en desarrollo
3. **📊 Monitorea métricas** - Mantén >75% mutation score
4. **🔄 Mejora continuamente** - Analiza survived mutants regularmente

> 💡 **Tip**: Mutation testing no reemplaza otros tipos de testing, los complementa para garantizar máxima calidad.

---

<div align="center">

**🧬 Mutation Testing configurado para máxima efectividad**

_Calidad de tests garantizada para Olivia Gold_

</div>