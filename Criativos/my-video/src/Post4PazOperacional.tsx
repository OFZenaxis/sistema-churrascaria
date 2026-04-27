import { AbsoluteFill, Img, staticFile, interpolate, spring, Easing, useCurrentFrame, useVideoConfig } from 'remotion';

export const Post4PazOperacional = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const easing = Easing.bezier(0.16, 1, 0.3, 1);

	// 1. Loop Transitions
	const initialGreenOpacity = interpolate(frame, [0, 30], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const finalGreenOpacity = interpolate(frame, [270, 300], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// 2. Cenografia Dashboard
	const gridY = interpolate(frame, [0, 300], [0, 100]);
	const gridStyle = {
		backgroundImage: `
			linear-gradient(to right, rgba(0,0,0,0.03) 2px, transparent 2px),
			linear-gradient(to bottom, rgba(0,0,0,0.03) 2px, transparent 2px)
		`,
		backgroundSize: '40px 40px',
		backgroundPosition: `0px ${gridY}px`,
	};

	// Sidebar Interpolations
	const sidebarFrame = frame - 15;
	const sidebarOpacity = interpolate(sidebarFrame, [0, 20], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	
	const logoSpring = spring({
		frame: sidebarFrame,
		fps,
		config: { damping: 20, mass: 1 },
	});
	const logoScale = interpolate(logoSpring, [0, 1], [0.8, 1]);
	
	// Menu skeletons anim
	const menuOpacity = interpolate(frame - 25, [0, 20], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	
	// 3. Narrativa Textual (Main Area)
	const subtitleFrame = frame - 45;
	const subtitleProgress = interpolate(subtitleFrame, [0, 25], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const subtitleBlur = interpolate(subtitleProgress, [0, 1], [15, 0]);
	const subtitleY = interpolate(subtitleProgress, [0, 1], [20, 0]);

	const title1Frame = frame - 60;
	const title1Progress = interpolate(title1Frame, [0, 30], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	
	const title2Frame = frame - 70;
	const title2Progress = interpolate(title2Frame, [0, 30], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// 4. Mágica Operacional (Comandas KDS)
	// Comanda 1 (Frame 110)
	const comanda1Frame = frame - 110;
	const comanda1Spring = spring({ frame: comanda1Frame, fps, config: { damping: 22, mass: 0.8, stiffness: 100 } });
	const comanda1X = interpolate(comanda1Spring, [0, 1], [400, 0]);
	const comanda1Opacity = interpolate(comanda1Frame, [0, 20], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// Comanda 2 (Frame 125)
	const comanda2Frame = frame - 125;
	const comanda2Spring = spring({ frame: comanda2Frame, fps, config: { damping: 22, mass: 0.8, stiffness: 100 } });
	const comanda2X = interpolate(comanda2Spring, [0, 1], [400, 0]);
	const comanda2Opacity = interpolate(comanda2Frame, [0, 20], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// Comanda 3 (Frame 140)
	const comanda3Frame = frame - 140;
	const comanda3Spring = spring({ frame: comanda3Frame, fps, config: { damping: 22, mass: 0.8, stiffness: 100 } });
	const comanda3X = interpolate(comanda3Spring, [0, 1], [400, 0]);
	const comanda3Opacity = interpolate(comanda3Frame, [0, 20], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// 5. Call to Action (Frame 180)
	const buttonFrame = frame - 180;
	const buttonOpacity = interpolate(buttonFrame, [0, 20], [0, 1], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const buttonSpring = spring({ frame: buttonFrame, fps, config: { damping: 14, mass: 0.8 } });
	const buttonY = interpolate(buttonSpring, [0, 1], [40, 0]);
	
	const isButtonEntered = buttonFrame > 30;
	const pulseMultiplier = isButtonEntered ? Math.sin((frame - 210) / 8) * 0.015 : 0;
	const buttonScale = interpolate(buttonOpacity, [0, 1], [0.95, 1]) + pulseMultiplier;
	const buttonBlur = interpolate(buttonOpacity, [0, 1], [20, 0]);
	const blink = Math.floor(frame / 15) % 2 === 0;

	return (
		<AbsoluteFill className="bg-stone-50 flex flex-row overflow-hidden font-sans tracking-tight">
			
			{/* Dashboard Sidebar (Left 25%) */}
			{frame >= 15 && (
				<div 
					className="w-[25%] bg-slate-900 border-r border-slate-800 h-full flex flex-col items-center py-20 px-6 z-20 shadow-2xl"
					style={{ opacity: sidebarOpacity }}
				>
					{/* Logo */}
					<Img 
						src={staticFile('logo-icon.png')} 
						className="w-28 h-auto drop-shadow-md mb-24"
						style={{ transform: `scale(${logoScale})` }}
					/>
					
					{/* Menu Skeletons */}
					<div className="w-full flex flex-col gap-6" style={{ opacity: menuOpacity }}>
						<div className="w-full h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl relative overflow-hidden">
							<div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-md bg-emerald-500"></div>
							<div className="absolute left-12 top-1/2 -translate-y-1/2 w-20 h-3 rounded-full bg-emerald-400"></div>
						</div>
						<div className="w-full h-12 bg-slate-800/80 rounded-xl relative">
							<div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-md bg-slate-700"></div>
							<div className="absolute left-12 top-1/2 -translate-y-1/2 w-16 h-3 rounded-full bg-slate-700"></div>
						</div>
						<div className="w-full h-12 bg-slate-800/80 rounded-xl relative">
							<div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-md bg-slate-700"></div>
							<div className="absolute left-12 top-1/2 -translate-y-1/2 w-24 h-3 rounded-full bg-slate-700"></div>
						</div>
						<div className="w-full h-12 bg-slate-800/80 rounded-xl relative">
							<div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-md bg-slate-700"></div>
							<div className="absolute left-12 top-1/2 -translate-y-1/2 w-14 h-3 rounded-full bg-slate-700"></div>
						</div>
					</div>
				</div>
			)}

			{/* Main Area (Right 75%) */}
			<div className="w-[75%] h-full relative">
				<AbsoluteFill style={{ ...gridStyle, opacity: 0.8 }} />
				
				<AbsoluteFill className="p-20 flex flex-col justify-start">
					{/* Eyebrow */}
					{frame >= 45 && (
						<div
							className="mt-12 mb-6"
							style={{ opacity: subtitleProgress, transform: `translateY(${subtitleY}px)`, filter: `blur(${subtitleBlur}px)` }}
						>
							<p className="text-rose-600 text-[1.6rem] font-bold uppercase tracking-widest pl-2">
								TECNOLOGIA DE COZINHA
							</p>
						</div>
					)}

					{/* Title Stagger */}
					<h1 className="text-slate-900 font-black text-[4.8rem] leading-[1.05] tracking-tight mb-20 flex flex-col gap-1 w-full relative z-10">
						{frame >= 60 && (
							<div style={{ opacity: title1Progress, transform: `translateY(${interpolate(title1Progress, [0, 1], [30, 0])}px)`, filter: `blur(${interpolate(title1Progress, [0, 1], [15, 0])}px)` }}>
								Sexta-feira à noite
							</div>
						)}
						{frame >= 70 && (
							<div style={{ opacity: title2Progress, transform: `translateY(${interpolate(title2Progress, [0, 1], [30, 0])}px)`, filter: `blur(${interpolate(title2Progress, [0, 1], [15, 0])}px)` }}>
								sem um único grito.
							</div>
						)}
					</h1>

					{/* Comandas KDS Container */}
					<div className="flex flex-col gap-6 w-[90%] relative z-10">
						{/* Comanda 1 */}
						{frame >= 110 && (
							<div 
								className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex justify-between items-center"
								style={{
									opacity: comanda1Opacity,
									transform: `translateX(${comanda1X}px)`,
								}}
							>
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
										<span className="text-slate-500 font-bold text-lg">🍔</span>
									</div>
									<span className="text-slate-800 font-bold text-3xl">Pedido <span className="text-slate-400">#125</span></span>
								</div>
								<div className="bg-emerald-100/80 text-emerald-700 px-6 py-2 rounded-full text-base font-black uppercase tracking-widest border border-emerald-200">
									ENTREGUE
								</div>
							</div>
						)}

						{/* Comanda 2 */}
						{frame >= 125 && (
							<div 
								className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex justify-between items-center"
								style={{
									opacity: comanda2Opacity,
									transform: `translateX(${comanda2X}px)`,
								}}
							>
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
										<span className="text-slate-500 font-bold text-lg">🥩</span>
									</div>
									<span className="text-slate-800 font-bold text-3xl">Pedido <span className="text-slate-400">#126</span></span>
								</div>
								<div className="bg-emerald-100/80 text-emerald-700 px-6 py-2 rounded-full text-base font-black uppercase tracking-widest border border-emerald-200">
									DESPACHADO
								</div>
							</div>
						)}

						{/* Comanda 3 */}
						{frame >= 140 && (
							<div 
								className="bg-white/90 border border-amber-200/50 rounded-3xl p-8 shadow-lg shadow-amber-900/5 flex justify-between items-center backdrop-blur-sm"
								style={{
									opacity: comanda3Opacity,
									transform: `translateX(${comanda3X}px)`,
								}}
							>
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
										<span className="text-amber-500 font-black text-xl animate-pulse">🔥</span>
									</div>
									<span className="text-slate-900 font-black text-3xl">Pedido <span className="text-slate-500">#127</span></span>
								</div>
								<div className="bg-amber-100 text-amber-700 px-6 py-2 rounded-full text-base font-black uppercase tracking-widest border border-amber-300">
									PREPARANDO
								</div>
							</div>
						)}
					</div>

					{/* Botão Call To Action (Base Area) */}
					{frame >= 180 && (
						<div
							className="mt-auto mb-10 w-[90%] bg-emerald-500 rounded-[2rem] py-8 flex items-center justify-center shadow-2xl shadow-emerald-500/40"
							style={{
								opacity: buttonOpacity,
								transform: `translateY(${buttonY}px) scale(${buttonScale})`,
								filter: `blur(${buttonBlur}px)`
							}}
						>
							<span className="text-white font-bold tracking-[0.15em] font-mono text-3xl flex items-center h-10">
								VER DEMONSTRAÇÃO<span style={{ opacity: blink ? 1 : 0 }}>_</span>
							</span>
						</div>
					)}
				</AbsoluteFill>
			</div>
			
			{/* Transition Layers (Over Everything) */}
			{frame < 30 && (
				<AbsoluteFill className="bg-emerald-500 pointer-events-none z-50" style={{ opacity: initialGreenOpacity }} />
			)}
			{frame >= 270 && (
				<AbsoluteFill className="bg-emerald-500 pointer-events-none z-50" style={{ opacity: finalGreenOpacity }} />
			)}
		</AbsoluteFill>
	);
};
