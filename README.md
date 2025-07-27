# 🌐 IP Configuration Dashboard

A powerful Flask-based dashboard to manage and simulate IP configurations, including Static IP setup, DHCP, SSH/SCP simulation, traceroute, and real-time system/network information — with logging support using MongoDB.

---

## 🚀 Features

- ✅ **Static IP Configuration** via form input
- 🔄 **DHCP Simulation**
- 🔧 **Real-Time System & Network Info** using `socket`, `psutil`, and `platform`
- 📡 **Traceroute and Ping** functionality
- 🛜 **SSH/SCP Simulation** (for demo/testing)
- 📝 **MongoDB Logging** of all actions & configurations
- 🎨 **Beautiful Bootstrap UI** with card-based layout

---

## 📁 Project Structure

```bash
├── app.py                   # Main Flask backend
├── templates/
│   └── index.html           # Frontend UI with Bootstrap
├── static/
│   ├── style.css            # Custom styles
├── requirements.txt         # Dependencies
├── README.md                # Project documentation
