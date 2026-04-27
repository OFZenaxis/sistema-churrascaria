import { Composition } from 'remotion';
import { TeaserLancamento } from './TeaserLancamento';
import './index.css';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="TeaserLancamento"
				component={TeaserLancamento}
				durationInFrames={180}
				fps={30}
				width={1080}
				height={1350}
			/>
		</>
	);
};
