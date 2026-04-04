// Next.js exige que o arquivo de middleware se chame exatamente "middleware.ts"
// e que a função seja exportada como "middleware".
// O proxy.ts contém toda a lógica — este arquivo apenas o conecta ao runtime.
export { proxy as middleware, config } from './proxy'
