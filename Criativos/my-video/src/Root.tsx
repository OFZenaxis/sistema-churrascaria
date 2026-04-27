import { Composition } from 'remotion';
import { TeaserLancamento } from './TeaserLancamento';
import { Post2CavaloTroia } from './Post2CavaloTroia';
import { Post3ArmadilhaGratuito } from './Post3ArmadilhaGratuito';
import { Post4PazOperacional } from './Post4PazOperacional';
import { Post5MatematicaBruta } from './Post5MatematicaBruta';
import './index.css';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="TeaserLancamento"
				component={TeaserLancamento}
				durationInFrames={300}
				fps={30}
				width={1080}
				height={1350}
			/>
			<Composition
				id="Post2CavaloTroia"
				component={Post2CavaloTroia}
				durationInFrames={300}
				fps={30}
				width={1080}
				height={1350}
			/>
			<Composition
				id="Post3ArmadilhaGratuito"
				component={Post3ArmadilhaGratuito}
				durationInFrames={300}
				fps={30}
				width={1080}
				height={1350}
			/>
			<Composition
				id="Post4PazOperacional"
				component={Post4PazOperacional}
				durationInFrames={300}
				fps={30}
				width={1080}
				height={1350}
			/>
			<Composition
				id="Post5MatematicaBruta"
				component={Post5MatematicaBruta}
				durationInFrames={690}
				fps={30}
				width={1080}
				height={1350}
			/>
		</>
	);
};
