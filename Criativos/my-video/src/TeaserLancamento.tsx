import { AbsoluteFill, Img, staticFile, interpolate, spring, Easing, useCurrentFrame, useVideoConfig } from 'remotion';

export const TeaserLancamento = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// 1. Loop Transitions (Frames 0-30 e 270-300)
	// Fade out da tela cheia verde inicial
	const initialGreenOpacity = interpolate(frame, [0, 30], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Fade in da tela cheia verde no final para loop perfeito
	const finalGreenOpacity = interpolate(frame, [270, 300], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// 2. Cenografia Background & Grid
	// Move a grelha translúcida no eixo Y continuamente
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
	// Entra com spring pesado (damping elevado para zero bounce)
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

	// 4. Card Premium (Glassmorphism amplo e imponente)
	const cardFrame = frame - 30;
	// Criticamente amortecido
	const cardSpring = spring({
		frame: cardFrame,
		fps,
		config: { damping: 20, mass: 1, stiffness: 100 },
	});
	// Float entrance
	const cardEntranceY = interpolate(cardSpring, [0, 1], [250, 0]);
	const cardOpacity = interpolate(cardFrame, [0, 20], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	
	// Movimento contínuo micrométrico (flutuação eterna) no Card usando wave Math.sin
	const cardFloat = Math.sin(frame / 20) * 12;
	const cardFinalY = cardEntranceY + cardFloat;

	// 5. Tipografia & Textos com Blur + Ease (Baseado em Best Practices .gemini)
	const easing = Easing.bezier(0.16, 1, 0.3, 1);

	// Eyebrow (Subtítulo)
	const subtitleFrame = frame - 45;
	const subtitleProgress = interpolate(subtitleFrame, [0, 25], [0, 1], {
		easing,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const subtitleBlur = interpolate(subtitleProgress, [0, 1], [15, 0]);
	const subtitleY = interpolate(subtitleProgress, [0, 1], [20, 0]);

	// Título (Stagger cascata)
	const title1Frame = frame - 60;
	const title1Progress = interpolate(title1Frame, [0, 30], [0, 1], {
		easing,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	
	const title2Frame = frame - 70;
	const title2Progress = interpolate(title2Frame, [0, 30], [0, 1], {
		easing,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// 6. Botão Pulse e Cursor
	const buttonFrame = frame - 100;
	const buttonProgress = interpolate(buttonFrame, [0, 30], [0, 1], {
		easing,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	
	const isButtonEntered = buttonFrame > 30;
	const pulseMultiplier = isButtonEntered ? Math.sin((frame - 130) / 8) * 0.015 : 0;
	const buttonScaleBase = interpolate(buttonProgress, [0, 1], [0.85, 1]);
	const buttonScale = buttonScaleBase + pulseMultiplier;
	
	const buttonBlur = interpolate(buttonProgress, [0, 1], [20, 0]);
	const buttonY = interpolate(buttonProgress, [0, 1], [30, 0]);

	// Pisca o cursor a cada 15 frames
	const blink = Math.floor(frame / 15) % 2 === 0;

	return (
		<AbsoluteFill className="bg-stone-50 font-sans tracking-tight">
			{/* Grid Fundo Dinâmico */}
			<AbsoluteFill style={{ ...gridStyle, opacity: 0.8 }} />

			{/* Scene Content */}
			<AbsoluteFill className="items-center justify-center">
				{/* Logo Importado Nativamente */}
				<div 
					className="absolute top-20 w-full flex justify-center"
					style={{
						opacity: logoOpacity,
						transform: `translateY(${logoY}px)`,
					}}
				>
					<Img src={staticFile('logo-icon.png')} className="h-[5.5rem] w-auto drop-shadow-sm" />
				</div>

				{/* Card Ultra Premium */}
				{frame >= 30 && (
					<div
						className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl shadow-emerald-900/5 rounded-[3rem] p-16 w-[88%] max-w-4xl flex flex-col items-center z-10"
						style={{
							opacity: cardOpacity,
							transform: `translateY(${cardFinalY}px)`,
						}}
					>
						{/* Subtítulo */}
						<div
							className="w-full text-center mb-8"
							style={{
								opacity: subtitleProgress,
								transform: `translateY(${subtitleY}px)`,
								filter: `blur(${subtitleBlur}px)`,
							}}
						>
							<p className="text-rose-600 text-2xl font-black uppercase tracking-[0.25em]">
								A revolução do delivery
							</p>
						</div>

						{/* Título */}
						<h1 className="text-slate-900 font-black text-[5.5rem] leading-[1.05] mb-16 w-full text-center flex flex-col gap-1 tracking-tight">
							<div
								style={{
									opacity: title1Progress,
									transform: `translateY(${interpolate(title1Progress, [0, 1], [30, 0])}px)`,
									filter: `blur(${interpolate(title1Progress, [0, 1], [15, 0])}px)`,
								}}
							>
								Chega de dividir
							</div>
							<div
								style={{
									opacity: title2Progress,
									transform: `translateY(${interpolate(title2Progress, [0, 1], [30, 0])}px)`,
									filter: `blur(${interpolate(title2Progress, [0, 1], [15, 0])}px)`,
								}}
							>
								o seu lucro.
							</div>
						</h1>

						{/* Botão Interativo Simulator */}
						<div
							className="w-[90%] bg-emerald-500 rounded-[2rem] py-8 flex items-center justify-center shadow-2xl shadow-emerald-500/40"
							style={{
								opacity: buttonProgress,
								transform: `translateY(${buttonY}px) scale(${buttonScale})`,
								filter: `blur(${buttonBlur}px)`,
							}}
						>
							<span className="text-white font-bold tracking-[0.15em] font-mono text-3xl flex items-center h-10">
								INICIANDO SISTEMA...<span style={{ opacity: blink ? 1 : 0 }}>_</span>
							</span>
						</div>
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