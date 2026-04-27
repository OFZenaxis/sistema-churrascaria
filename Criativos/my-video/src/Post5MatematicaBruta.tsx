import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  spring,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ══════════════════════════════════════════════════════════════════════
// MATEMÁTICA AUDITADA — nenhum centavo pode variar
// ══════════════════════════════════════════════════════════════════════
const GROSS        = 2985;      // Faturamento bruto
const AFTER_IFOOD  = 2179.05;   // 2985 × (1 − 0.27) = 2179.05 ✓
const SAIU_FEE     = 97;        // Mensalidade fixa
const FINAL        = 2888;      // 2985 − 97 = 2888.00 ✓
const PROFIT_SAVED = 708.95;    // 2888 − 2179.05 = 708.95 ✓

const fmtBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', {
    style:                 'currency',
    currency:              'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

// Easing compartilhado — padrão do projeto (Teaser, Post4)
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// ──────────────────────────────────────────────────────────────────────
// Helpers de entrada: opacity + translateY + blur via spring
// ──────────────────────────────────────────────────────────────────────
const enterStyle = (sp: number, dy = 24, blurPx = 12) => ({
  opacity:   sp,
  transform: `translateY(${dy - sp * dy}px)`,
  filter:    `blur(${Math.max(0, blurPx - sp * blurPx).toFixed(2)}px)`,
});

// ──────────────────────────────────────────────────────────────────────
// FIX BUG 2: MoneyDisplay — isola dígitos em tabular-nums, elimina jitter
//
// Problema: ao mudar cor/filter, o h1 inteiro repintava causando
// deslocamento horizontal de subpixel no "R$".
// Solução: separar o prefixo "R$ " dos dígitos em spans independentes.
// O container com minWidth fixo impede que a mudança de cor do símbolo
// afete o posicionamento dos dígitos.
// ──────────────────────────────────────────────────────────────────────
function MoneyDisplay({
  value,
  color,
  filter = 'none',
  size   = '7.6rem',
}: {
  value:   number;
  color:   string;
  filter?: string;
  size?:   string;
}) {
  const formatted = fmtBRL(value);
  // Captura tudo antes do primeiro dígito (ex: "R$ ") e o restante
  const match  = formatted.match(/^([^\d]*)(.*)$/);
  const prefix = match?.[1] ?? 'R$ '; // "R$ " — nunca muda de comprimento
  const digits = match?.[2] ?? formatted; // "2.985,00" — apenas dígitos e pontuação

  const sharedFont = "'JetBrains Mono', 'Roboto Mono', monospace";

  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'baseline',
        justifyContent: 'center',
        filter,
        // Largura fixa: o container nunca redimensiona por variações de renderização do "R$"
        minWidth:       '660px',
      }}
    >
      {/* Símbolo monetário — span isolado, não-tabular (string fixa, não varia) */}
      <span style={{ fontFamily: sharedFont, fontSize: size, fontWeight: 900, lineHeight: 1, color }}>
        {prefix}
      </span>

      {/* Dígitos APENAS — tabular-nums trava cada dígito em largura idêntica */}
      <span
        className="font-mono tabular-nums tracking-tighter"
        style={{ fontFamily: sharedFont, fontSize: size, fontWeight: 900, lineHeight: 1, color, fontVariantNumeric: 'tabular-nums' }}
      >
        {digits}
      </span>
    </div>
  );
}

export const Post5MatematicaBruta = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ────────────────────────────────────────────────────────────────────
  // ATO 1: O SANGRAMENTO  [0 – 250]
  // ────────────────────────────────────────────────────────────────────

  // Entradas com mola pesada e elegante
  const sp1Logo  = spring({ frame: frame - 0,  fps, config: { mass: 1.5, damping: 20, stiffness: 100 } });
  const sp1Label = spring({ frame: frame - 18, fps, config: { mass: 1.0, damping: 20, stiffness: 100 } });
  const sp1Num   = spring({ frame: frame - 36, fps, config: { mass: 1.2, damping: 20, stiffness: 100 } });
  const sp1Alert = spring({ frame: frame - 90, fps, config: { mass: 1.0, damping: 22, stiffness: 100 } });

  // Queda física: frame 100 → 215 com easing pesado (impacto sentido)
  const dropP = interpolate(frame, [100, 215], [0, 1], {
    easing:            EASE,
    extrapolateLeft:   'clamp',
    extrapolateRight:  'clamp',
  });

  // Trava matemática antes do formatador
  const valAto1: number =
    frame < 100  ? GROSS :
    frame >= 215 ? AFTER_IFOOD :
    dropP * (AFTER_IFOOD - GROSS) + GROSS;

  const isBleeding = frame >= 90 && frame < 250;

  // Respiro ultra-sutil do radial gradient
  const bgDrift = Math.sin(frame / 70) * 6;

  // Ponto de status da sirene (sem neon — apenas pulse no dot)
  const alertDot = isBleeding ? Math.sin((frame - 90) / 7) * 0.35 + 0.65 : 0.65;

  // ────────────────────────────────────────────────────────────────────
  // TRANSIÇÃO: VARREDURA ESMERALDA  [250 – 308]
  // ────────────────────────────────────────────────────────────────────
  const wipeP = interpolate(frame, [250, 308], [0, 1], {
    easing: EASE, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // Bottom-to-top: inset(X% 0 0 0) — X vai de 100 → 0
  const clipBU       = `inset(${(1 - wipeP) * 100}% 0 0 0)`;
  const scannerTop   = (1 - wipeP) * 100; // % do topo

  // ────────────────────────────────────────────────────────────────────
  // ATO 2: A PROVA REAL  [308 – 520]
  // ────────────────────────────────────────────────────────────────────
  const sp2Logo  = spring({ frame: frame - 310, fps, config: { mass: 1.5, damping: 20, stiffness: 100 } });
  const sp2Label = spring({ frame: frame - 326, fps, config: { mass: 1.0, damping: 20, stiffness: 100 } });
  const sp2Num   = spring({ frame: frame - 343, fps, config: { mass: 1.2, damping: 20, stiffness: 100 } });
  const sp2Fixo  = spring({ frame: frame - 366, fps, config: { mass: 1.0, damping: 22, stiffness: 100 } });

  // FIX BUG 1: interpolate com Easing.out(Easing.exp) — matematicamente impossível de overshoot.
  // O spring anterior (mass: 2.2, damping: 26) tinha ζ ≈ 0.87 (underdamped) e descia até
  // R$ 2.887 antes de subir de volta. Bezier e Easing nunca ultrapassam [0,1].
  const valProgress = interpolate(frame, [388, 490], [0, 1], {
    easing:           Easing.out(Easing.exp),
    extrapolateLeft:  'clamp',
    extrapolateRight: 'clamp',
  });
  const valAto2Raw = valProgress * (FINAL - GROSS) + GROSS;

  // TRAVA ABSOLUTA: frame >= 490 → constante FINAL, zero cálculo, zero variação
  const valAto2: number = frame >= 490 ? FINAL : Math.round(valAto2Raw * 100) / 100;

  const sp2Toast = spring({ frame: frame - 435, fps, config: { mass: 1.0, damping: 22, stiffness: 100 } });

  // Saída do Ato 2 em 520 — scale + opacity com mola rápida
  const exitSp  = spring({ frame: frame - 520, fps, config: { mass: 0.8, damping: 22, stiffness: 160 } });
  const exitOp  = frame < 520 ? 1 : Math.max(0, 1 - exitSp);
  const exitScl = frame < 520 ? 1 : Math.max(0.94, 1 - exitSp * 0.06);

  // Grid deriva lentamente
  const gridY = interpolate(frame, [308, 690], [0, 120]);

  // ────────────────────────────────────────────────────────────────────
  // ATO 3: O MANIFESTO  [520 – 690]
  // ────────────────────────────────────────────────────────────────────
  const sp3L1  = spring({ frame: frame - 548, fps, config: { mass: 1.5, damping: 22, stiffness: 80 } });
  const sp3L2  = spring({ frame: frame - 565, fps, config: { mass: 1.5, damping: 22, stiffness: 80 } });
  const sp3Btn = spring({ frame: frame - 592, fps, config: { mass: 1.2, damping: 20, stiffness: 100 } });

  // Glow do botão — Stripe: opacidade máxima 14%
  const btnGlow = frame >= 592 ? Math.sin((frame - 592) / 12) * 0.5 + 0.5 : 0;

  // Cursor piscando: 15 frames por beat (padrão do projeto)
  const cursor = Math.floor(frame / 15) % 2 === 0;

  // ════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════
  return (
    <AbsoluteFill>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800;900&display=swap');
      `}</style>

      {/* ──────────────────────────────────────────────────────────────
          FUNDO DARK — ultra-sutil, sem drama de gradiente
      ────────────────────────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 80% at 50% ${48 + bgDrift * 0.08}%, #0f172a 0%, #020617 100%)`,
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          ATO 1: O SANGRAMENTO
      ══════════════════════════════════════════════════════════════ */}

      {/* Logo — topo, filtro invert para dark */}
      <div
        className="absolute top-14 w-full flex justify-center z-10"
        style={{ opacity: sp1Logo * 0.82, transform: `translateY(${-20 + sp1Logo * 20}px)` }}
      >
        <Img
          src={staticFile('logo-full.png')}
          className="h-[4.5rem] w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>

      {/* Centro Ato 1 */}
      <AbsoluteFill className="flex flex-col items-center justify-center px-20">

        {/* Label */}
        <p
          className="text-slate-500 font-semibold uppercase tracking-[0.22em]"
          style={{ fontSize: '1.35rem', marginBottom: '2rem', ...enterStyle(sp1Label, 16, 10) }}
        >
          Faturamento Bruto
        </p>

        {/* Número principal — MoneyDisplay isola dígitos e elimina jitter */}
        <div style={enterStyle(sp1Num, 22, 0)}>
          <MoneyDisplay
            value={valAto1}
            color={isBleeding ? '#ef4444' : '#f1f5f9'}
            filter={isBleeding
              ? 'drop-shadow(0 2px 8px rgba(239,68,68,0.10))'
              : 'drop-shadow(0 2px 14px rgba(0,0,0,0.30))'}
          />
        </div>

        {/* Alerta — badge limpo, sem neon */}
        {frame >= 90 && (
          <div
            className="flex items-center gap-4 rounded-2xl"
            style={{
              marginTop:   '3rem',
              padding:     '1rem 2rem',
              background:  'rgba(239,68,68,0.07)',
              border:      '1px solid rgba(239,68,68,0.16)',
              ...enterStyle(sp1Alert, 28, 8),
            }}
          >
            <div
              className="w-2 h-2 rounded-full bg-red-500"
              style={{ opacity: alertDot, flexShrink: 0 }}
            />
            <p
              className="text-red-400 font-semibold uppercase tracking-[0.1em]"
              style={{ fontSize: '1.55rem' }}
            >
              TAXAS DE APP (27%) DRENANDO
            </p>
          </div>
        )}
      </AbsoluteFill>

      {/* ══════════════════════════════════════════════════════════════
          TRANSIÇÃO: VARREDURA DE BAIXO PARA CIMA  [250–308]
      ══════════════════════════════════════════════════════════════ */}
      {frame >= 250 && frame <= 314 && (
        <AbsoluteFill className="z-40 overflow-hidden pointer-events-none">
          {/* Halo difuso */}
          <div
            className="absolute w-full"
            style={{
              top:       `${scannerTop}%`,
              height:    '160px',
              transform: 'translateY(-50%)',
              background:
                'linear-gradient(to bottom, transparent, rgba(16,185,129,0.22), transparent)',
              filter:  'blur(22px)',
              opacity: Math.max(0, 1 - wipeP * 0.8),
            }}
          />
          {/* Borda de ataque — escâner limpo */}
          <div
            className="absolute w-full"
            style={{
              top:       `${scannerTop}%`,
              height:    '2px',
              background: 'rgba(52,211,153,0.80)',
              boxShadow:  '0 0 20px 5px rgba(52,211,153,0.25)',
              opacity:   Math.max(0, 1 - wipeP * 1.5),
            }}
          />
        </AbsoluteFill>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ATO 2: A PROVA REAL — LIGHT MODE
          ATO 3: O MANIFESTO (aninhado dentro do mesmo layer stone-50)
      ══════════════════════════════════════════════════════════════ */}
      {frame >= 250 && (
        <AbsoluteFill
          className="z-30 overflow-hidden"
          style={{ clipPath: clipBU, backgroundColor: '#fafaf9' }}
        >
          {/* Grid — padrão do SaaS: rgba(0,0,0,0.03), 40×40 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: [
                'linear-gradient(to right, rgba(0,0,0,0.028) 1px, transparent 1px)',
                'linear-gradient(to bottom, rgba(0,0,0,0.028) 1px, transparent 1px)',
              ].join(', '),
              backgroundSize:     '40px 40px',
              backgroundPosition: `0 ${gridY}px`,
            }}
          />

          {/* Logo — persiste do Ato 2 ao Ato 3 sem saída */}
          <div
            className="absolute top-14 w-full flex justify-center z-40"
            style={{
              opacity:   sp2Logo,
              transform: `translateY(${-20 + sp2Logo * 20}px)`,
            }}
          >
            <Img
              src={staticFile('logo-full.png')}
              className="h-[4.5rem] w-auto drop-shadow-sm"
            />
          </div>

          {/* ────────────────────────────────────────────────────────────
              CONTEÚDO ATO 2 — sai em scale + opacity no frame 520
          ──────────────────────────────────────────────────────────── */}
          <AbsoluteFill
            className="flex flex-col items-center justify-center px-20"
            style={{ opacity: exitOp, transform: `scale(${exitScl})` }}
          >
            {/* Label */}
            <p
              className="text-slate-400 font-semibold uppercase tracking-[0.22em]"
              style={{ fontSize: '1.35rem', marginBottom: '2rem', ...enterStyle(sp2Label, 16, 10) }}
            >
              Com Saiu Delivery
            </p>

            {/* Número principal Ato 2 — MoneyDisplay isola dígitos e elimina jitter */}
            <div style={enterStyle(sp2Num, 22, 0)}>
              <MoneyDisplay
                value={valAto2}
                color="#10b981"
                filter="drop-shadow(0 2px 8px rgba(16,185,129,0.08))"
              />
            </div>

            {/* Tag de custo fixo */}
            {frame >= 366 && (
              <div
                className="flex items-center gap-4 rounded-xl"
                style={{
                  marginTop:   '2.5rem',
                  padding:     '1rem 2rem',
                  background:  '#f1f5f9', // slate-100
                  border:      '1px solid #e2e8f0', // slate-200
                  boxShadow:   '0 1px 4px rgba(0,0,0,0.04)',
                  opacity:     interpolate(sp2Fixo, [0, 0.7], [0, 1], { extrapolateRight: 'clamp' }),
                  transform:   `translateY(${30 - sp2Fixo * 30}px)`,
                }}
              >
                <span
                  className="font-mono tabular-nums font-bold tracking-tight text-slate-700"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
                    fontSize:   '2rem',
                  }}
                >
                  − R$ {SAIU_FEE.toFixed(2).replace('.', ',')}
                </span>
                <span
                  className="text-slate-400 font-medium uppercase tracking-[0.14em]"
                  style={{ fontSize: '1.1rem' }}
                >
                  Mensalidade Fixa
                </span>
              </div>
            )}
          </AbsoluteFill>

          {/* Toast macOS — slide da direita, some junto ao Ato 2 */}
          {frame >= 435 && (
            <div
              className="absolute right-10 z-50"
              style={{
                top:             '18%',
                opacity:         sp2Toast * exitOp,
                transform:       `translateX(${150 - sp2Toast * 150}px)`,
                transformOrigin: 'right center',
              }}
            >
              <div
                className="flex items-center gap-6 rounded-[1.5rem]"
                style={{
                  padding:              '1.5rem 1.8rem',
                  background:           'rgba(255,255,255,0.95)',
                  backdropFilter:       'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border:               '1px solid rgba(16,185,129,0.09)',
                  // Stripe: sombras leves e difusas
                  boxShadow:            '0 16px 48px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)',
                  minWidth:             '440px',
                }}
              >
                <div
                  className="flex-shrink-0 rounded-xl flex items-center justify-center"
                  style={{
                    width:     '4rem',
                    height:    '4rem',
                    background: '#10b981',
                    boxShadow:  '0 4px 14px rgba(16,185,129,0.15)',
                  }}
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-slate-400 font-medium uppercase tracking-[0.18em]"
                    style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}
                  >
                    Lucro Protegido
                  </span>
                  <span
                    className="font-mono tabular-nums font-black leading-none text-emerald-600"
                    style={{
                      fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
                      fontSize:   '2.5rem',
                      filter:     'drop-shadow(0 1px 4px rgba(16,185,129,0.10))',
                    }}
                  >
                    + {fmtBRL(PROFIT_SAVED)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────
              ATO 3: O MANIFESTO — tela limpa, texto e botão
              FIX BUG 3: único container flex-col evita sobreposição.
              flex-1 no bloco de texto → centrado verticalmente no espaço
              disponível. Botão flex-shrink-0 → sempre ancorado no rodapé.
              pb-24 (96px) garante respiro mínimo de segurança na base.
          ────────────────────────────────────────────────────────────── */}
          {frame >= 535 && (
            <div
              className="absolute inset-0 z-50 flex flex-col items-center px-20 pointer-events-none"
              style={{ paddingTop: '9rem', paddingBottom: '6rem' }}
            >
              {/* TEXTO — flex-1: ocupa TODO o espaço entre logo e botão,
                  justify-center: centraliza verticalmente dentro desse espaço.
                  Fisicamente impossível de encostar no botão. */}
              <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ gap: '1.2rem' }}>

                {/* Linha 1 — Beat 1 */}
                <p
                  className="font-black uppercase leading-[1.06] tracking-tight text-slate-900"
                  style={{
                    fontSize:  '3.85rem',
                    opacity:   sp3L1,
                    transform: `translateY(${38 - sp3L1 * 38}px)`,
                    filter:    `blur(${Math.max(0, 14 - sp3L1 * 14).toFixed(1)}px)`,
                  }}
                >
                  SE VOCÊ QUER QUE
                </p>

                {/* Linha 2 — Beat 2 */}
                <p
                  className="font-black uppercase leading-[1.06] tracking-tight text-slate-900"
                  style={{
                    fontSize:  '3.85rem',
                    opacity:   sp3L2,
                    transform: `translateY(${38 - sp3L2 * 38}px)`,
                    filter:    `blur(${Math.max(0, 14 - sp3L2 * 14).toFixed(1)}px)`,
                  }}
                >
                  O SEU{' '}
                  <span style={{ color: '#10b981' }}>LUCRO</span>
                  {' '}SEJA
                </p>

                {/* Linha 3 — Beat 2, cor da marca */}
                <p
                  className="font-black uppercase leading-[1.06] tracking-tight"
                  style={{
                    fontSize:  '3.85rem',
                    color:     '#10b981',
                    opacity:   sp3L2,
                    transform: `translateY(${38 - sp3L2 * 38}px)`,
                    filter:    `blur(${Math.max(0, 14 - sp3L2 * 14).toFixed(1)}px)`,
                  }}
                >
                  REALMENTE SEU...
                </p>
              </div>

              {/* BOTÃO — flex-shrink-0: jamais comprime, sempre no rodapé do container */}
              <div
                className="w-full flex-shrink-0"
                style={{
                  opacity:   sp3Btn,
                  transform: `translateY(${70 - sp3Btn * 70}px) scale(${0.94 + sp3Btn * 0.06})`,
                }}
              >
                <div
                  className="w-[90%] mx-auto bg-emerald-500 rounded-[2rem] flex items-center justify-center py-9"
                  style={{
                    boxShadow: `0 ${8 + btnGlow * 6}px ${24 + btnGlow * 14}px rgba(16,185,129,${0.10 + btnGlow * 0.04}), 0 2px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.12)`,
                  }}
                >
                  <span
                    className="text-white font-bold uppercase tracking-[0.15em] flex items-center"
                    style={{ fontSize: '2.3rem' }}
                  >
                    TER MEU SITE DE PEDIDOS
                    <span
                      className="font-mono ml-2"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color:      'rgba(167,243,208,0.9)',
                        opacity:    cursor ? 1 : 0,
                      }}
                    >
                      _
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
