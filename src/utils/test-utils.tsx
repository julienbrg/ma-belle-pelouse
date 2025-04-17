import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { LanguageProvider } from '@/context/LanguageContext'

jest.mock('@reown/appkit/react', () => ({
  useAppKit: jest.fn(() => ({ open: jest.fn() })),
  useAppKitAccount: jest.fn(() => ({ isConnected: false, address: null })),
  useAppKitProvider: jest.fn(() => ({ walletProvider: null })),
  useDisconnect: jest.fn(() => ({ disconnect: jest.fn() })),
  createAppKit: jest.fn(),
}))

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ChakraProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ChakraProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
