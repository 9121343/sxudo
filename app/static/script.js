document.addEventListener("DOMContentLoaded", () => {
  // Get elements with null checks
  const startBtn = document.getElementById("start-btn");
  const usernameInput = document.getElementById("username");
  const profileView = document.getElementById("profile-view");
  const chatView = document.getElementById("chat-view");
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const imageInput = document.getElementById("image-input");
  const imageBtn = document.getElementById("image-btn");

  // Verify all elements exist
  if (!startBtn || !usernameInput || !profileView || !chatView ||
    !chatForm || !userInput || !chatBox || !imageInput || !imageBtn) {
    console.error("Critical elements missing from DOM!");
    return;
  }

  // Event listeners with error handling
  try {
    startBtn.addEventListener("click", startChat);
    usernameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") startChat();
    });

    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      sendMessage();
    });

    imageBtn.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", handleImageUpload);
  } catch (error) {
    console.error("Error setting up event listeners:", error);
  }

  function startChat() {
    const username = usernameInput.value.trim();
    if (!username) {
      alert("Please enter your name");
      return;
    }

    profileView.style.display = "none";
    chatView.style.display = "block";
    userInput.focus();
  }

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage("You", message);
    userInput.value = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      addMessage("SXUDO", data.response);
    } catch (error) {
      addMessage("SXUDO", "⚠️ Error connecting to server");
    }
  }

  function addMessage(sender, text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender === "You" ? "user" : "ai"}`;
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function handleImageUpload() {
    const file = imageInput.files[0];
    if (!file) return;

    addMessage("You", "🖼️ Sent an image");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze_image", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      addMessage("SXUDO", data.response);
    } catch (error) {
      addMessage("SXUDO", "⚠️ Failed to process image");
    }
  }
}); 