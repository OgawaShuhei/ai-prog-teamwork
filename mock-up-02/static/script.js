document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const clearButton = document.getElementById('clearButton');

    // ページロード時にメッセージを復元
    loadMessages();

    // クリアボタンをクリックしたときにメッセージを削除
    clearButton.addEventListener('click', () => {
        chatMessages.innerHTML = '';
        fetch('/api/messages', { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                addMessage('メッセージが削除されました。', 'bot');
            })
            .catch(error => {
                console.error('Error deleting messages:', error);
                addMessage('メッセージの削除に失敗しました。', 'bot');
            });
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

    function loadMessages() {
        fetch('/api/messages')
        .then(response => response.json())
        .then(messages => {
            messages.forEach(msg => addMessage(msg.message, msg.sender));
        })
        .catch(error => {
            console.error('Error loading messages:', error);
        });
    }
});