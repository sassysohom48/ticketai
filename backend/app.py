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
import hashlib
import jwt
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from functools import wraps

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from model_loader import ModelLoader

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

JWT_SECRET = os.environ.get('JWT_SECRET', 'ticketai-secret-key-change-in-production')
JWT_EXPIRY_HOURS = 24

# ── Gmail config ──────────────────────────────────────────────────────────
GMAIL_USER     = os.environ.get('GMAIL_USER', '')
GMAIL_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD', '')
ADMIN_EMAIL    = os.environ.get('ADMIN_EMAIL', 'sohom.m@somaiya.edu')
SUPPORT_PHONE  = '+91 99671 64411'

# ─────────────────────────────────────────────
# In-memory stores
# ─────────────────────────────────────────────
tickets = []
users   = {}   # username -> user dict


def _hash(pw):
    return hashlib.sha256(pw.encode()).hexdigest()


# ─────────────────────────────────────────────
# Email helpers
# ─────────────────────────────────────────────
def _send_raw(to: str, subject: str, html: str):
    """Send one HTML email via Gmail SMTP. Runs in its own thread."""
    if not GMAIL_USER or not GMAIL_PASSWORD:
        return
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = f'TicketAI <{GMAIL_USER}>'
        msg['To']      = to
        msg.attach(MIMEText(html, 'html'))
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as srv:
            srv.login(GMAIL_USER, GMAIL_PASSWORD)
            srv.sendmail(GMAIL_USER, to, msg.as_string())
        print(f'  Email sent → {to}', flush=True)
    except Exception as exc:
        print(f'  Email error ({to}): {exc}', flush=True)


def _send_async(to: str, subject: str, html: str):
    """Fire-and-forget email sending (non-blocking)."""
    threading.Thread(target=_send_raw, args=(to, subject, html), daemon=True).start()


def _user_ticket_email(ticket: dict, user_email: str) -> str:
    conf_pct = round(ticket['confidence'] * 100)
    return f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8f9ff;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;
            box-shadow:0 4px 24px rgba(99,102,241,.12);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🎫 Your ticket has been routed!</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:14px;">
      Ticket <strong>#{ticket['id']}</strong> &nbsp;·&nbsp; {datetime.now().strftime('%d %b %Y, %I:%M %p')}
    </p>
  </div>

  <!-- Body -->
  <div style="padding:28px 32px;">
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
      Hi <strong>{ticket.get('username','there')}</strong>, our AI has analysed your support request and
      routed it to the correct department. Here's a summary:
    </p>

    <!-- Ticket details -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="padding:10px 14px;background:#f5f3ff;border-radius:8px 8px 0 0;
                   color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Subject</td>
        <td style="padding:10px 14px;background:#f5f3ff;border-radius:8px 8px 0 0;
                   color:#111827;font-size:14px;font-weight:600;">{ticket['subject']}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Department</td>
        <td style="padding:10px 14px;color:#6366f1;font-size:14px;font-weight:700;">{ticket['department']}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#f9fafb;border-radius:0 0 8px 8px;
                   color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">AI Confidence</td>
        <td style="padding:10px 14px;background:#f9fafb;border-radius:0 0 8px 8px;
                   color:#059669;font-size:14px;font-weight:700;">{conf_pct}%</td>
      </tr>
    </table>

    <!-- Progress -->
    <div style="background:#f5f3ff;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;color:#6366f1;font-size:13px;font-weight:700;">📍 Current Status</p>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        {"".join([
          f'<span style="background:#6366f1;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">✓ {s}</span>'
          if i <= 1 else
          f'<span style="background:#e5e7eb;color:#9ca3af;padding:4px 10px;border-radius:20px;font-size:11px;">{s}</span>'
          for i,s in enumerate(["Submitted","AI Routed","Under Review","Resolved"])
        ])}
      </div>
    </div>

    <!-- Support -->
    <div style="border-top:1px solid #f3f4f6;padding-top:20px;">
      <p style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:600;">
        💬 Do you want more help? Connect with us at:
      </p>
      <p style="margin:4px 0;color:#374151;font-size:14px;">
        📞 <a href="tel:{SUPPORT_PHONE}" style="color:#6366f1;font-weight:700;text-decoration:none;">{SUPPORT_PHONE}</a>
      </p>
      <p style="margin:4px 0;color:#374151;font-size:14px;">
        ✉️ <a href="mailto:{ADMIN_EMAIL}" style="color:#6366f1;font-weight:700;text-decoration:none;">{ADMIN_EMAIL}</a>
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f9fafb;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#9ca3af;font-size:11px;">
      TicketAI · BERT-Powered Routing · This is an automated notification.
    </p>
  </div>
</div>
</body>
</html>"""


def _admin_ticket_email(ticket: dict) -> str:
    conf_pct = round(ticket['confidence'] * 100)
    return f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8f9ff;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;
            box-shadow:0 4px 24px rgba(99,102,241,.12);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#111827,#374151);padding:28px 32px;">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">🔔 New Support Ticket Received</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.6);font-size:13px;">
      Admin Notification · {datetime.now().strftime('%d %b %Y, %I:%M %p')}
    </p>
  </div>

  <div style="padding:28px 32px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:12px;
                     font-weight:600;text-transform:uppercase;width:130px;">Ticket ID</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;
                     font-weight:700;font-family:monospace;">#{ticket['id']}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">User</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;">{ticket.get('username','—')}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Subject</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:600;">{ticket['subject']}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Routed To</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6366f1;font-size:14px;font-weight:700;">{ticket['department']}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Confidence</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#059669;font-size:14px;font-weight:700;">{conf_pct}%</td></tr>
      <tr><td style="padding:10px 0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;vertical-align:top;">Message</td>
          <td style="padding:10px 0;color:#374151;font-size:13px;line-height:1.6;">{ticket['message'][:400]}</td></tr>
    </table>
  </div>

  <div style="background:#f9fafb;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#9ca3af;font-size:11px;">TicketAI Admin Notification · Do not reply.</p>
  </div>
</div>
</body>
</html>"""


def send_ticket_emails(ticket: dict, user_email: str):
    """Send ticket confirmation to user + notification to admin (non-blocking)."""
    if user_email:
        _send_async(
            user_email,
            f"[TicketAI] Ticket #{ticket['id']} routed to {ticket['department']}",
            _user_ticket_email(ticket, user_email)
        )
    _send_async(
        ADMIN_EMAIL,
        f"[TicketAI] New ticket #{ticket['id']} from {ticket.get('username','?')} → {ticket['department']}",
        _admin_ticket_email(ticket)
    )


def _seed_admin():
    users['admin'] = {
        'id':            str(uuid.uuid4()),
        'username':      'admin',
        'email':         'admin@ticketai.com',
        'phone':         '',
        'password_hash': _hash('admin123'),
        'role':          'admin',
        'created_at':    datetime.now().isoformat(),
    }

_seed_admin()

# Load model at startup
print("=" * 50, flush=True)
print("  AI Ticket Router - Loading Model...", flush=True)
print("=" * 50, flush=True)
model = ModelLoader()
print(f"  Model type : {model.model_type}", flush=True)
print(f"  Status     : {'Ready' if model.is_loaded else 'Error'}", flush=True)
print("=" * 50, flush=True)


# ─────────────────────────────────────────────
# JWT helpers
# ─────────────────────────────────────────────
def _make_token(user):
    payload = {
        'user_id':  user['id'],
        'username': user['username'],
        'role':     user['role'],
        'exp':      datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def _decode_token():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    token = auth[7:]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not _decode_token():
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        payload = _decode_token()
        if not payload:
            return jsonify({'error': 'Authentication required'}), 401
        if payload.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


def _user_info(user):
    return {
        'id':       user['id'],
        'username': user['username'],
        'email':    user['email'],
        'phone':    user['phone'],
        'role':     user['role'],
    }


# ─────────────────────────────────────────────
# POST /auth/register
# ─────────────────────────────────────────────
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON body provided'}), 400

    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip()
    email    = str(data.get('email',    '')).strip()
    phone    = str(data.get('phone',    '')).strip()

    if not username or not password or not email:
        return jsonify({'error': 'username, password, and email are required'}), 400
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if username in users:
        return jsonify({'error': 'Username already taken'}), 409
    for u in users.values():
        if u['email'].lower() == email.lower():
            return jsonify({'error': 'Email already registered'}), 409

    user = {
        'id':            str(uuid.uuid4()),
        'username':      username,
        'email':         email,
        'phone':         phone,
        'password_hash': _hash(password),
        'role':          'user',
        'created_at':    datetime.now().isoformat(),
    }
    users[username] = user

    token = _make_token(user)
    return jsonify({'token': token, 'user': _user_info(user)}), 201


# ─────────────────────────────────────────────
# POST /auth/login
# ─────────────────────────────────────────────
@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON body provided'}), 400

    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip()

    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400

    user = users.get(username)
    if not user or user['password_hash'] != _hash(password):
        return jsonify({'error': 'Invalid username or password'}), 401

    token = _make_token(user)
    return jsonify({'token': token, 'user': _user_info(user)})


# ─────────────────────────────────────────────
# GET /health  (public)
# ─────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "running",
        "model": model.model_type,
        "tickets_processed": len(tickets)
    })


# ─────────────────────────────────────────────
# POST /predict  (requires auth)
# ─────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
@require_auth
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        current = _decode_token()
        subject = str(data.get('subject', '')).strip()
        message = str(data.get('message', '')).strip()

        if not subject and not message:
            return jsonify({"error": "subject or message is required"}), 400

        combined = f"{subject}. {message}".strip('. ')
        department, confidence = model.predict(combined)

        ticket = {
            "id":                  str(uuid.uuid4())[:8].upper(),
            "subject":             subject or "(No subject)",
            "message":             message[:500],
            "department":          department,
            "confidence":          round(float(confidence), 4),
            "timestamp":           datetime.now().isoformat(),
            "overridden":          False,
            "original_department": department,
            "status":              "Open",
            "user_id":             current['user_id'],
            "username":            current['username'],
        }
        tickets.append(ticket)

        # Fire emails (non-blocking)
        user_obj   = users.get(current['username'], {})
        user_email = user_obj.get('email', '')
        send_ticket_emails(ticket, user_email)

        return jsonify({
            "department": department,
            "confidence": round(float(confidence), 4),
            "ticket_id":  ticket["id"],
            "status":     "Ticket routed successfully",
            "timestamp":  ticket["timestamp"],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# GET /tickets  (admin only)
# ─────────────────────────────────────────────
@app.route('/tickets', methods=['GET'])
@require_admin
def get_tickets():
    try:
        dept_filter = request.args.get('department', '').strip()
        if dept_filter and dept_filter.lower() not in ['all', '']:
            filtered = [t for t in tickets
                        if t['department'].lower() == dept_filter.lower()]
        else:
            filtered = list(tickets)

        filtered.sort(key=lambda x: x['timestamp'], reverse=True)
        return jsonify({"tickets": filtered, "total": len(filtered), "all_count": len(tickets)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# GET /user/tickets  (any authenticated user)
# ─────────────────────────────────────────────
@app.route('/user/tickets', methods=['GET'])
@require_auth
def get_user_tickets():
    try:
        current = _decode_token()
        mine = [t for t in tickets if t.get('user_id') == current['user_id']]
        mine.sort(key=lambda x: x['timestamp'], reverse=True)
        return jsonify({"tickets": mine, "total": len(mine)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# GET /departments  (public)
# ─────────────────────────────────────────────
@app.route('/departments', methods=['GET'])
def get_departments():
    from model_loader import DEPARTMENTS
    return jsonify({"departments": ["All"] + DEPARTMENTS})


# ─────────────────────────────────────────────
# POST /feedback  (admin only)
# ─────────────────────────────────────────────
@app.route('/feedback', methods=['POST'])
@require_admin
def feedback():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        ticket_id          = str(data.get('ticket_id',          '')).strip()
        correct_department = str(data.get('correct_department', '')).strip()

        if not ticket_id or not correct_department:
            return jsonify({"error": "ticket_id and correct_department are required"}), 400

        for ticket in tickets:
            if ticket['id'] == ticket_id:
                ticket['department'] = correct_department
                ticket['overridden'] = True
                return jsonify({
                    "status":    "success",
                    "message":   f"Ticket {ticket_id} reassigned to '{correct_department}'",
                    "ticket_id": ticket_id,
                })

        return jsonify({"error": f"Ticket '{ticket_id}' not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# GET /stats  (admin only)
# ─────────────────────────────────────────────
@app.route('/stats', methods=['GET'])
@require_admin
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
            "total_tickets":           len(tickets),
            "department_distribution": dept_counts,
            "average_confidence":      round(avg_conf, 4),
            "overridden_count":        sum(1 for t in tickets if t.get('overridden', False)),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
