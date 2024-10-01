addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
    }

    const [client, server] = new WebSocketPair();
    handleWebSocketSession(server);

    return new Response(null, {
        status: 101,
        webSocket: client,
    });
}

function handleWebSocketSession(webSocket) {
    webSocket.accept();

    let n = BigInt(3);
    let step = 0;
    const totalSteps = 100;
    let expectedHash = hash512((n + BigInt(1)) ** n);

    webSocket.addEventListener("message", async (msg) => {
        const clientHash = msg.data;

        if (step < totalSteps) {
            const computedHash = await expectedHash;

            if (clientHash === computedHash) {
                webSocket.send("accepted, please proceed");
                step++;

                n += BigInt(1);
                expectedHash = hash512((n + BigInt(1)) ** n);

                if (step === totalSteps) {
                    webSocket.send(
                        "Good Job, ping t.me/strukov with screenshot",
                    );
                    webSocket.close(1000, "Challenge complete");
                }
            } else {
                webSocket.send("failed");
                webSocket.close(1008, "Incorrect hash");
            }
        }
    });

    webSocket.addEventListener("close", () => {
        console.log("WebSocket closed");
    });
}

function hash512(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.toString());

    return crypto.subtle.digest("SHA-512", data).then((hashBuffer) => {
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    });
}
