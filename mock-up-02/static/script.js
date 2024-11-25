document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const clearButton = document.getElementById('clearButton');
    const saveShortcutButton = document.querySelector('#chat-form #saveShortcutButton');
    const reloadButton = document.getElementById('reloadButton');
    const shortcuts = document.getElementById('shortcuts');

    // ページロード時にメッセージを復元
    loadMessages();
    loadShortcuts();

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

    // ショートカット登録ボタンをクリックしたときにショートカットを保存
    saveShortcutButton.addEventListener('click', (e) => {
        e.preventDefault(); // フォームの送信を防止
        const city = userInput.value.trim();
        if (city) {
            saveShortcut(city);
            addMessage(`${city}がショートカットに登録されました。`, 'bot');
        } else {
            addMessage('ショートカットに登録する都市名を入力してください。', 'bot');
        }
    });

    // リロードボタンをクリックしたときにページをリロード
    reloadButton.addEventListener('click', () => {
        location.reload();
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

    function saveShortcut(city) {
        let savedShortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
        if (!savedShortcuts.includes(city)) {
            if (savedShortcuts.length >= 3) {
                savedShortcuts.shift(); // 先頭のショートカットを削除
            }
            savedShortcuts.push(city);
            localStorage.setItem('shortcuts', JSON.stringify(savedShortcuts));
            loadShortcuts(); // ショートカットを再読み込み
        }
    }

    function loadShortcuts() {
        shortcuts.innerHTML = ''; // 現在のショートカットをクリア
        const savedShortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
        savedShortcuts.forEach(city => addShortcut(city));
    }

    function addShortcut(city) {
        const li = document.createElement('li');
        li.textContent = city;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '削除';
        deleteButton.className = 'delete-btn';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // イベントのバブリングを防止
            removeShortcut(city);
        });

        li.appendChild(deleteButton);
        li.addEventListener('click', () => {
            addMessage(city, 'user');
            fetchWeather(city);
        });

        shortcuts.appendChild(li);
    }

    function removeShortcut(city) {
        let savedShortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
        savedShortcuts = savedShortcuts.filter(item => item !== city);
        localStorage.setItem('shortcuts', JSON.stringify(savedShortcuts));
        loadShortcuts(); // ショートカットを再読み込み
    }

    // ハンバーガーメニューの制御を追加
    const menuToggle = document.getElementById('menuToggle');
    const menuContent = document.getElementById('menuContent');

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        menuContent.classList.toggle('active');
    });

    // メニュー外をクリックした時に閉じる
    document.addEventListener('click', (e) => {
        if (!menuContent.contains(e.target) && !menuToggle.contains(e.target)) {
            menuToggle.classList.remove('active');
            menuContent.classList.remove('active');
        }
    });
});