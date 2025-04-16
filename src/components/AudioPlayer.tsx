import React, { useRef } from 'react'

interface AudioPlayerProps {
  src: string
  id?: string
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, id = 'audio-player' }) => {
  const audioRef = useRef<HTMLAudioElement>(null)

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play()
    }
  }

  return (
    <audio ref={audioRef} id={id} style={{ display: 'none' }}>
      <source src={src} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  )
}

export default AudioPlayer
