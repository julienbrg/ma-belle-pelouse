'use client'

import {
  Container,
  Heading,
  Text,
  Grid,
  GridItem,
  Box,
  VStack,
  Flex,
  useColorModeValue,
  Tooltip,
  Button,
  Input,
  FormControl,
  FormLabel,
  useToast,
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { RepeatIcon, AttachmentIcon } from '@chakra-ui/icons'

interface LawnCell {
  x: number
  y: number
  isMown: boolean
}

export default function LawnPage() {
  const t = useTranslation()
  const gridSize = 5
  const toast = useToast()
  const audioRef = useRef<HTMLAudioElement>(null)

  // Initialize the lawn grid with all cells unmown (hautes herbes)
  const initializeGrid = () => {
    const initialGrid: LawnCell[][] = []

    for (let y = 0; y < gridSize; y++) {
      const row: LawnCell[] = []
      for (let x = 0; x < gridSize; x++) {
        row.push({
          x,
          y: gridSize - 1 - y, // Reverse y-coordinate so (0,0) is bottom-left
          isMown: false, // All cells start unmown
        })
      }
      initialGrid.push(row)
    }

    return initialGrid
  }

  const [lawnGrid, setLawnGrid] = useState<LawnCell[][]>(initializeGrid)
  const [fileUploaded, setFileUploaded] = useState<boolean>(false)
  const [fileName, setFileName] = useState<string>('')

  // Colors for the lawn cells
  const mownColor = useColorModeValue('green.300', 'green.400')
  const unmownColor = useColorModeValue('green.700', 'green.800')
  const borderColor = useColorModeValue('green.900', 'green.900')

  // Toggle cell state when clicked
  const toggleCellState = (x: number, y: number) => {
    // Find the row index based on the y-coordinate
    const rowIndex = lawnGrid.findIndex(row => row[0].y === y)

    if (rowIndex !== -1) {
      setLawnGrid(prevGrid => {
        const newGrid = [...prevGrid]
        newGrid[rowIndex] = [...prevGrid[rowIndex]]
        const cellIndex = newGrid[rowIndex].findIndex(cell => cell.x === x && cell.y === y)

        if (cellIndex !== -1) {
          newGrid[rowIndex][cellIndex] = {
            ...newGrid[rowIndex][cellIndex],
            isMown: !newGrid[rowIndex][cellIndex].isMown,
          }
        }

        return newGrid
      })
    }
  }

  // Reset the lawn grid to all unmown
  const resetLawn = () => {
    setLawnGrid(initializeGrid())
    setFileUploaded(false)
    setFileName('')
  }

  // Function to handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (!files || files.length === 0) {
      return
    }

    const file = files[0]

    // Check if it's a .txt file
    if (file.type !== 'text/plain') {
      toast({
        title: "Fichier d'instructions invalide",
        description: 'Il faut impérativement charger un fichier au format .txt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Set the file as uploaded
    setFileUploaded(true)
    setFileName(file.name)

    toast({
      title: 'Merci !',
      description: `Les instructions (${file.name}) ont été correctement transmises.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  // State for tracking whether sound is playing
  const [isSoundPlaying, setIsSoundPlaying] = useState(false)

  // Function to silence the audio
  const silenceAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsSoundPlaying(false)
    }
  }

  // Function to mow the lawn
  const mow = () => {
    // Play the sound
    if (audioRef.current) {
      audioRef.current.play()
      setIsSoundPlaying(true)

      // Set event listener for when audio ends
      audioRef.current.onended = () => {
        setIsSoundPlaying(false)
      }
    }

    // Log mowing in progress
    console.log('mowing in progress')

    // Create a flattened array of all cells in order from (0,0), (0,1), etc.
    const allCells: { x: number; y: number; rowIndex: number; cellIndex: number }[] = []

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        // Find the actual indices in our grid structure
        const rowIndex = lawnGrid.findIndex(row => row[0].y === y)
        if (rowIndex !== -1) {
          const cellIndex = lawnGrid[rowIndex].findIndex(cell => cell.x === x && cell.y === y)
          if (cellIndex !== -1) {
            allCells.push({ x, y, rowIndex, cellIndex })
          }
        }
      }
    }

    // Mow cells one by one with delay
    allCells.forEach((cell, index) => {
      setTimeout(() => {
        setLawnGrid(prevGrid => {
          const newGrid = JSON.parse(JSON.stringify(prevGrid)) // Deep copy
          newGrid[cell.rowIndex][cell.cellIndex].isMown = true
          return newGrid
        })
      }, index * 1000) // 1 second delay for each cell
    })

    toast({
      title: "C'est parti !",
      description: 'La tonte de la pelouse a commencé',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={6} align="stretch">
        {/* <Heading as="h1" size="xl" mb={2}>
          Ma belle pelouse !
        </Heading> */}

        {/* File Upload Section */}
        <Box borderRadius="md" bg="black" p={4}>
          <FormControl mb={4}>
            <FormLabel>Chargez vos instructions (fichier en .txt)</FormLabel>
            <Input type="file" accept=".txt" onChange={handleFileUpload} pt={1} height="auto" />
          </FormControl>

          {fileUploaded && (
            <Button leftIcon={<AttachmentIcon />} colorScheme="blue" onClick={mow} w="full">
              Instructions de tonte: {fileName}
            </Button>
          )}

          {isSoundPlaying && (
            <Button colorScheme="red" onClick={silenceAudio} w="full" mt={2}>
              Couper le son
            </Button>
          )}
        </Box>

        {/* Audio Element (hidden) */}
        <audio ref={audioRef} src="/lawn-mower-03.mp3" style={{ display: 'none' }} />

        {/* Lawn Grid */}
        <Box mx="auto" borderRadius="md" bg="black" boxShadow="md" width="100%">
          <VStack spacing={4} width="100%">
            {/* The lawn grid */}
            <Grid templateColumns={`repeat(${gridSize}, 1fr)`} gap={0} width="100%">
              {lawnGrid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <Tooltip
                    key={`${cell.x}-${cell.y}`}
                    label={`${cell.x}, ${cell.y}`}
                    placement="top"
                    hasArrow
                  >
                    <GridItem
                      w="100%"
                      aspectRatio="1/1"
                      bg={cell.isMown ? mownColor : unmownColor}
                      borderColor={borderColor}
                      _hover={{ opacity: 0.8, cursor: 'pointer' }}
                      onClick={() => toggleCellState(cell.x, cell.y)}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                    />
                  </Tooltip>
                ))
              )}
            </Grid>

            {/* Legend */}
            <Flex justifyContent="center" gap={4} mt={2}>
              <Flex alignItems="center" gap={2}>
                <Box w="16px" h="16px" bg={mownColor} borderRadius="sm"></Box>
                <Text fontSize="sm">Tondu</Text>
              </Flex>
              <Flex alignItems="center" gap={2}>
                <Box w="16px" h="16px" bg={unmownColor} borderRadius="sm"></Box>
                <Text fontSize="sm">Hautes herbes</Text>
              </Flex>
            </Flex>

            <Text fontSize="sm" color="gray.400">
              Cliquer sur une parcelle pour la tondre.
            </Text>
            <Button leftIcon={<RepeatIcon />} colorScheme="green" onClick={resetLawn} size="sm">
              Nouvelle saison
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}
