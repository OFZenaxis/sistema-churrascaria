import { Config } from '@remotion/cli/config';
import { enableTailwind } from '@remotion/tailwind';

Config.overrideWebpackConfig((currentConfiguration) => {
	const config = enableTailwind(currentConfiguration);
	config.cache = false; // Mantemos o cache desligado por segurança
	return config;
});