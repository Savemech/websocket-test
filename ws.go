package main

import (
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/gorilla/websocket"
)

const totalSteps = 100

func main() {
	// Connect to the WebSocket server
	url := "wss://shrill-water-9c29.svx-cf.workers.dev/"
	ws, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		log.Fatal("Error connecting to WebSocket server:", err)
	}
	defer ws.Close()

	fmt.Println("WebSocket connection opened")

	// Define the initial n value
	n := 3
	step := 0

	// Function to send the response based on n value
	sendResponse := func() {
		// Use big.Int to compute (n+1)^n
		nPlusOne := big.NewInt(int64(n + 1))
		exponent := big.NewInt(int64(n))
		nextNumber := new(big.Int).Exp(nPlusOne, exponent, nil) // (n+1)^n

		hash := computeHash(nextNumber)

		// Print both the original number and the hash
		fmt.Printf("Step %d:\n", step+1)
		fmt.Printf("Original number (n+1)^n: %v\n", nextNumber)
		fmt.Printf("Hashed value (SHA-512): %s\n", hash)

		// Send the hash to the WebSocket server
		err := ws.WriteMessage(websocket.TextMessage, []byte(hash))
		if err != nil {
			log.Println("Write message error:", err)
			return
		}
	}

	// Start by sending the first challenge
	sendResponse()

	// Listen for messages from the WebSocket server
	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			log.Println("Read message error:", err)
			return
		}

		data := string(message)
		fmt.Printf("Received from server: %s\n", data)

		if strings.Contains(data, "failed") {
			fmt.Println("Test failed. Closing connection.")
			break
		} else if strings.Contains(data, "accepted") {
			// Proceed to the next step
			step++
			if step < totalSteps {
				// Increment n and send the next correct hash
				n++
				sendResponse()
			}
		} else if strings.Contains(data, "good job") {
			fmt.Println("Challenge completed successfully!")
			break
		}
	}
}

// Function to compute SHA-512 hash
func computeHash(input *big.Int) string {
	strInput := input.String()
	hash := sha512.New()
	hash.Write([]byte(strInput))
	return hex.EncodeToString(hash.Sum(nil))
}
