'use client'

import {
  Container,
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
  Textarea,
} from '@chakra-ui/react'
import { useState, useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { RepeatIcon } from '@chakra-ui/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUp,
  faArrowRight,
  faArrowDown,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'

// Add the icons to the library
library.add(faArrowUp, faArrowRight, faArrowDown, faArrowLeft)

interface LawnCell {
  x: number
  y: number
  isMown: boolean
}

// Cardinal directions for the lawnmower
type Direction = 'N' | 'E' | 'S' | 'W'

// Lawnmower instruction type
type Instruction = 'L' | 'R' | 'F'

// Lawnmower state
interface Lawnmower {
  x: number
  y: number
  direction: Direction
  instructions: string
}

export default function LawnPage() {
  const t = useTranslation()
  const toast = useToast()
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Lawn grid size (default 5x5)
  const [gridSize, setGridSize] = useState({ x: 5, y: 5 })

  // Instructions text area
  const [instructionsText, setInstructionsText] = useState<string>('')

  // Initialize the lawn grid with all cells unmown (hautes herbes)
  const initializeGrid = () => {
    const initialGrid: LawnCell[][] = []

    for (let y = 0; y < gridSize.y; y++) {
      const row: LawnCell[] = []
      for (let x = 0; x < gridSize.x; x++) {
        row.push({
          x,
          // Reverse y-coordinate so (0,0) is bottom-left
          y: gridSize.y - 1 - y,
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

  // Lawnmower states
  const [lawnmowers, setLawnmowers] = useState<Lawnmower[]>([])
  const [activeLawnmowerIndex, setActiveLawnmowerIndex] = useState<number>(-1)

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
    setLawnmowers([])
    setActiveLawnmowerIndex(-1)
    setFinalPositions([])
    setInstructionsText('')
  }

  // Function to prompt for a new file upload
  const promptNewFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  // Function to handle direct text input
  const handleInstructionsInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setInstructionsText(text)
    processInstructions(text)
  }

  // This is the updated processInstructions function with flexible position parsing

  const processInstructions = (text: string) => {
    try {
      console.log('Raw text content:', text)

      // Normalize line breaks to handle different OS formats
      const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

      // Split by lines and filter empty lines
      const lines = normalizedText
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)

      console.log('Parsed lines:', lines)

      if (lines.length < 3) {
        throw new Error(
          'Instructions need at least 3 lines (grid size + first mower position and instructions)'
        )
      }

      // Parse the grid size from the first line
      const gridLine = lines[0].trim()
      console.log('Grid line:', gridLine)

      if (gridLine.length !== 2) {
        throw new Error(
          `Invalid grid dimensions format - should be two digits with no space (e.g. "55"), got "${gridLine}"`
        )
      }

      const newGridSize = {
        x: parseInt(gridLine[0]),
        y: parseInt(gridLine[1]),
      }

      if (isNaN(newGridSize.x) || isNaN(newGridSize.y) || newGridSize.x < 1 || newGridSize.y < 1) {
        throw new Error('Invalid grid dimensions - should be positive numbers')
      }

      // Parse lawnmower instructions
      const newLawnmowers: Lawnmower[] = []

      for (let i = 1; i < lines.length; i += 2) {
        if (i + 1 >= lines.length) break

        // Parse position line (format can be either "XY D" or "X Y D" where D is direction)
        const positionLine = lines[i].trim()
        const positionParts = positionLine.split(' ').filter(part => part.length > 0)

        console.log(`Position line ${i}:`, positionLine)
        console.log(`Position parts:`, positionParts)

        // Handle both formats: "XY D" or "X Y D"
        let x: number
        let y: number
        let direction: Direction

        if (positionParts.length === 2) {
          // Format is "XY D" - coordinates without space, then direction
          if (positionParts[0].length !== 2) {
            throw new Error(
              `Invalid position format at line ${i + 1} - should be "XY D" or "X Y D", got "${positionLine}"`
            )
          }

          x = parseInt(positionParts[0][0])
          y = parseInt(positionParts[0][1])
          direction = positionParts[1] as Direction
        } else if (positionParts.length === 3) {
          // Format is "X Y D" - coordinates with space, then direction
          x = parseInt(positionParts[0])
          y = parseInt(positionParts[1])
          direction = positionParts[2] as Direction
        } else {
          throw new Error(
            `Invalid lawnmower position format at line ${i + 1} - should be "XY D" or "X Y D", got "${positionLine}"`
          )
        }

        if (isNaN(x) || isNaN(y)) {
          throw new Error(
            `Invalid position coordinates at line ${i + 1} - X and Y should be numbers, got "${x}" and "${y}"`
          )
        }

        if (!['N', 'E', 'S', 'W'].includes(direction)) {
          throw new Error(
            `Invalid direction at line ${i + 1} - should be one of N, E, S, W, got "${direction}"`
          )
        }

        // Validate position is within grid
        if (x >= newGridSize.x || y >= newGridSize.y || x < 0 || y < 0) {
          throw new Error(
            `Lawnmower position (${x},${y}) out of bounds at line ${i + 1} - grid is ${newGridSize.x}x${newGridSize.y}`
          )
        }

        // Parse instructions line (should contain only L, R, F)
        const instructionsLine = lines[i + 1].trim()
        console.log(`Instructions line ${i + 2}:`, instructionsLine)

        for (const char of instructionsLine) {
          if (!['L', 'R', 'F'].includes(char)) {
            throw new Error(
              `Invalid instruction "${char}" at line ${i + 2} - should only contain L, R, F`
            )
          }
        }

        newLawnmowers.push({
          x,
          y,
          direction,
          instructions: instructionsLine,
        })
      }

      if (newLawnmowers.length === 0) {
        throw new Error('No valid lawnmower configurations found')
      }

      // Set the new grid size and reset the grid
      setGridSize(newGridSize)

      // Use a callback form of setState to avoid stale closures
      setTimeout(() => {
        setLawnGrid(prev => {
          // Initialize a new grid with the new dimensions
          const initialGrid: LawnCell[][] = []
          for (let y = 0; y < newGridSize.y; y++) {
            const row: LawnCell[] = []
            for (let x = 0; x < newGridSize.x; x++) {
              row.push({
                x,
                y: newGridSize.y - 1 - y, // Reverse y-coordinate so (0,0) is bottom-left
                isMown: false,
              })
            }
            initialGrid.push(row)
          }
          return initialGrid
        })

        // Set lawnmowers
        setLawnmowers(newLawnmowers)

        // Mark file as processed
        setFileUploaded(true)

        toast({
          title: 'Instructions validées',
          description: `Configuration chargée: grille ${newGridSize.x}x${newGridSize.y}, ${newLawnmowers.length} tondeuse(s)`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }, 10)
    } catch (error) {
      console.error('Processing error:', error)
      toast({
        title: 'Erreur de traitement',
        description: `${error instanceof Error ? error.message : 'Format des instructions invalide'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Function to handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      // Read the file content
      const text = await file.text()
      setInstructionsText(text)
      setFileName(file.name)

      // Process the instructions
      processInstructions(text)
    } catch (error) {
      console.error('File reading error:', error)
      toast({
        title: 'Erreur de lecture du fichier',
        description: `${error instanceof Error ? error.message : 'Format de fichier invalide'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // State for tracking whether sound is playing
  const [isSoundPlaying, setIsSoundPlaying] = useState(false)
  // State for tracking if mowing is in progress
  const [isMowing, setIsMowing] = useState(false)
  // Store final positions for display
  const [finalPositions, setFinalPositions] = useState<string[]>([])

  // Function to silence the audio
  const silenceAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsSoundPlaying(false)
    }
  }

  // Function to move the lawnmower based on instruction
  const moveLawnmower = (lawnmower: Lawnmower, instruction: Instruction): Lawnmower => {
    const newLawnmower = { ...lawnmower }

    if (instruction === 'L') {
      // Turn left
      if (newLawnmower.direction === 'N') newLawnmower.direction = 'W'
      else if (newLawnmower.direction === 'E') newLawnmower.direction = 'N'
      else if (newLawnmower.direction === 'S') newLawnmower.direction = 'E'
      else if (newLawnmower.direction === 'W') newLawnmower.direction = 'S'
    } else if (instruction === 'R') {
      // Turn right
      if (newLawnmower.direction === 'N') newLawnmower.direction = 'E'
      else if (newLawnmower.direction === 'E') newLawnmower.direction = 'S'
      else if (newLawnmower.direction === 'S') newLawnmower.direction = 'W'
      else if (newLawnmower.direction === 'W') newLawnmower.direction = 'N'
    } else if (instruction === 'F') {
      // Move forward if possible
      let newX = newLawnmower.x
      let newY = newLawnmower.y

      if (newLawnmower.direction === 'N') newY += 1
      else if (newLawnmower.direction === 'E') newX += 1
      else if (newLawnmower.direction === 'S') newY -= 1
      else if (newLawnmower.direction === 'W') newX -= 1

      // Check if new position is within boundaries
      if (newX >= 0 && newX < gridSize.x && newY >= 0 && newY < gridSize.y) {
        newLawnmower.x = newX
        newLawnmower.y = newY
      }
      // If out of bounds, stay in place but keep the orientation
    }

    return newLawnmower
  }

  // Function to mow the lawn
  const mow = async () => {
    if (lawnmowers.length === 0) {
      toast({
        title: 'Aucune tondeuse configurée',
        description: "Veuillez d'abord charger un fichier d'instructions valide.",
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsMowing(true)
    setFinalPositions([])

    // Play the sound
    if (audioRef.current) {
      audioRef.current.play()
      setIsSoundPlaying(true)

      // Set event listener when audio ends
      audioRef.current.onended = () => {
        if (audioRef.current) {
          // Add this null check
          audioRef.current.play() // Now it's safe
        }
        setIsSoundPlaying(false)
      }
    }

    toast({
      title: "C'est parti !",
      description: 'La tonte de la pelouse a commencé',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })

    try {
      // Process lawnmowers sequentially
      const newFinalPositions: string[] = []

      // Create a fresh copy of lawnmowers to work with
      const workingLawnmowers = [...lawnmowers]

      // Process each lawnmower sequentially
      for (let i = 0; i < workingLawnmowers.length; i++) {
        setActiveLawnmowerIndex(i)

        let currentLawnmower = { ...workingLawnmowers[i] }
        const instructions = currentLawnmower.instructions.split('') as Instruction[]

        // Execute each instruction with a delay
        for (let j = 0; j < instructions.length; j++) {
          // Wait before executing next instruction
          await new Promise(resolve => setTimeout(resolve, 500))

          // Apply the instruction
          currentLawnmower = moveLawnmower(currentLawnmower, instructions[j])

          // Update the lawnmower display
          setLawnmowers(prev => {
            const updated = [...prev]
            updated[i] = { ...currentLawnmower }
            return updated
          })

          // Mark cell as mown if we moved to it
          if (instructions[j] === 'F') {
            setLawnGrid(prevGrid => {
              const newGrid = JSON.parse(JSON.stringify(prevGrid))

              // Find the row index based on the y-coordinate
              const rowIndex = newGrid.findIndex(
                (row: LawnCell[]) => row[0].y === currentLawnmower.y
              )

              if (rowIndex !== -1) {
                const cellIndex = newGrid[rowIndex].findIndex(
                  (cell: LawnCell) => cell.x === currentLawnmower.x && cell.y === currentLawnmower.y
                )

                if (cellIndex !== -1) {
                  newGrid[rowIndex][cellIndex].isMown = true
                }
              }

              return newGrid
            })
          }
        }

        // Record the final position
        newFinalPositions.push(
          `Pour la tondeuse ${i + 1} [${currentLawnmower.x}, ${currentLawnmower.y}] et orientation ${currentLawnmower.direction}`
        )
      }

      // All lawnmowers have finished
      setFinalPositions(newFinalPositions)
      setIsMowing(false)
      silenceAudio()

      toast({
        title: 'Terminé !',
        description: 'La tonte de la pelouse est terminée',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Mowing error:', error)
      setIsMowing(false)
      silenceAudio()

      toast({
        title: "Erreur d'exécution",
        description: `${error instanceof Error ? error.message : "Une erreur est survenue lors de l'exécution"}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Function to render the appropriate direction arrow
  const renderDirectionArrow = (direction: Direction) => {
    switch (direction) {
      case 'N':
        return <FontAwesomeIcon icon={faArrowUp} color="#E53E3E" size="lg" />
      case 'E':
        return <FontAwesomeIcon icon={faArrowRight} color="#E53E3E" size="lg" />
      case 'S':
        return <FontAwesomeIcon icon={faArrowDown} color="#E53E3E" size="lg" />
      case 'W':
        return <FontAwesomeIcon icon={faArrowLeft} color="#E53E3E" size="lg" />
      default:
        return null
    }
  }

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={6} align="stretch">
        {/* File Upload and Instructions Input Section */}
        <Box borderRadius="md" bg="black" p={4}>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Chargez vos instructions (fichier en .txt)</FormLabel>
              <Input
                type="file"
                ref={fileInputRef}
                accept=".txt"
                onChange={handleFileUpload}
                pt={1}
                height="auto"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Ou entrez vos instructions manuellement</FormLabel>
              <Textarea
                placeholder="Format attendu:
55
44 S
LFRRFFLFRFF
22 N
FFRLLRFRLF"
                value={instructionsText}
                onChange={handleInstructionsInput}
                height="120px"
              />
              <Text fontSize="xs" mt={1} color="gray.500">
                Première ligne: dimensions (XY), puis pour chaque tondeuse: position (X Y D) et
                instructions (L/R/F)
              </Text>
            </FormControl>

            <VStack spacing={3} align="stretch">
              <Button
                colorScheme="blue"
                onClick={mow}
                w="full"
                isDisabled={isMowing || !fileUploaded}
              >
                {isMowing ? 'Tonte en cours...' : 'Lancer la tonte'}
              </Button>

              <HStack>
                <Button colorScheme="gray" onClick={resetLawn} w="full" isDisabled={isMowing}>
                  Réinitialiser
                </Button>

                {isSoundPlaying && (
                  <Button colorScheme="red" onClick={silenceAudio} w="full">
                    Couper le son
                  </Button>
                )}
              </HStack>
            </VStack>
          </VStack>
        </Box>

        {/* Final positions display */}
        {finalPositions.length > 0 && (
          <Box borderRadius="md" bg="black" p={4}>
            <Text fontWeight="bold" mb={2}>
              Positions finales :
            </Text>
            {finalPositions.map((position, index) => (
              <Text key={index}>{position}</Text>
            ))}
          </Box>
        )}

        {/* Audio Element (hidden) */}
        <audio ref={audioRef} src="/lawn-mower-03.mp3" style={{ display: 'none' }} />

        {/* Lawn Grid */}
        <Box mx="auto" borderRadius="md" bg="black" boxShadow="md" width="100%">
          <VStack spacing={4} width="100%">
            {/* The lawn grid */}
            <Grid templateColumns={`repeat(${gridSize.x}, 1fr)`} gap={0} width="100%">
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
                      position="relative"
                    >
                      {/* Render the lawnmower arrow if this cell contains one */}
                      {lawnmowers.map((lawnmower, index) =>
                        lawnmower.x === cell.x && lawnmower.y === cell.y ? (
                          <Box
                            key={index}
                            position="relative"
                            zIndex="1"
                            opacity={
                              index === activeLawnmowerIndex || activeLawnmowerIndex === -1
                                ? 1
                                : 0.3
                            }
                          >
                            {renderDirectionArrow(lawnmower.direction)}
                          </Box>
                        ) : null
                      )}
                    </GridItem>
                  </Tooltip>
                ))
              )}
            </Grid>

            {/* Legend */}
            <Flex justifyContent="center" gap={4} mt={2} flexWrap="wrap">
              <Flex alignItems="center" gap={2}>
                <Box w="16px" h="16px" bg={mownColor} borderRadius="sm"></Box>
                <Text fontSize="sm">Tondu</Text>
              </Flex>
              <Flex alignItems="center" gap={2}>
                <Box w="16px" h="16px" bg={unmownColor} borderRadius="sm"></Box>
                <Text fontSize="sm">Hautes herbes</Text>
              </Flex>
              <Flex alignItems="center" gap={2}>
                <Box display="flex" alignItems="center" justifyContent="center" w="16px" h="16px">
                  <FontAwesomeIcon icon={faArrowUp} color="#E53E3E" />
                </Box>
                <Text fontSize="sm">Orientation de la tondeuse</Text>
              </Flex>
            </Flex>

            <Text fontSize="sm" color="gray.400">
              Cliquer sur une parcelle pour la tondre manuellement.
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}
