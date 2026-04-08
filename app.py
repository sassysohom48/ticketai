import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import datetime
from backend import predict_ticket

# 1. PAGE CONFIGURATION
st.set_page_config(
    page_title="SmartRoute Enterprise AI",
    page_icon="🛡️",
    layout="wide"
)

# 2. THEME & ANIMATIONS
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    /* ── ROOT VARIABLES ── */
    :root {
        --bg-base:       #080C14;
        --bg-surface:    #0D1321;
        --bg-card:       rgba(255,255,255,0.04);
        --border:        rgba(99,179,237,0.15);
        --accent:        #63B3ED;
        --accent-glow:   rgba(99,179,237,0.25);
        --accent-2:      #9F7AEA;
        --success:       #48BB78;
        --warning:       #ED8936;
        --danger:        #FC8181;
        --text-primary:  #E2E8F0;
        --text-muted:    #718096;
        --sidebar-width: 260px;
    }

    /* ── BASE ── */
    * { box-sizing: border-box; }

    html, body, [data-testid="stAppViewContainer"] {
        background-color: var(--bg-base) !important;
        font-family: 'Inter', sans-serif !important;
        color: var(--text-primary) !important;
    }

    [data-testid="stAppViewContainer"] > .main {
        background-color: var(--bg-base) !important;
    }

    .main .block-container {
        padding: 2rem 2.5rem !important;
        max-width: 1400px;
    }

    /* ── SIDEBAR ── */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0D1321 0%, #080C14 100%) !important;
        border-right: 1px solid var(--border) !important;
        box-shadow: 4px 0 24px rgba(0,0,0,0.4) !important;
    }

    [data-testid="stSidebar"]::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--accent), transparent);
    }

    [data-testid="stSidebar"] * {
        color: var(--text-primary) !important;
    }

    /* Sidebar radio buttons */
    [data-testid="stSidebar"] [data-testid="stRadio"] label {
        background: transparent;
        padding: 10px 14px;
        border-radius: 8px;
        display: block;
        transition: all 0.2s ease;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid transparent;
    }

    [data-testid="stSidebar"] [data-testid="stRadio"] label:hover {
        background: var(--accent-glow) !important;
        border-color: var(--border) !important;
    }

    [data-testid="stSidebar"] [data-testid="stRadio"] [aria-checked="true"] + label,
    [data-testid="stSidebar"] [data-testid="stRadio"] label:has(input:checked) {
        background: var(--accent-glow) !important;
        border-color: var(--accent) !important;
        color: var(--accent) !important;
    }

    /* ── KEYFRAME ANIMATIONS ── */
    @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
    }

    @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 8px var(--accent-glow); }
        50%       { box-shadow: 0 0 24px var(--accent-glow), 0 0 48px rgba(99,179,237,0.1); }
    }

    @keyframes shimmer {
        0%   { background-position: -200% center; }
        100% { background-position:  200% center; }
    }

    @keyframes borderGlow {
        0%, 100% { border-color: rgba(99,179,237,0.15); }
        50%       { border-color: rgba(99,179,237,0.45); }
    }

    @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-16px); }
        to   { opacity: 1; transform: translateX(0); }
    }

    /* ── PAGE TITLE ── */
    h1 {
        font-family: 'Inter', sans-serif !important;
        font-weight: 800 !important;
        font-size: 2rem !important;
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        animation: fadeSlideUp 0.5s ease both;
        margin-bottom: 1.5rem !important;
        letter-spacing: -0.5px;
    }

    h2, h3 {
        font-family: 'Inter', sans-serif !important;
        color: var(--text-primary) !important;
        font-weight: 600 !important;
        animation: fadeSlideUp 0.5s ease 0.1s both;
    }

    /* ── CARDS ── */
    .glass-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 24px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        animation: fadeSlideUp 0.5s ease both;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .glass-card:hover {
        border-color: rgba(99,179,237,0.35);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }

    /* ── METRIC CARDS ── */
    [data-testid="stMetric"] {
        background: var(--bg-card) !important;
        border: 1px solid var(--border) !important;
        border-radius: 14px !important;
        padding: 20px 24px !important;
        animation: fadeSlideUp 0.5s ease both !important;
        transition: all 0.3s ease !important;
    }

    [data-testid="stMetric"]:hover {
        border-color: var(--accent) !important;
        box-shadow: 0 0 20px var(--accent-glow) !important;
        transform: translateY(-2px);
    }

    [data-testid="stMetricLabel"] {
        color: var(--text-muted) !important;
        font-size: 0.78rem !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
    }

    [data-testid="stMetricValue"] {
        color: var(--accent) !important;
        font-size: 2rem !important;
        font-weight: 700 !important;
        font-family: 'JetBrains Mono', monospace !important;
    }

    /* ── FORM ELEMENTS ── */
    [data-testid="stTextInput"] input,
    [data-testid="stTextArea"] textarea {
        background: rgba(255,255,255,0.03) !important;
        border: 1px solid var(--border) !important;
        border-radius: 10px !important;
        color: var(--text-primary) !important;
        font-family: 'Inter', sans-serif !important;
        font-size: 0.9rem !important;
        transition: all 0.2s ease !important;
        padding: 12px 14px !important;
    }

    [data-testid="stTextInput"] input:focus,
    [data-testid="stTextArea"] textarea:focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 3px var(--accent-glow) !important;
        background: rgba(99,179,237,0.04) !important;
        outline: none !important;
    }

    [data-testid="stTextInput"] label,
    [data-testid="stTextArea"] label {
        color: var(--text-muted) !important;
        font-size: 0.8rem !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.06em !important;
        margin-bottom: 6px !important;
    }

    /* ── SELECT SLIDER ── */
    [data-testid="stSlider"] {
        padding: 8px 0 !important;
    }

    [data-testid="stSlider"] [data-testid="stSliderThumb"] {
        background: var(--accent) !important;
        border: 2px solid var(--bg-base) !important;
        box-shadow: 0 0 10px var(--accent-glow) !important;
    }

    [data-testid="stSlider"] [role="slider"] {
        accent-color: var(--accent) !important;
    }

    /* ── SUBMIT BUTTON ── */
    [data-testid="stFormSubmitButton"] button {
        width: 100% !important;
        background: linear-gradient(135deg, #3182CE 0%, #7C3AED 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 10px !important;
        padding: 14px 28px !important;
        font-family: 'Inter', sans-serif !important;
        font-size: 0.95rem !important;
        font-weight: 700 !important;
        letter-spacing: 0.05em !important;
        text-transform: uppercase !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        position: relative;
        overflow: hidden;
        margin-top: 8px !important;
    }

    [data-testid="stFormSubmitButton"] button::before {
        content: '';
        position: absolute;
        top: 0; left: -100%;
        width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
        transition: left 0.4s ease;
    }

    [data-testid="stFormSubmitButton"] button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 24px rgba(49,130,206,0.4) !important;
    }

    [data-testid="stFormSubmitButton"] button:hover::before {
        left: 100%;
    }

    [data-testid="stFormSubmitButton"] button:active {
        transform: translateY(0) !important;
    }

    /* ── GENERIC BUTTONS ── */
    [data-testid="stButton"] button {
        background: transparent !important;
        border: 1px solid var(--border) !important;
        border-radius: 8px !important;
        color: var(--text-primary) !important;
        font-family: 'Inter', sans-serif !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
    }

    [data-testid="stButton"] button:hover {
        border-color: var(--accent) !important;
        color: var(--accent) !important;
        box-shadow: 0 0 12px var(--accent-glow) !important;
    }

    /* ── DOWNLOAD BUTTON ── */
    [data-testid="stDownloadButton"] button {
        background: linear-gradient(135deg, rgba(72,187,120,0.15), rgba(72,187,120,0.05)) !important;
        border: 1px solid rgba(72,187,120,0.3) !important;
        border-radius: 10px !important;
        color: var(--success) !important;
        font-weight: 600 !important;
        transition: all 0.25s ease !important;
    }

    [data-testid="stDownloadButton"] button:hover {
        background: rgba(72,187,120,0.2) !important;
        box-shadow: 0 0 16px rgba(72,187,120,0.25) !important;
        transform: translateY(-1px);
    }

    /* ── ALERTS ── */
    [data-testid="stAlert"] {
        border-radius: 12px !important;
        border: none !important;
        animation: fadeSlideUp 0.4s ease both !important;
    }

    [data-testid="stAlert"][data-baseweb="notification"] {
        background: rgba(72,187,120,0.1) !important;
        border-left: 3px solid var(--success) !important;
    }

    /* ── DATAFRAME ── */
    [data-testid="stDataFrame"] {
        border-radius: 14px !important;
        overflow: hidden !important;
        border: 1px solid var(--border) !important;
        animation: fadeSlideUp 0.5s ease both !important;
    }

    [data-testid="stDataFrame"] iframe {
        border-radius: 14px !important;
    }

    /* ── DIVIDER ── */
    hr {
        border: none !important;
        height: 1px !important;
        background: linear-gradient(90deg, transparent, var(--border), transparent) !important;
        margin: 1.5rem 0 !important;
    }

    /* ── PLOTLY CHARTS ── */
    .stPlotlyChart {
        border-radius: 14px !important;
        overflow: hidden !important;
        border: 1px solid var(--border) !important;
        animation: fadeSlideUp 0.5s ease 0.15s both !important;
    }

    /* ── SUCCESS / WARNING / INFO BOXES ── */
    .stSuccess {
        background: rgba(72,187,120,0.08) !important;
        border: 1px solid rgba(72,187,120,0.25) !important;
        border-radius: 12px !important;
        color: var(--success) !important;
    }

    .stWarning {
        background: rgba(237,137,54,0.08) !important;
        border: 1px solid rgba(237,137,54,0.25) !important;
        border-radius: 12px !important;
        color: var(--warning) !important;
    }

    .stInfo {
        background: rgba(99,179,237,0.06) !important;
        border: 1px solid var(--border) !important;
        border-radius: 12px !important;
        color: var(--text-muted) !important;
    }

    /* ── CAPTION / MISC TEXT ── */
    .stCaption, caption {
        color: var(--text-muted) !important;
        font-size: 0.78rem !important;
    }

    /* ── SEARCH INPUT ── */
    [data-testid="stTextInput"][aria-label="Quick Search"] input {
        background: rgba(255,255,255,0.03) !important;
    }

    /* ── SCROLLBAR ── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg-base); }
    ::-webkit-scrollbar-thumb { background: #2D3748; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent); }

    /* ── SIDEBAR TITLE ── */
    [data-testid="stSidebar"] h1 {
        font-size: 1.3rem !important;
        font-weight: 700 !important;
        -webkit-text-fill-color: var(--text-primary) !important;
        background: none !important;
        letter-spacing: 0.02em;
        animation: none !important;
    }

    /* ── STATUS BADGE ── */
    .status-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        background: rgba(99,179,237,0.12);
        border: 1px solid rgba(99,179,237,0.3);
        color: var(--accent);
        animation: glowPulse 3s ease-in-out infinite;
    }

    /* ── LOW CONF BADGE ── */
    .low-conf {
        background: rgba(237,137,54,0.12) !important;
        border: 1px solid rgba(237,137,54,0.35) !important;
        color: var(--warning) !important;
        padding: 4px 12px !important;
        border-radius: 6px !important;
        font-size: 0.8rem !important;
        font-weight: 600 !important;
    }

    /* ── SECTION HEADER RULE ── */
    .section-rule {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 1.2rem;
    }

    .section-rule::after {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, var(--border), transparent);
    }

    /* ── FORM WRAPPER ── */
    [data-testid="stForm"] {
        background: var(--bg-card) !important;
        border: 1px solid var(--border) !important;
        border-radius: 16px !important;
        padding: 28px !important;
        animation: fadeSlideUp 0.5s ease both !important;
    }

    /* ── SELECT SLIDER TRACK ── */
    [data-testid="stSlider"] > div > div > div {
        background: linear-gradient(90deg, #3182CE, #7C3AED) !important;
    }

    /* ── ANIMATIONS FOR COLUMNS ── */
    [data-testid="column"]:nth-child(1) { animation: slideInLeft 0.45s ease both; }
    [data-testid="column"]:nth-child(2) { animation: slideInLeft 0.5s ease 0.05s both; }
    [data-testid="column"]:nth-child(3) { animation: slideInLeft 0.5s ease 0.1s both; }

    </style>
""", unsafe_allow_html=True)

# 3. STATE MANAGEMENT
if 'tickets' not in st.session_state:
    st.session_state.tickets = []

# 4. SIDEBAR
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/2103/2103633.png", width=72)
    st.title("SmartRoute Pro")
    st.markdown('<div class="status-badge">● BERT Model Active</div>', unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)
    menu = st.radio("MAIN MENU", ["🚀 Submission Terminal", "📊 Analytics Command", "📋 Global Logs"])
    st.divider()
    st.caption("v2.1  ·  Enterprise Edition")

# --- FEATURE 1: SUBMISSION TERMINAL ---
if menu == "🚀 Submission Terminal":
    st.title("🚀 Smart Submission Terminal")

    col1, col2 = st.columns([2, 1], gap="large")

    with col1:
        with st.form("main_form"):
            subject = st.text_input("Incident Subject")
            message = st.text_area("Incident Details (The AI will analyze this)", height=200)
            priority = st.select_slider("Priority", ["P3 (Low)", "P2 (Mid)", "P1 (High)"])
            submit = st.form_submit_button("⚡  ANALYZE & ROUTE")

            if submit:
                if subject and message:
                    dept, conf = predict_ticket(message)
                    new_t = {
                        "ID": f"TIC-{len(st.session_state.tickets)+101}",
                        "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
                        "Subject": subject,
                        "Message": message,
                        "Dept": dept,
                        "Confidence": round(conf, 4),
                        "Priority": priority,
                        "Status": "Unassigned"
                    }
                    st.session_state.tickets.append(new_t)
                    st.toast(f"Ticket routed to {dept}", icon="🤖")
                else:
                    st.error("Fields cannot be empty.")

    with col2:
        st.subheader("System Feedback")
        if st.session_state.tickets:
            last = st.session_state.tickets[-1]
            st.success(f"**Latest Prediction:** {last['Dept']}")
            st.metric("AI Confidence", f"{last['Confidence']*100:.1f}%")
            if last['Confidence'] < 0.80:
                st.warning("⚠️ Low confidence — manual review flagged.")
        else:
            st.info("Awaiting input for analysis...")

# --- FEATURE 2: ANALYTICS COMMAND ---
elif menu == "📊 Analytics Command":
    st.title("📊 AI Performance & Routing Analytics")

    if not st.session_state.tickets:
        st.info("Submit tickets first to see analytics.")
    else:
        df = pd.DataFrame(st.session_state.tickets)

        c1, c2, c3 = st.columns(3)
        c1.metric("Total Volume", len(df))
        c2.metric("Avg AI Confidence", f"{df['Confidence'].mean()*100:.1f}%")
        c3.metric("Critical P1s", len(df[df['Priority'] == "P1 (High)"]))

        st.divider()
        g1, g2 = st.columns(2, gap="large")

        with g1:
            st.subheader("Tickets by Department")
            fig_dept = px.pie(
                df, names='Dept', hole=0.45,
                color_discrete_sequence=["#63B3ED", "#9F7AEA", "#48BB78", "#ED8936", "#FC8181"]
            )
            fig_dept.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#E2E8F0", family="Inter"),
                legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0")),
                margin=dict(t=20, b=20, l=10, r=10)
            )
            st.plotly_chart(fig_dept, use_container_width=True)

        with g2:
            st.subheader("Confidence Trend")
            fig_conf = px.bar(
                df, x='ID', y='Confidence', color='Dept', barmode='group',
                color_discrete_sequence=["#63B3ED", "#9F7AEA", "#48BB78", "#ED8936", "#FC8181"]
            )
            fig_conf.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#E2E8F0", family="Inter"),
                legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0")),
                xaxis=dict(gridcolor="rgba(255,255,255,0.05)"),
                yaxis=dict(gridcolor="rgba(255,255,255,0.05)"),
                margin=dict(t=20, b=20, l=10, r=10)
            )
            st.plotly_chart(fig_conf, use_container_width=True)

# --- FEATURE 3: GLOBAL LOGS & EXPORT ---
elif menu == "📋 Global Logs":
    st.title("📋 Global Incident Logs")

    if st.session_state.tickets:
        df = pd.DataFrame(st.session_state.tickets)

        search = st.text_input("Quick Search", placeholder="Type to filter...")
        if search:
            df = df[df['Subject'].str.contains(search, case=False) | df['Message'].str.contains(search, case=False)]

        st.dataframe(df, use_container_width=True, hide_index=True)

        csv = df.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="📥 Download Dataset (CSV)",
            data=csv,
            file_name='ticket_logs.csv',
            mime='text/csv',
        )
    else:
        st.info("No logs available yet.")

# SIDEBAR FOOTER
if st.sidebar.button("⟳  RESET SYSTEM"):
    st.session_state.tickets = []
    st.rerun()
