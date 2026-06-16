
import { streamChatResponse } from '../services/geminiService.js';

let isInitialized = false;

const chatbotState = {
    isOpen: false,
    messages: [],
    input: '',
    isLoading: false,
};

function renderChatbot() {
    const body = document.body;
    let container = document.getElementById('chatbot-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'chatbot-container';
        body.appendChild(container);
    }
    
    const messagesHTML = chatbotState.messages.map((msg, index) => `
        <div class="flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4">
            <div class="max-w-xs px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}">
                ${msg.text}
                ${chatbotState.isLoading && msg.sender === 'bot' && index === chatbotState.messages.length - 1 ? '<span class="inline-block w-2 h-4 ml-1 bg-gray-600 animate-pulse"></span>' : ''}
            </div>
        </div>
    `).join('');

    const content = `
        <button
            id="chatbot-toggle"
            class="fixed bottom-8 right-8 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-blue-800 transition-transform transform hover:scale-110 z-50"
            aria-label="Toggle Chatbot"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        </button>
        ${chatbotState.isOpen ? `
            <div class="fixed bottom-24 right-8 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-40 border-2 border-primary">
                <div class="bg-primary text-white p-4 rounded-t-lg">
                    <h3 class="font-bold text-lg">AI Assistant</h3>
                </div>
                <div id="message-list" class="flex-1 p-4 overflow-y-auto bg-gray-50">
                    ${messagesHTML}
                </div>
                <div class="p-4 border-t bg-white rounded-b-lg">
                    <div class="flex">
                        <input
                            type="text"
                            id="chatbot-input"
                            value="${chatbotState.input}"
                            placeholder="Ask a question..."
                            class="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            ${chatbotState.isLoading ? 'disabled' : ''}
                        />
                        <button id="chatbot-send" ${chatbotState.isLoading ? 'disabled' : ''} class="bg-primary text-white px-4 rounded-r-lg hover:bg-blue-800 disabled:bg-gray-400">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
    
    container.innerHTML = content;
    attachEventListeners();

    if(chatbotState.isOpen) {
        const messageList = document.getElementById('message-list');
        messageList.scrollTop = messageList.scrollHeight;
        document.getElementById('chatbot-input')?.focus();
    }
}

async function handleSend() {
    if (chatbotState.input.trim() === '' || chatbotState.isLoading) return;

    chatbotState.messages.push({ sender: 'user', text: chatbotState.input });
    chatbotState.input = '';
    chatbotState.isLoading = true;
    chatbotState.messages.push({ sender: 'bot', text: '' });
    renderChatbot();

    try {
        const stream = await streamChatResponse(chatbotState.messages[chatbotState.messages.length - 2].text);
        let currentBotResponse = '';
        for await (const chunk of stream) {
            currentBotResponse += chunk;
            chatbotState.messages[chatbotState.messages.length - 1].text = currentBotResponse;
            renderChatbot();
        }
    } catch (error) {
        console.error("Gemini API error:", error);
        chatbotState.messages[chatbotState.messages.length - 1].text = 'Sorry, I am having trouble connecting. Please try again later.';
    } finally {
        chatbotState.isLoading = false;
        renderChatbot();
    }
}

function attachEventListeners() {
    document.getElementById('chatbot-toggle').addEventListener('click', () => {
        chatbotState.isOpen = !chatbotState.isOpen;
        if(chatbotState.isOpen && chatbotState.messages.length === 0) {
            chatbotState.messages.push({ sender: 'bot', text: "Hello! I'm the system's AI assistant. How can I help you today?" });
        }
        renderChatbot();
    });

    if (chatbotState.isOpen) {
        const input = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('chatbot-send');
        
        input.addEventListener('input', (e) => chatbotState.input = e.target.value);
        input.addEventListener('keypress', (e) => e.key === 'Enter' && handleSend());
        sendBtn.addEventListener('click', handleSend);
    }
}

export function initChatbot() {
    if (isInitialized) return;
    renderChatbot();
    isInitialized = true;
}