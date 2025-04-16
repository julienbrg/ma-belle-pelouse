'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import {
  optimism,
  zksync,
  base,
  arbitrum,
  gnosis,
  polygon,
  polygonZkEvm,
  mantle,
  celo,
  avalanche,
  degen,
  sepolia,
  optimismSepolia,
  arbitrumSepolia,
  baseSepolia,
} from '@reown/appkit/networks'
import { type ReactNode, memo } from 'react'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'

const projectId = process.env['NEXT_PUBLIC_PROJECT_ID']
if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not set')
}

const ethersAdapter = new EthersAdapter()

createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks: [
    optimism,
    zksync,
    base,
    arbitrum,
    gnosis,
    polygon,
    polygonZkEvm,
    mantle,
    celo,
    avalanche,
    degen,
    sepolia,
    optimismSepolia,
    arbitrumSepolia,
    baseSepolia,
  ],
  defaultNetwork: sepolia,
  metadata: {
    name: 'Ma belle pelouse',
    description: 'Interactive 5x5 lawn grid visualization',
    url: 'https://ma-belle-pelouse.netlify.app',
    icons: ['./favicon.ico'],
  },
  enableEIP6963: true,
  enableCoinbase: true,
})

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#000000',
        color: 'white',
      },
      // Ensure all background elements are black, not gray
      '.chakra-ui-dark': {
        bg: '#000000',
      },
      // Override any Chakra UI components that might use whiteAlpha backgrounds
      '.chakra-modal-content': {
        bg: '#000000',
      },
      '.chakra-menu__menu-list': {
        bg: '#000000',
      },
      '.chakra-card': {
        bg: '#000000',
      },
      '.chakra-input': {
        bg: '#000000',
        borderColor: 'gray.600',
      },
      '.chakra-select': {
        bg: '#000000',
      },
      // Make sure form elements are also black
      'input, select, textarea': {
        bg: '#000000 !important',
      },
    },
  },
})

const ContextProvider = memo(function ContextProvider({ children }: { children: ReactNode }) {
  return <ChakraProvider theme={theme}>{children}</ChakraProvider>
})

export default ContextProvider
