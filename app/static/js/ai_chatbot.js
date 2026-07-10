document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chatForm");
    const chatQuestion = document.getElementById("chatQuestion");
    const chatWindow = document.getElementById("chatWindow");
    const promptButtons = document.querySelectorAll("[data-prompt]");

    if (!chatForm || !chatQuestion || !chatWindow) {
        return;
    }

    const scrollToBottom = () => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    };

    const addMessage = (message, sender = "bot") => {
        const row = document.createElement("div");
        row.className = `chat-message ${sender}`;

        if (sender === "bot") {
            const avatar = document.createElement("div");
            avatar.className = "chat-avatar";
            avatar.innerHTML = '<i class="bi bi-stars"></i>';
            row.appendChild(avatar);
        }

        const bubble = document.createElement("div");
        bubble.className = "chat-bubble";
        bubble.textContent = message;
        row.appendChild(bubble);

        chatWindow.appendChild(row);
        scrollToBottom();

        return bubble;
    };

    const askQuestion = async (question) => {
        const cleanQuestion = question.trim();

        if (!cleanQuestion) {
            return;
        }

        addMessage(cleanQuestion, "user");
        chatQuestion.value = "";

        const loadingBubble = addMessage("Checking local ERP data...", "bot");

        try {
            const response = await fetch("/ai-chatbot/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question: cleanQuestion }),
            });

            if (!response.ok) {
                throw new Error("Request failed");
            }

            const data = await response.json();
            loadingBubble.textContent = data.answer || "I could not find a clear answer for that question.";
        } catch (error) {
            loadingBubble.textContent = "I could not read the ERP data right now. Please try again.";
        }
    };

    chatForm.addEventListener("submit", (event) => {
        event.preventDefault();
        askQuestion(chatQuestion.value);
    });

    promptButtons.forEach((button) => {
        button.addEventListener("click", () => {
            askQuestion(button.dataset.prompt || "");
        });
    });
});
