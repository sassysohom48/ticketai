# -*- coding: utf-8 -*-
import sys, io, os
# Force UTF-8 stdout on Windows only (not in serverless environments)
if os.name == 'nt' and hasattr(sys.stdout, 'buffer'):
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from model_loader import ModelLoader

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# In-memory ticket store
tickets = []

# Load model at startup
print("=" * 50, flush=True)
print("  AI Ticket Router - Loading Model...", flush=True)
print("=" * 50, flush=True)
model = ModelLoader()
print(f"  Model type : {model.model_type}", flush=True)
print(f"  Status     : {'Ready' if model.is_loaded else 'Error'}", flush=True)
print("=" * 50, flush=True)


# ─────────────────────────────────────────────
# GET /health
# ─────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "running",
        "model": model.model_type,
        "tickets_processed": len(tickets)
    })


# ─────────────────────────────────────────────
# POST /predict
# ─────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        subject = str(data.get('subject', '')).strip()
        message = str(data.get('message', '')).strip()

        if not subject and not message:
            return jsonify({"error": "subject or message is required"}), 400

        combined = f"{subject}. {message}".strip('. ')
        department, confidence = model.predict(combined)

        ticket = {
            "id": str(uuid.uuid4())[:8].upper(),
            "subject": subject or "(No subject)",
            "message": message[:500],
            "department": department,
            "confidence": round(float(confidence), 4),
            "timestamp": datetime.now().isoformat(),
            "overridden": False,
            "original_department": department,
            "status": "Open"
        }
        tickets.append(ticket)

        return jsonify({
            "department": department,
            "confidence": round(float(confidence), 4),
            "ticket_id": ticket["id"],
            "status": "Ticket routed successfully",
            "timestamp": ticket["timestamp"]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# GET /tickets
# ─────────────────────────────────────────────
@app.route('/tickets', methods=['GET'])
def get_tickets():
    try:
        dept_filter = request.args.get('department', '').strip()

        if dept_filter and dept_filter.lower() not in ['all', '']:
            filtered = [t for t in tickets
                        if t['department'].lower() == dept_filter.lower()]
        else:
            filtered = list(tickets)

        filtered.sort(key=lambda x: x['timestamp'], reverse=True)

        return jsonify({
            "tickets": filtered,
            "total": len(filtered),
            "all_count": len(tickets)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# GET /departments
# ─────────────────────────────────────────────
@app.route('/departments', methods=['GET'])
def get_departments():
    from model_loader import DEPARTMENTS
    return jsonify({"departments": ["All"] + DEPARTMENTS})


# ─────────────────────────────────────────────
# POST /feedback
# ─────────────────────────────────────────────
@app.route('/feedback', methods=['POST'])
def feedback():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        ticket_id = str(data.get('ticket_id', '')).strip()
        correct_department = str(data.get('correct_department', '')).strip()

        if not ticket_id or not correct_department:
            return jsonify({"error": "ticket_id and correct_department are required"}), 400

        for ticket in tickets:
            if ticket['id'] == ticket_id:
                ticket['department'] = correct_department
                ticket['overridden'] = True
                return jsonify({
                    "status": "success",
                    "message": f"Ticket {ticket_id} reassigned to '{correct_department}'",
                    "ticket_id": ticket_id
                })

        return jsonify({"error": f"Ticket '{ticket_id}' not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# GET /stats
# ─────────────────────────────────────────────
@app.route('/stats', methods=['GET'])
def get_stats():
    try:
        from model_loader import DEPARTMENTS
        dept_counts = {dept: 0 for dept in DEPARTMENTS}

        for ticket in tickets:
            dept = ticket['department']
            dept_counts[dept] = dept_counts.get(dept, 0) + 1

        avg_conf = (
            sum(t['confidence'] for t in tickets) / len(tickets)
            if tickets else 0.0
        )

        return jsonify({
            "total_tickets": len(tickets),
            "department_distribution": dept_counts,
            "average_confidence": round(avg_conf, 4),
            "overridden_count": sum(1 for t in tickets if t.get('overridden', False))
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
