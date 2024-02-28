/**
 * Estas declaraciones le dicen a TypeScript que permitimos la importación de imágenes, p.
 *```
				<script idioma='ts'>
					importar Successkid desde 'images/successkid.jpg';
				</script>

					<img src="{successkid}">
```
 */
declare module "*.gif" {
  const value: string;
  export = value;
}

declare module "*.jpg" {
  const value: string;
  export = value;
}

declare module "*.jpeg" {
  const value: string;
  export = value;
}

declare module "*.png" {
  const value: string;
  export = value;
}

declare module "*.svg" {
  const value: string;
  export = value;
}

declare module "*.webp" {
  const value: string;
  export = value;
}
