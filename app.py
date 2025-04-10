from flask import Flask, render_template, request, jsonify
import os
from datetime import datetime

app = Flask(__name__)

# Create a directory for saved drawings if it doesn't exist
SAVED_DRAWINGS_DIR = 'saved_drawings'
if not os.path.exists(SAVED_DRAWINGS_DIR):
    os.makedirs(SAVED_DRAWINGS_DIR)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save-drawing', methods=['POST'])
def save_drawing():
    try:
        data = request.get_json()
        svg_content = data.get('svg')
        
        if svg_content:
            # Generate a unique filename using timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'drawing_{timestamp}.svg'
            filepath = os.path.join(SAVED_DRAWINGS_DIR, filename)
            
            with open(filepath, 'w') as f:
                f.write(svg_content)
            return jsonify({'success': True, 'filename': filename})
        
        return jsonify({'success': False, 'error': 'No SVG content provided'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
