document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const clearButton = document.getElementById('clearButton');
    const saveShortcutButton = document.getElementById('saveShortcutButton');
    const reloadButton = document.getElementById('reloadButton');
    const shortcuts = document.getElementById('shortcuts');

    // ページロード時にメッセージを復元
    loadMessages();
    loadShortcuts();

    // イベントリスナーの設定
    clearButton.addEventListener('click', clearMessages);
    saveShortcutButton.addEventListener('click', saveShortcut);
    reloadButton.addEventListener('click', () => location.reload());
    chatForm.addEventListener('submit', handleChatSubmit);

    // メッセージを追加する関数
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

    // メッセージをクリアする関数
    function clearMessages() {
        // 最初のボットメッセージを保存
        const initialBotMessage = chatMessages.querySelector('.bot-message');
        
        // チャットメッセージをクリア
        chatMessages.innerHTML = '';
        
        // 最初のボットメッセージを復元
        if (initialBotMessage) {
            chatMessages.appendChild(initialBotMessage.cloneNode(true));
        }
        
        // サーバー側のメッセージ履歴をクリア
        fetch('/api/messages', { method: 'DELETE' })
            .then(response => response.json())
            .then(() => addMessage('チャット履歴が削除されました。', 'bot'))
            .catch(error => {
                console.error('Error deleting messages:', error);
                addMessage('チャット履歴の削除に失敗しました。', 'bot');
            });
    }

    // ショートカットを保存する関数
    function saveShortcut(e) {
        e.preventDefault(); // フォームの送信を防止
        const city = userInput.value.trim();
        if (city) {
            addShortcut(city);
            addMessage(`${city}がショートカットに登録されました。`, 'bot');
            userInput.value = ''; // 入力フィールドをクリア
        } else {
            addMessage('ショートカットに登録する都市名を入力してください。', 'bot');
        }
    }

    // チャットの送信を処理する関数
    function handleChatSubmit(e) {
        e.preventDefault();
        const city = userInput.value.trim();
        if (city) {
            addMessage(city, 'user');
            fetchWeather(city);
            userInput.value = ''; // 入力フィールドをクリア
        }
    }

    // 服装画像のパスを定義
    const CLOTHING_IMAGES = {
        male: {
            sunny: {
                hot: '/static/img/male/sunny/hot.jpg',
                warm: '/static/img/male/sunny/warm.jpg',
                cold: '/static/img/male/sunny/cold.jpg',
                freezing: '/static/img/male/sunny/freezing.jpg'
            },
            rain: {
                hot: '/static/img/male/rain/hot.jpg',
                warm: '/static/img/male/rain/warm.jpg',
                cold: '/static/img/male/rain/cold.jpg'
            },
            cloudy: {
                hot: '/static/img/male/cloudy/hot.jpg',
                warm: '/static/img/male/cloudy/warm.jpg',
                cold: '/static/img/male/cloudy/cold.jpg',
                freezing: '/static/img/male/cloudy/freezing.jpg'
            },
            snow: {
                cold: '/static/img/male/snow/cold.jpg',
                freezing: '/static/img/male/snow/freezing.jpg'
            }
        },
        female: {
            sunny: {
                hot: '/static/img/female/sunny/hot.jpg',
                warm: '/static/img/female/sunny/warm.jpg',
                cold: '/static/img/female/sunny/cold.jpg',
                freezing: '/static/img/female/sunny/freezing.jpg'
            },
            rain: {
                hot: '/static/img/female/rain/hot.jpg',
                warm: '/static/img/female/rain/warm.jpg',
                cold: '/static/img/female/rain/cold.jpg'
            },
            cloudy: {
                hot: '/static/img/female/cloudy/hot.jpg',
                warm: '/static/img/female/cloudy/warm.jpg',
                cold: '/static/img/female/cloudy/cold.jpg',
                freezing: '/static/img/female/cloudy/freezing.jpg'
            },
            snow: {
                cold: '/static/img/female/snow/cold.jpg',
                freezing: '/static/img/female/snow/freezing.jpg'
            }
        }
    };

    // 天気情報を取得する関数
    function fetchWeather(city) {
        const isFemale = document.getElementById('genderToggle').checked;
        
        fetch('/api/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                city: city,
                isFemale: isFemale 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                addMessage(data.error, 'bot');
            } else {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message bot-message';

                const avatar = document.createElement('div');
                avatar.className = 'avatar';
                avatar.textContent = 'AI';

                const content = document.createElement('div');
                content.className = 'message-content';

                // テキストメッセージを追加
                const textDiv = document.createElement('div');
                textDiv.textContent = `${city}の天気は${data.weather}で、気温は${data.temp}℃です。${data.advice}`;
                content.appendChild(textDiv);

                // 画像パスを取得
                const gender = isFemale ? 'female' : 'male';
                const weather = getWeatherCategory(data.weather);
                const tempRange = getTempCategory(parseInt(data.temp));
                const imagePath = CLOTHING_IMAGES[gender][weather][tempRange];

                // 画像を追加
                const image = document.createElement('img');
                image.src = imagePath;
                image.alt = '推奨される服装';
                image.className = 'clothing-image';
                content.appendChild(image);

                messageDiv.appendChild(avatar);
                messageDiv.appendChild(content);
                chatMessages.appendChild(messageDiv);
                scrollToBottom();
            }
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            addMessage('天気情報を取得できませんでした。後でもう一度お試しください。', 'bot');
        });
    }

    // 天候カテゴリを取得する関数
    function getWeatherCategory(weather) {
        if (weather.includes('雨')) return 'rain';
        if (weather.includes('雪')) return 'snow';
        if (weather.includes('曇')) return 'cloudy';
        if (weather.includes('晴')) return 'sunny';
        return 'sunny'; // デフォルト
    }

    // 気温カテゴリを取得する関数を修正
    function getTempCategory(temp) {
        if (temp >= 30) return 'hot';
        if (temp >= 20) return 'warm';
        if (temp >= 10) return 'cold';
        return 'freezing';
    }

    // スクロールを下に移動する関数
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // メッセージをロードする関数
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

    // ショートカットをロードする関数
    function loadShortcuts() {
        shortcuts.innerHTML = ''; // 現在のショートカットをクリア
        const savedShortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
        savedShortcuts.forEach(city => addShortcut(city));
    }

    // ショートカットを追加する関数
    function addShortcut(city) {
        const li = document.createElement('li');
        
        // 都市名用のspan要素を作成
        const citySpan = document.createElement('span');
        citySpan.textContent = city;
        li.appendChild(citySpan);

        // 削除ボタンを作成
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '削除';
        deleteButton.className = 'delete-btn';
        
        // 削除ボタンのクリックイベント
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // クリックイベントの伝播を停止
            removeShortcut(city);
            li.remove();
        });

        li.appendChild(deleteButton);

        // 都市名クリック時の天気取得
        li.addEventListener('click', () => {
            addMessage(city, 'user');
            fetchWeather(city);
        });

        shortcuts.appendChild(li);

        // ローカルストレージに保存
        let savedShortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
        if (!savedShortcuts.includes(city)) {
            savedShortcuts.push(city);
            localStorage.setItem('shortcuts', JSON.stringify(savedShortcuts));
        }
    }

    // ショートカットを削除する関数
    function removeShortcut(cityToRemove) {
        let savedShortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
        savedShortcuts = savedShortcuts.filter(city => city !== cityToRemove);
        localStorage.setItem('shortcuts', JSON.stringify(savedShortcuts));
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