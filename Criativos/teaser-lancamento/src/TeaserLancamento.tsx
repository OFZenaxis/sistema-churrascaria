import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const TeaserLancamento = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Scene 1: "Chega de dividir o seu lucro."
	// Enters from bottom with spring, then fades out at frame 45.
	const scene1Entrance = spring({
		frame,
		fps,
		config: { damping: 12, mass: 0.5 },
	});

	const scene1YOffset = interpolate(scene1Entrance, [0, 1], [100, 0]);
	const scene1Opacity = interpolate(frame, [45, 55], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Scene 2: "SAIU DELIVERY"
	// Starts at frame 60.
	const scene2Frame = frame - 60;
	const scene2ScaleEntrance = spring({
		frame: scene2Frame,
		fps,
		config: { damping: 14, mass: 0.6 },
	});
	const scene2Scale = interpolate(scene2ScaleEntrance, [0, 1], [0.9, 1]);
	const scene2Opacity = interpolate(scene2Frame, [0, 10], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Support text: "O sistema de delivery independente."
	// Starts at frame 80.
	const supportTextFrame = frame - 80;
	const supportTextEntrance = spring({
		frame: supportTextFrame,
		fps,
		config: { damping: 12, mass: 0.5 },
	});
	const supportTextOpacity = interpolate(supportTextFrame, [0, 10], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const supportTextYOffset = interpolate(supportTextEntrance, [0, 1], [50, 0]);

	// Terminal Text: "INICIANDO SISTEMA..."
	// Starts at frame 110. Blinking cursor.
	const terminalFrame = frame - 110;
	const terminalOpacity = terminalFrame >= 0 ? 1 : 0;
	
	// Blinking cursor logic (switches every 15 frames)
	const blink = Math.floor(frame / 15) % 2 === 0;

	return (
		<AbsoluteFill className="bg-stone-50 items-center justify-center font-sans tracking-tight">
			{/* Scene 1 */}
			{frame < 60 && (
				<AbsoluteFill className="items-center justify-center">
					<h2
						className="text-slate-400 text-5xl font-medium px-12 text-center leading-tight"
						style={{
							opacity: scene1Opacity,
							transform: `translateY(${scene1YOffset}px)`,
						}}
					>
						Chega de dividir o seu lucro.
					</h2>
				</AbsoluteFill>
			)}

			{/* Scene 2 */}
			{frame >= 60 && (
				<AbsoluteFill className="items-center justify-center flex-col gap-6 px-12">
					<h1
						className="text-slate-900 text-8xl font-black text-center leading-tight"
						style={{
							opacity: scene2Opacity,
							transform: `scale(${scene2Scale})`,
						}}
					>
						SAIU<br />DELIVERY
					</h1>
					
					<p
						className="text-slate-600 text-4xl font-medium tracking-wide mt-4 text-center leading-tight"
						style={{
							opacity: supportTextOpacity,
							transform: `translateY(${supportTextYOffset}px)`,
						}}
					>
						O sistema de delivery<br />independente.
					</p>
				</AbsoluteFill>
			)}

			{/* Terminal Text */}
			{frame >= 110 && (
				<div 
					className="absolute bottom-40 w-full flex justify-center items-center"
					style={{ opacity: terminalOpacity }}
				>
					<div className="text-emerald-500 font-medium text-3xl tracking-widest flex items-center justify-center">
						INICIANDO SISTEMA...<span style={{ opacity: blink ? 1 : 0 }}>_</span>
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};
