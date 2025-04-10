from flask import Flask, request, jsonify, send_from_directory
import os
import time

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# API endpoint to save drawings
@app.route('/save-drawing', methods=['POST'])
def save_drawing():
    try:
        data = request.json
        svg_content = data.get('svg', '')
        
        if not svg_content:
            return jsonify({'success': False, 'error': 'No SVG content provided'}), 400
        
        # Create saved_drawings directory if it doesn't exist
        if not os.path.exists('saved_drawings'):
            os.makedirs('saved_drawings')
        
        # Generate filename with timestamp
        timestamp = time.strftime('%Y%m%d-%H%M%S')
        filename = f'saved_drawings/drawing-{timestamp}.svg'
        
        # Save the SVG file
        with open(filename, 'w') as f:
            f.write(svg_content)
        
        return jsonify({
            'success': True,
            'filename': filename
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
