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
  HStack,
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import {
  RepeatIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
} from '@chakra-ui/icons'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Function to prompt for a new file upload
  const promptNewFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
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

    // Reset the lawn grid
    setLawnGrid(initializeGrid())

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
  // State for tracking if mowing is in progress
  const [isMowing, setIsMowing] = useState(false)

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
    resetLawn()

    // Play the sound
    if (audioRef.current) {
      audioRef.current.play()
      setIsSoundPlaying(true)
      setIsMowing(true)

      // Set event listener for when audio ends
      audioRef.current.onended = () => {
        setIsSoundPlaying(false)
      }
    }

    // Log mowing in progress
    console.log('mowing in progress')

    // Define the two mowing patterns
    const pattern1 = [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 1, y: 3 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
    ]

    const pattern2 = [
      { x: 4, y: 4 },
      { x: 4, y: 3 },
      { x: 4, y: 2 },
      { x: 4, y: 1 },
      { x: 4, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
      { x: 2, y: 3 },
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
    ]

    // Function to map pattern coordinates to grid indices
    const mapPatternToGrid = (pattern: { x: number; y: number }[]) => {
      const mapped: { x: number; y: number; rowIndex: number; cellIndex: number }[] = []

      pattern.forEach(coord => {
        // Only process coordinates that are within our grid boundaries
        if (coord.x < gridSize && coord.y < gridSize) {
          const rowIndex = lawnGrid.findIndex(row => row[0].y === coord.y)
          if (rowIndex !== -1) {
            const cellIndex = lawnGrid[rowIndex].findIndex(
              cell => cell.x === coord.x && cell.y === coord.y
            )
            if (cellIndex !== -1) {
              mapped.push({
                x: coord.x,
                y: coord.y,
                rowIndex,
                cellIndex,
              })
            }
          }
        }
      })

      return mapped
    }

    // Map both patterns
    const pattern1Cells = mapPatternToGrid(pattern1)
    const pattern2Cells = mapPatternToGrid(pattern2)

    // Execute pattern 1, then pattern 2
    const executePatterns = () => {
      // Execute pattern 1
      executePattern(pattern1Cells, () => {
        // When pattern 1 is complete, wait a bit then execute pattern 2
        setTimeout(() => {
          toast({
            title: 'Deuxième motif',
            description: 'Démarrage du deuxième motif de tonte',
            status: 'info',
            duration: 2000,
            isClosable: true,
          })

          executePattern(pattern2Cells, () => {
            // When both patterns are complete
            setTimeout(() => {
              setIsMowing(false)
              silenceAudio()

              toast({
                title: 'Terminé !',
                description: 'La tonte de la pelouse est terminée',
                status: 'success',
                duration: 3000,
                isClosable: true,
              })
            }, 500)
          })
        }, 2000) // 2 second pause between patterns
      })
    }

    // Function to execute a single pattern with a callback when complete
    const executePattern = (
      cells: { x: number; y: number; rowIndex: number; cellIndex: number }[],
      onComplete: () => void
    ) => {
      cells.forEach((cell, index) => {
        setTimeout(() => {
          setLawnGrid(prevGrid => {
            const newGrid = JSON.parse(JSON.stringify(prevGrid)) // Deep copy
            newGrid[cell.rowIndex][cell.cellIndex].isMown = true
            return newGrid
          })

          // If this is the last cell, call onComplete
          if (index === cells.length - 1) {
            onComplete()
          }
        }, index * 1000) // 1 second delay for each cell
      })
    }

    // Start execution
    executePatterns()

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
        {/* File Upload Section */}
        <Box borderRadius="md" bg="black" p={4}>
          <FormControl mb={4}>
            <FormLabel>Chargez vos instructions (fichier en .txt)</FormLabel>
            <Input
              type="file"
              ref={fileInputRef}
              accept=".txt"
              onChange={handleFileUpload}
              pt={1}
              height="auto"
              display={fileUploaded ? 'none' : 'block'}
            />
          </FormControl>

          {fileUploaded && (
            <VStack spacing={3} align="stretch">
              <Button colorScheme="blue" onClick={mow} w="full" isDisabled={isMowing}>
                {isMowing ? 'Tonte en cours...' : `Lancer la tonte : ${fileName}`}
              </Button>

              <HStack>
                <Button
                  colorScheme="gray"
                  onClick={promptNewFileUpload}
                  w="full"
                  isDisabled={isMowing}
                >
                  Changer d&apos;instructions
                </Button>

                {isSoundPlaying && (
                  <Button colorScheme="red" onClick={silenceAudio} w="full">
                    Couper le son
                  </Button>
                )}
              </HStack>
            </VStack>
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
            <Button
              leftIcon={<RepeatIcon />}
              colorScheme="green"
              onClick={resetLawn}
              size="sm"
              isDisabled={isMowing}
            >
              Nouvelle saison
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}
