import os
from flask import Flask, render_template, request, jsonify, session
import requests
from googletrans import Translator

app = Flask(__name__)
app.secret_key = os.urandom(24)  # セッションのための秘密鍵

API_KEY = '1c33c613c2357110a08a8964f4aa621f'  # ここにOpenWeatherMapのAPIキーを入力

# Googletrans Translatorの初期化
translator = Translator()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/weather', methods=['POST'])
def get_weather():
    data = request.json
    city = data.get('city')
    if not city:
        return jsonify({'error': '都市名が指定されていません。'}), 400

    # 日本語の都市名を英語に翻訳
    translated_city = translator.translate(city, dest='en').text

    url = f'http://api.openweathermap.org/data/2.5/weather?q={translated_city}&appid={API_KEY}&units=metric&lang=ja'
    response = requests.get(url)
    if response.status_code == 200:
        weather_data = response.json()
        weather = weather_data['weather'][0]['description']
        temp = weather_data['main']['temp']
        advice = get_clothing_advice(temp)
        
        # メッセージをセッションに保存
        message = f"{city}の天気は{weather}で、気温は{temp}℃です。{advice}"
        if 'messages' not in session:
            session['messages'] = []
        session['messages'].append({'sender': 'bot', 'message': message})
        
        return jsonify({'weather': weather, 'temp': temp, 'advice': advice})
    else:
        return jsonify({'error': '都市が見つかりませんでした。'}), 404

@app.route('/api/messages', methods=['GET'])
def get_messages():
    return jsonify(session.get('messages', []))

def get_clothing_advice(temp):
    if temp <= 0.0:
        return "非常に寒いです。モフモフのコートやダウンジャケット、マフラー、手袋を着用してください。"
    elif 0.1 <= temp <= 5.0:
        return "寒いです。ダウンコートやジャケット、マフラー、手袋を着用してください。"
    elif 5.1 <= temp <= 8.0:
        return "少し寒いです。ジャケットやコート、マフラー、手袋を着用してください。"
    elif 8.1 <= temp <= 13.0:
        return "肌寒いです。ジャケットやコートを着用してください。"
    elif 13.1 <= temp <= 16.0:
        return "晴れで無風なら軽い羽織り物でOKですが、風がある場合はジャケットやコートを着用してください。"
    elif 16.1 <= temp <= 19.0:
        return "晴れで風がなければカーディガンでOKですが、風がある場合はジャケットや薄手のコートを着用してください。"
    elif 19.1 <= temp <= 22.0:
        return "快適な気温です。晴れで風がなければ上着なしでOKですが、長袖の服が良いでしょう。"
    elif 22.1 <= temp <= 24.0:
        return "半袖で過ごせますが、薄いカーディガンがあると安心です。"
    else:
        return "暑いです。半袖で過ごせます。"

if __name__ == '__main__':
    app.run(debug=True)