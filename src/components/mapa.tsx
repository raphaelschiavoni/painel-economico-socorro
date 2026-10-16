'use client';

import { useMemo, useState } from 'react';
import { malha } from '@/lib/dados';
import { reais, SEM_DADO } from '@/lib/formato';

type Anel = [number, number][];

/** Normaliza Polygon e MultiPolygon para uma lista única de anéis. */
function aneis(geometria: { type: string; coordinates: unknown }): Anel[] {
  if (geometria.type === 'Polygon') return geometria.coordinates as Anel[];
  if (geometria.type === 'MultiPolygon') {
    return (geometria.coordinates as Anel[][]).flat();
  }
  return [];
}

export function MapaCircuito({
  valores,
  rotuloValor,
}: {
  /** Valor por código IBGE que colore o mapa (magnitude contínua). */
  valores: Record<string, number | null>;
  rotuloValor: string;
}) {
  const [ativo, setAtivo] = useState<string | null>(null);

  const { municipios, caixa } = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const municipios = malha.features.map((f) => {
      const listaAneis = aneis(f.geometry);
      for (const anel of listaAneis) {
        for (const [x, y] of anel) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
      return { ...f.properties, aneis: listaAneis };
    });

    return { municipios, caixa: { minX, minY, maxX, maxY } };
  }, []);

  const largura = 640;
  // Compensa a convergência dos meridianos na latitude do circuito (~22,7° S).
  const fatorLatitude = Math.cos((((caixa.minY + caixa.maxY) / 2) * Math.PI) / 180);
  const escala = largura / ((caixa.maxX - caixa.minX) * fatorLatitude);
  const altura = (caixa.maxY - caixa.minY) * escala;

  const projetar = ([x, y]: [number, number]) => [
    (x - caixa.minX) * fatorLatitude * escala,
    (caixa.maxY - y) * escala,
  ];

  const caminho = (listaAneis: Anel[]) =>
    listaAneis
      .map(
        (anel) =>
          anel
            .map((ponto, i) => {
              const [px, py] = projetar(ponto);
              return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
            })
            .join(' ') + ' Z',
      )
      .join(' ');

  const presentes = Object.values(valores).filter((v): v is number => v != null);
  const min = Math.min(...presentes);
  const max = Math.max(...presentes);

  // Rampa sequencial de um matiz só: claro = menor magnitude, escuro = maior.
  const degraus = ['var(--seq-100)', 'var(--seq-250)', 'var(--seq-400)', 'var(--seq-550)', 'var(--seq-700)'];
  const corDe = (valor: number | null) => {
    if (valor == null) return 'var(--superficie-2)';
    const posicao = max === min ? 0 : (valor - min) / (max - min);
    return degraus[Math.min(degraus.length - 1, Math.floor(posicao * degraus.length))];
  };

  const ativoDados = municipios.find((m) => m.codigo === ativo);

  return (
    <div>
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Mapa do Circuito das Águas Paulista colorido por ${rotuloValor}. Socorro está destacado.`}
      >
        {municipios.map((m) => {
          const selecionado = ativo === m.codigo;
          return (
            <path
              key={m.codigo}
              d={caminho(m.aneis)}
              fill={corDe(valores[m.codigo] ?? null)}
              stroke={m.foco ? 'var(--serie-2)' : 'var(--superficie)'}
              strokeWidth={m.foco ? 2.5 : 1}
              opacity={ativo && !selecionado ? 0.75 : 1}
              tabIndex={0}
              role="button"
              aria-label={`${m.nome}: ${valores[m.codigo] != null ? reais(valores[m.codigo]) : SEM_DADO}`}
              onMouseEnter={() => setAtivo(m.codigo)}
              onMouseLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(m.codigo)}
              onBlur={() => setAtivo(null)}
              className="foco-visivel cursor-pointer outline-none"
            />
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--tinta-3)' }}>
          <span>{rotuloValor}</span>
          <span className="tabular">{reais(min)}</span>
          <span className="flex h-2.5 overflow-hidden rounded-sm" aria-hidden>
            {degraus.map((d) => (
              <span key={d} className="h-full w-6" style={{ background: d }} />
            ))}
          </span>
          <span className="tabular">{reais(max)}</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--tinta-2)' }}>
          {ativoDados ? (
            <>
              <span className="font-semibold" style={{ color: 'var(--tinta)' }}>
                {ativoDados.nome}
              </span>{' '}
              <span className="tabular">
                {valores[ativoDados.codigo] != null ? reais(valores[ativoDados.codigo]) : SEM_DADO}
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--tinta-3)' }}>
              Contorno laranja: Socorro. Passe o cursor sobre um município.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
