document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const clearButton = document.getElementById('ClearChat');

    clearButton.addEventListener('click', () => {
        chatMessages.innerHTML = '';
        addMessage('こんにちは！都市名を入力して\n天気とおすすめの服装を確認してください！', 'bot');
    });

    userInput.addEventListener('focus', () => {
        clearButton.classList.add('hidden');
        userInput.focus();
    });

    userInput.addEventListener('blur', () => {
        clearButton.classList.remove('hidden');
    });

    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const city = userInput.value.trim();
        if (city) {
            addMessage(city, 'user');
            userInput.value = '';
            fetchWeather(city);
        }
    });

    function addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = sender === 'user' ? 'You' : 'AI';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function fetchWeather(city) {
        fetch('/api/weather', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ city: city })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                addMessage(data.error, 'bot');
            } else {
                const message = `${city}の天気は${data.weather}で、気温は${data.temp}℃です。${data.advice}`;
                addMessage(message, 'bot');
            }
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            addMessage('天気情報を取得できませんでした。後でもう一度お試しください。', 'bot');
        });
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function fetchLogs() {
        fetch('/api/logs')
        .then(response => response.json())
        .then(data => {
            data.logs.forEach(log => {
                addMessage(log, 'log');
            });
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
        });
    }
});