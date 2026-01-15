import { useState, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

const useVoiceInput = () => {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')

    const startListening = useCallback(async () => {
        setTranscript('')
        setIsListening(true)

        try {
            if (Capacitor.isNativePlatform()) {
                // Native
                const hasPermission = await SpeechRecognition.checkPermissions()

                if (hasPermission.speechRecognition !== 'granted') {
                    await SpeechRecognition.requestPermissions()
                }

                await SpeechRecognition.start({
                    language: "id-ID",
                    maxResults: 1,
                    prompt: "Katakan sesuatu...",
                    partialResults: true,
                    popup: false,
                })

                SpeechRecognition.addListener('partialResults', (data) => {
                    if (data.matches && data.matches.length > 0) {
                        setTranscript(data.matches[0])
                    }
                })

            } else {
                // Web Fallback
                const SpeechRecognitionWeb = window.SpeechRecognition || window.webkitSpeechRecognition
                if (!SpeechRecognitionWeb) {
                    alert("Browser tidak support voice input")
                    setIsListening(false)
                    return
                }

                const recognition = new SpeechRecognitionWeb()
                recognition.lang = 'id-ID'
                recognition.continuous = false
                recognition.interimResults = true

                recognition.onresult = (event) => {
                    const text = event.results[0][0].transcript
                    setTranscript(text)
                }

                recognition.onend = () => setIsListening(false)
                recognition.start()
            }
        } catch (error) {
            console.error("Voice Error:", error)
            setIsListening(false)
        }
    }, [])

    const stopListening = useCallback(async () => {
        if (Capacitor.isNativePlatform()) {
            await SpeechRecognition.stop()
        }
        setIsListening(false)
    }, [])

    return { isListening, transcript, startListening, stopListening }
}

export default useVoiceInput
