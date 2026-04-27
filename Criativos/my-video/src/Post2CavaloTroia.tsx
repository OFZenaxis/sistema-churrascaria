import { AbsoluteFill, Img, staticFile, interpolate, spring, Easing, useCurrentFrame, useVideoConfig } from 'remotion';

export const Post2CavaloTroia = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// 1. Loop Transitions (Frames 0-30 e 270-300)
	const initialGreenOpacity = interpolate(frame, [0, 30], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const finalGreenOpacity = interpolate(frame, [270, 300], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// 2. Cenografia Background & Grid
	const gridY = interpolate(frame, [0, 300], [0, 100]);
	const gridStyle = {
		backgroundImage: `
			linear-gradient(to right, rgba(0,0,0,0.03) 2px, transparent 2px),
			linear-gradient(to bottom, rgba(0,0,0,0.03) 2px, transparent 2px)
		`,
		backgroundSize: '40px 40px',
		backgroundPosition: `0px ${gridY}px`,
	};

	// 3. Marca (Logo)
	const logoFrame = frame - 15;
	const logoSpring = spring({
		frame: logoFrame,
		fps,
		config: { damping: 20, mass: 1.5, stiffness: 100 }, 
	});
	const logoY = interpolate(logoSpring, [0, 1], [-80, 0]);
	const logoOpacity = interpolate(logoFrame, [0, 20], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// 4. Card Premium (Altura Fixa p/ evitar Solavancos)
	const cardFrame = frame - 30;
	const cardSpring = spring({
		frame: cardFrame,
		fps,
		config: { damping: 20, mass: 1, stiffness: 100 },
	});
	const cardEntranceY = interpolate(cardSpring, [0, 1], [350, 0]);
	const cardOpacity = interpolate(cardFrame, [0, 20], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	
	const cardFloat = Math.sin(frame / 20) * 12;
	const cardFinalY = cardEntranceY + cardFloat;

	const easing = Easing.bezier(0.16, 1, 0.3, 1);

	// 5. Eyebrow & Tipografia
	const subtitleFrame = frame - 45;
	const subtitleProgress = interpolate(subtitleFrame, [0, 25], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const subtitleBlur = interpolate(subtitleProgress, [0, 1], [15, 0]);
	const subtitleY = interpolate(subtitleProgress, [0, 1], [20, 0]);

	// Título (Stagger cascata - 60 e 70)
	const title1Frame = frame - 60;
	const title1Progress = interpolate(title1Frame, [0, 30], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	
	const title2Frame = frame - 70;
	const title2Progress = interpolate(title2Frame, [0, 30], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// 6. Ilustração Minimalista (Cupom) - Frame 110 com Spring Suave
	const flyerFrame = frame - 110;
	const flyerOpacity = interpolate(flyerFrame, [0, 20], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const flyerSpring = spring({
		frame: flyerFrame,
		fps,
		config: { damping: 14, mass: 0.8 }, // Suave, desliza clean
	});
	const flyerY = interpolate(flyerSpring, [0, 1], [30, 0]);
	const flyerRotation = interpolate(flyerSpring, [0, 1], [-8, -2]);

	// 7. Botão CTA - Frame 150
	const buttonFrame = frame - 150;
	const buttonOpacity = interpolate(buttonFrame, [0, 20], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const buttonSpring = spring({
		frame: buttonFrame,
		fps,
		config: { damping: 14, mass: 0.8 }, // Movimento macio de baixo para cima
	});
	const buttonY = interpolate(buttonSpring, [0, 1], [40, 0]);
	
	const isButtonEntered = buttonFrame > 30;
	const pulseMultiplier = isButtonEntered ? Math.sin((frame - 180) / 8) * 0.015 : 0;
	const buttonScale = 1 + pulseMultiplier;
	const blink = Math.floor(frame / 15) % 2 === 0;

	return (
		<AbsoluteFill className="bg-stone-50 font-sans tracking-tight">
			{/* Grid Fundo Dinâmico */}
			<AbsoluteFill style={{ ...gridStyle, opacity: 0.8 }} />

			{/* Scene Content */}
			<AbsoluteFill className="items-center justify-center">
				{/* Logo Importado Nativamente */}
				<div 
					className="absolute top-16 w-full flex justify-center"
					style={{
						opacity: logoOpacity,
						transform: `translateY(${logoY}px)`,
					}}
				>
					<Img src={staticFile('logo-icon.png')} className="h-[6rem] w-auto drop-shadow-sm" />
				</div>

				{/* Card Premium de Altura Fixa */}
				{frame >= 30 && (
					<div
						className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl shadow-emerald-900/5 rounded-[3rem] p-16 w-[88%] h-[1000px] flex flex-col items-center justify-start z-10"
						style={{
							opacity: cardOpacity,
							transform: `translateY(${cardFinalY}px)`,
						}}
					>
						{/* Subtítulo */}
						<div
							className="w-full text-center mt-6 mb-8"
							style={{ opacity: subtitleProgress, transform: `translateY(${subtitleY}px)`, filter: `blur(${subtitleBlur}px)` }}
						>
							<p className="text-rose-600 text-2xl font-black uppercase tracking-[0.25em]">
								ESTRATÉGIA DE CRESCIMENTO
							</p>
						</div>

						{/* Título */}
						<h1 className="text-slate-900 font-black text-[4.8rem] leading-[1.05] tracking-tight mb-20 w-full text-center flex flex-col gap-1">
							<div style={{ opacity: title1Progress, transform: `translateY(${interpolate(title1Progress, [0, 1], [30, 0])}px)`, filter: `blur(${interpolate(title1Progress, [0, 1], [15, 0])}px)` }}>
								Use o iFood para lotar
							</div>
							<div style={{ opacity: title2Progress, transform: `translateY(${interpolate(title2Progress, [0, 1], [30, 0])}px)`, filter: `blur(${interpolate(title2Progress, [0, 1], [15, 0])}px)` }}>
								o seu site próprio.
							</div>
						</h1>

						{/* Panfleto Minimalista (B2B Refinado) - Frame 110 */}
						{frame >= 110 && (
							<div 
								className="bg-slate-100 border-4 border-dashed border-slate-300 rounded-3xl px-12 py-10 flex flex-col items-center justify-center shadow-lg shadow-slate-300/30 mb-auto"
								style={{
									opacity: flyerOpacity,
									transform: `translateY(${flyerY}px) rotate(${flyerRotation}deg)`,
								}}
							>
								<div className="bg-emerald-100 text-emerald-800 text-lg font-black px-5 py-2 rounded-full uppercase tracking-widest mb-4">
									CUPOM EXCLUSIVO
								</div>
								<p className="text-emerald-600 font-black text-5xl whitespace-nowrap tracking-tighter">
									10% OFF pedindo pelo link
								</p>
							</div>
						)}

						{/* Botão Interativo Simulator - Frame 150 */}
						{frame >= 150 && (
							<div
								className="w-[90%] bg-emerald-500 rounded-[2rem] py-8 flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-6"
								style={{
									opacity: buttonOpacity,
									transform: `translateY(${buttonY}px) scale(${buttonScale})`,
								}}
							>
								<span className="text-white font-bold tracking-[0.15em] font-mono text-3xl flex items-center h-10">
									ATIVAR ESTRATÉGIA<span style={{ opacity: blink ? 1 : 0 }}>_</span>
								</span>
							</div>
						)}
					</div>
				)}
			</AbsoluteFill>

			{/* Transition Layer: Início (Fade-out Emerald) */}
			{frame < 30 && (
				<AbsoluteFill 
					className="bg-emerald-500 pointer-events-none z-50" 
					style={{ opacity: initialGreenOpacity }} 
				/>
			)}

			{/* Transition Layer: Fim (Fade-in Emerald para Loop Completo) */}
			{frame >= 270 && (
				<AbsoluteFill 
					className="bg-emerald-500 pointer-events-none z-50" 
					style={{ opacity: finalGreenOpacity }} 
				/>
			)}
		</AbsoluteFill>
	);
};
