import "./chabox.css"
import React, { useState } from "react"
import ChatAI from "./ChatAI"

function ChatAIa() {
    return (
        <div>
            <main>
                <section class="chatbot-container">
                    <div class="chatbot-header">
                        <img src="images/owl-logo.png" class="logo" />
                        <h1>KnowItAll</h1>
                        <h2>Ask me anything!</h2>
                        <p class="supportId">User ID: 2344</p>
                    </div>
                    <div
                        class="chatbot-conversation-container"
                        id="chatbot-conversation"
                    >
                        <div class="speech speech-ai">How can I help you?</div>
                    </div>
                    <form id="form" class="chatbot-input-container">
                        <input
                            name="user-input"
                            type="text"
                            id="user-input"
                            required
                        />
                        <button id="submit-btn" class="submit-btn">
                            <img
                                src="images/send-btn-icon.png"
                                class="send-btn-icon"
                            />
                        </button>
                    </form>
                </section>
            </main>
        </div>
    )
}

export default ChatAIa
