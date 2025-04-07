from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save-drawing', methods=['POST'])
def save_drawing():
    data = request.get_json()
    svg_content = data.get('svg')
    
    if svg_content:
        with open('saved_drawing.svg', 'w') as f:
            f.write(svg_content)
        return jsonify({'success': True})
    
    return jsonify({'success': False}), 400

if __name__ == '__main__':
    app.run(debug=True)
