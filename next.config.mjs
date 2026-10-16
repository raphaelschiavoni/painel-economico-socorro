/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exportação estática: o painel vira uma pasta de arquivos, publicável em
  // qualquer hospedagem (inclusive um servidor interno da prefeitura).
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
