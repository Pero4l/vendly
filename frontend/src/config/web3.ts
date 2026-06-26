import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celo, celoAlfajores } from 'viem/chains';
import { http } from 'wagmi';

export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '3fcc6bba3f5de969d7111877799b7b4e';

export const config = getDefaultConfig({
  appName: 'Vendly',
  projectId: projectId,
  chains: [
    celo,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [celoAlfajores] : [celoAlfajores]) // default to including alfajores
  ],
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http()
  },
  ssr: true
});
