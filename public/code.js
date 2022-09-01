(
    () => {
        const app = document.querySelector(".app");
	const socket = new WebSocket('ws://localhost:8080/');

        app.querySelector('.chat-screen #send-message').addEventListener("click", () => {
            const message = app.querySelector('.chat-screen #message-input').value;
            const username = app.querySelector('.chat-screen #alias-input').value;
		console.log("yo");
            if (message.length == 0 || username.length == 0) {
                return;
            }
		console.log("hey");
            uname = username;
            const time = new Date();
            const msgObj = {
                username: username,
                text: message,
                timestamp: `${time.getHours()}:${time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes()}`
            }
            renderMessage("my", msgObj);
            socket.send(JSON.stringify(msgObj));
            app.querySelector('.chat-screen #message-input').value = "";
        });

        socket.onmessage = (event) => {
            renderMessage("other", JSON.parse(event.data));
        }

        function renderMessage(type, message) {
            const messageContainer = app.querySelector(".chat-screen .messages");
            if (type == "my") {
                const el = document.createElement("div");
                el.setAttribute("class", "message my-message");
                el.innerHTML = `
                    <div>
                        <div class="name">You ${message.timestamp}</div>
                        <div class="text">${message.text}</div>
                    </div>
                `;
                messageContainer.appendChild(el);
            } else {
                const el = document.createElement("div");
                el.setAttribute("class", "message other-message");
                el.innerHTML = `
                    <div>
                        <div class="name">${message.username} ${message.timestamp}</div>
                        <div class="text">${message.text}</div>
                    </div>
                `;
                messageContainer.appendChild(el);
            }
            messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
        };
    }
)();
