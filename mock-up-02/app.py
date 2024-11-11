import logging
from flask import Flask, render_template, request, jsonify
import requests
from googletrans import Translator

app = Flask(__name__)

API_KEY = '1c33c613c2357110a08a8964f4aa621f'  # ここにOpenWeatherMapのAPIキーを入力

# Googletrans Translatorの初期化
translator = Translator()

# ログの設定
logging.basicConfig(filename='app.log', level=logging.INFO, format='%(asctime)s - %(message)s')

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
        
        # ログに記録
        logging.info(f"User input: {city}, Translated: {translated_city}, Weather: {weather}, Temp: {temp}, Advice: {advice}")
        
        return jsonify({'weather': weather, 'temp': temp, 'advice': advice})
    else:
        logging.error(f"City not found: {city}")
        return jsonify({'error': '都市が見つかりませんでした。'}), 404

@app.route('/api/translate', methods=['POST'])
def translate_text():
    data = request.json
    text = data.get('text')
    target_language = data.get('target_language')
    if not text or not target_language:
        return jsonify({'error': '翻訳するテキストまたはターゲット言語が指定されていません。'}), 400

    # 翻訳を実行
    result = translator.translate(text, dest=target_language)
    
    # ログに記録
    logging.info(f"Text: {text}, Translated to {target_language}: {result.text}")
    
    return jsonify({'translatedText': result.text})

def get_clothing_advice(temp):
    if temp <= 0.0:
        return {
            "advice": "非常に寒いです。モフモフのコートやダウンジャケット、マフラー、手袋を着用してください。",
            "image_url": "https://hokkaido-labo.com/wp-content/uploads/2024/02/outfitofwintermv.jpg"
        }
    elif 0.1 <= temp <= 5.0:
        return {
            "advice": "寒いです。ダウンコートやジャケット、マフラー、手袋を着用してください。",
            "image_url": "https://img.benesse-cms.jp/thank-you/item/image/normal/cfbbc85f-57dd-4909-8b25-d5583c5a24f1.jpg?w=720&h=540&resize_type=cover&resize_mode=force"
        }
    elif 5.1 <= temp <= 8.0:
        return {
            "advice": "少し寒いです。ジャケットやコート、マフラー、手袋を着用してください。",
            "image_url": "https://img.benesse-cms.jp/thank-you/item/image/normal/03ca3771-7d35-4fd4-961f-11c3a9b0cb12.jpg?w=720&h=540&resize_type=cover&resize_mode=force"
        }
    elif 8.1 <= temp <= 13.0:
        return {
            "advice": "肌寒いです。ジャケットやコートを着用してください。",
            "image_url": "https://www.plst.com/jp/ja/news/topics/2023110201/img/18T_231101Zf0KQM.jpg"
        }
    elif 13.1 <= temp <= 16.0:
        return {
            "advice": "晴れで無風なら軽い羽織り物でOKですが、風がある場合はジャケットやコートを着用してください。",
            "image_url": "https://cdn-ua.clipkit.co/tenants/1/articles/images/000/005/578/large/2f442f53-3ea2-45aa-9fa3-11efc45b32f8.png?1724226892&p=t"
        }
    elif 16.1 <= temp <= 19.0:
        return {
            "advice": "晴れで風がなければカーディガンでOKですが、風がある場合はジャケットや薄手のコートを着用してください。",
            "image_url": "https://image.veryweb.jp/wp-content/uploads/2023/11/00-1.jpg"
        }
    elif 19.1 <= temp <= 22.0:
        return {
            "advice": "快適な気温です。晴れで風がなければ上着なしでOKですが、長袖の服が良いでしょう。",
            "image_url": "https://precious.ismcdn.jp/mwimgs/4/5/-/img_4562c70d042456ebbc76b8a3f30da43370153.jpg"
        }
    elif 22.1 <= temp <= 24.0:
        return {
            "advice": "半袖で過ごせますが、薄いカーディガンがあると安心です。",
            "image_url": "https://example.com/images/warm.png"
        }
    else:
        return {
            "advice": "暑いです。半袖で過ごせます。",
            "image_url": "https://example.com/images/hot.png"
        }

if __name__ == '__main__':
    app.run(debug=True)