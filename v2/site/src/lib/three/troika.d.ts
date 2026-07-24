/* Ambient declarations for troika-three-text / troika-three-utils, which
   ship no TypeScript types. Only the surface StatementText uses is typed. */

declare module 'troika-three-text' {
  import * as THREE from 'three';

  export class Text extends THREE.Mesh {
    text: string;
    font: string;
    fontSize: number;
    color: THREE.ColorRepresentation;
    anchorX: string | number;
    anchorY: string | number;
    textRenderInfo: { blockBounds: [number, number, number, number] } | null;
    sync(callback?: () => void): void;
    dispose(): void;
    createDerivedMaterial(baseMaterial: THREE.Material): THREE.Material;
  }

  export function preloadFont(
    options: { font: string; characters?: string | string[] },
    callback?: () => void,
  ): void;
}

declare module 'troika-three-utils' {
  import * as THREE from 'three';

  export interface DerivedMaterialOptions {
    chained?: boolean;
    uniforms?: Record<string, { value: unknown }>;
    vertexDefs?: string;
    vertexTransform?: string;
    fragmentDefs?: string;
    fragmentColorTransform?: string;
    customRewriter?: (shaders: {
      vertexShader: string;
      fragmentShader: string;
    }) => { vertexShader: string; fragmentShader: string };
  }

  export function createDerivedMaterial(
    baseMaterial: THREE.Material,
    options: DerivedMaterialOptions,
  ): THREE.Material & { uniforms: Record<string, { value: any }> };
}
